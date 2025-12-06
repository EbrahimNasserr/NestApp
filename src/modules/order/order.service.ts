import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import {
  CartDocument,
  CartRepo,
  CouponDocument,
  CouponRepo,
  OrderDocument,
  OrderProduct,
  OrderRepo,
  ProductDocument,
  ProductRepo,
  UserDocument,
} from 'src/DB';
import {
  DiscountTypeEnum,
  OrderStatusPriorityEnum,
  PaymentTypeEnum,
} from 'src/common/enums';
import { Types } from 'mongoose';
import { CartService } from '../cart/cart.service';
import { PaymentService } from 'src/common/services';
import Stripe from 'stripe';

@Injectable()
export class OrderService {
  constructor(
    private readonly orderRepo: OrderRepo,
    private readonly couponRepo: CouponRepo,
    private readonly productRepo: ProductRepo,
    private readonly cartRepo: CartRepo,
    private readonly cartService: CartService,
    private readonly paymentService: PaymentService,
  ) {}

  /**
   * Creates a new order from the user's cart
   * @param createOrderDto - Order creation data including address, phone, payment type, and optional coupon
   * @param user - The authenticated user creating the order
   * @returns The created order document
   */
  async create(
    createOrderDto: CreateOrderDto,
    user: UserDocument,
  ): Promise<OrderDocument> {
    // Step 1: Validate and fetch cart
    const cart = await this.validateAndGetCart(user._id);

    // Step 2: Validate and apply coupon if provided
    const coupon = await this.validateAndGetCoupon(
      createOrderDto.coupon,
      user._id,
    );

    // Step 3: Validate products and calculate order totals
    const { products, subTotalPrice } =
      await this.validateProductsAndCalculateTotals(cart.products);

    // Step 4: Calculate discount if coupon is valid
    const discount = this.calculateDiscount(coupon, subTotalPrice);

    // Step 5: Create order
    const order = await this.createOrder({
      ...createOrderDto,
      coupon: coupon?._id,
      createdBy: user._id,
      discount,
      products,
      subTotalPrice,
      totalPrice: subTotalPrice - discount,
    });

    // Step 6: Update coupon usage if applicable
    if (coupon) {
      await this.markCouponAsUsed(coupon, user._id);
    }

    // Step 7: Update product inventory
    await this.updateProductInventory(cart.products);

    // Step 8: Clear cart
    await this.cartService.clearCart(user);

    return order;
  }

  /**
   * Creates a checkout session for an order
   */
  async checkout(
    orderId: string,
    user: UserDocument,
  ): Promise<Stripe.Response<Stripe.Checkout.Session>> {
    // Try to find order by orderId field first (e.g., "userId-timestamp")
    // If orderId is a valid MongoDB ObjectId, also try searching by _id
    let order: OrderDocument | null = null;

    // Check if orderId is a valid MongoDB ObjectId (24 hex characters)
    const isValidObjectId =
      Types.ObjectId.isValid(orderId) && orderId.length === 24;

    // For CARD payments, orders are created with PROCESSING status
    // Allow both PENDING and PROCESSING statuses for checkout
    const allowedStatuses = [
      OrderStatusPriorityEnum.PENDING,
      OrderStatusPriorityEnum.PROCESSING,
    ];

    if (isValidObjectId) {
      // Try finding by _id first
      order = await this.orderRepo.findOne({
        filter: {
          _id: new Types.ObjectId(orderId),
          createdBy: user._id,
          paymentType: PaymentTypeEnum.CARD,
          status: { $in: allowedStatuses },
        },
        options: {
          populate: {
            path: 'products.productId',
            select: 'name',
          },
        },
      });
    }

    // If not found by _id or orderId is not a valid ObjectId, try by orderId field
    if (!order) {
      order = await this.orderRepo.findOne({
        filter: {
          orderId: orderId,
          createdBy: user._id,
          paymentType: PaymentTypeEnum.CARD,
          status: { $in: allowedStatuses },
        },
        options: {
          populate: {
            path: 'products.productId',
            select: 'name',
          },
        },
      });
    }

    if (!order) {
      // Check if order exists at all (without filters) to provide better error message
      let orderExists: OrderDocument | null = null;

      if (isValidObjectId) {
        orderExists = await this.orderRepo.findOne({
          filter: {
            _id: new Types.ObjectId(orderId),
            createdBy: user._id,
          },
        });
      }

      if (!orderExists) {
        orderExists = await this.orderRepo.findOne({
          filter: {
            orderId: orderId,
            createdBy: user._id,
          },
        });
      }

      if (!orderExists) {
        throw new NotFoundException(
          `Order with ID "${orderId}" not found for this user`,
        );
      }

      // Order exists but doesn't meet checkout criteria
      if (orderExists.paymentType !== PaymentTypeEnum.CARD) {
        throw new BadRequestException(
          `Order payment type is "${orderExists.paymentType}", but checkout is only available for CARD payments`,
        );
      }

      if (!allowedStatuses.includes(orderExists.status)) {
        throw new BadRequestException(
          `Order status is "${orderExists.status}", but checkout is only available for orders with status PENDING or PROCESSING`,
        );
      }

      // Fallback error
      throw new NotFoundException(
        'Order not found or not available for checkout',
      );
    }
    const session = await this.paymentService.checkoutSession({
      customer_email: user.email,
      metadata: {
        orderId: order.orderId || order._id.toString(),
      },
      line_items: order.products.map((product) => {
        return {
          quantity: product.quantity,
          price_data: {
            product_data: {
              name: (product.productId as ProductDocument).name,
            },
            unit_amount: product.unitPrice * 100,
            currency: 'egp',
          },
        };
      }),
    });
    return session;
  }

  /**
   * Validates that the user has a cart and returns it
   */
  private async validateAndGetCart(
    userId: Types.ObjectId,
  ): Promise<CartDocument> {
    const cart = await this.cartRepo.findOne({
      filter: { createdBy: userId as any },
    });

    if (!cart || !cart.products || cart.products.length === 0) {
      throw new NotFoundException('Cart is empty or not found');
    }

    return cart as CartDocument;
  }

  /**
   * Validates coupon if provided and checks eligibility
   * Accepts either coupon code (string) or coupon ID (ObjectId)
   */
  private async validateAndGetCoupon(
    couponInput: string | Types.ObjectId | { _id?: Types.ObjectId } | undefined,
    userId: Types.ObjectId,
  ): Promise<CouponDocument | null> {
    if (!couponInput) {
      return null;
    }

    const now = new Date();
    let coupon: CouponDocument | null = null;

    // Determine if input is ObjectId, coupon code (string), or ICoupon object
    if (couponInput instanceof Types.ObjectId) {
      // Search by ObjectId
      coupon = await this.couponRepo.findOne({
        filter: {
          _id: couponInput,
          startDate: { $lte: now },
          endDate: { $gte: now },
        },
      });
    } else if (typeof couponInput === 'string') {
      // Check if it's a valid ObjectId string
      if (Types.ObjectId.isValid(couponInput) && couponInput.length === 24) {
        // It's an ObjectId string, search by _id
        coupon = await this.couponRepo.findOne({
          filter: {
            _id: new Types.ObjectId(couponInput),
            startDate: { $lte: now },
            endDate: { $gte: now },
          },
        });
      } else {
        // It's a coupon code, search by code
        coupon = await this.couponRepo.findOne({
          filter: {
            code: couponInput,
            startDate: { $lte: now },
            endDate: { $gte: now },
          },
        });
      }
    } else if (
      couponInput &&
      typeof couponInput === 'object' &&
      '_id' in couponInput
    ) {
      // It's an ICoupon object
      const couponId = couponInput._id;
      if (couponId) {
        coupon = await this.couponRepo.findOne({
          filter: {
            _id:
              couponId instanceof Types.ObjectId
                ? couponId
                : new Types.ObjectId(couponId),
            startDate: { $lte: now },
            endDate: { $gte: now },
          },
        });
      }
    }

    if (!coupon) {
      // Check if coupon exists but is expired
      let existingCoupon: CouponDocument | null = null;

      if (typeof couponInput === 'string') {
        if (Types.ObjectId.isValid(couponInput) && couponInput.length === 24) {
          existingCoupon = await this.couponRepo.findOne({
            filter: { _id: new Types.ObjectId(couponInput) },
          });
        } else {
          existingCoupon = await this.couponRepo.findOne({
            filter: { code: couponInput },
          });
        }
      } else if (couponInput instanceof Types.ObjectId) {
        existingCoupon = await this.couponRepo.findOne({
          filter: { _id: couponInput },
        });
      }

      if (existingCoupon) {
        if (existingCoupon.endDate < now) {
          throw new BadRequestException(
            `Coupon "${existingCoupon.code}" has expired on ${existingCoupon.endDate.toISOString()}`,
          );
        }
        if (existingCoupon.startDate > now) {
          throw new BadRequestException(
            `Coupon "${existingCoupon.code}" is not yet active. It will be available from ${existingCoupon.startDate.toISOString()}`,
          );
        }
      }

      throw new BadRequestException(
        typeof couponInput === 'string' && !Types.ObjectId.isValid(couponInput)
          ? `Coupon code "${couponInput}" not found or expired`
          : 'Invalid or expired coupon',
      );
    }

    // Check if user has exceeded coupon usage limit
    const userUsageCount = this.getUserCouponUsageCount(coupon, userId);
    if (userUsageCount >= coupon.duration) {
      throw new BadRequestException(
        `Coupon "${coupon.code}" usage limit exceeded. You have used it ${userUsageCount} out of ${coupon.duration} times`,
      );
    }

    return coupon;
  }

  /**
   * Gets the number of times a user has used a coupon
   */
  private getUserCouponUsageCount(
    coupon: CouponDocument,
    userId: Types.ObjectId,
  ): number {
    if (!coupon.usedBy || coupon.usedBy.length === 0) {
      return 0;
    }

    const userIdString = userId.toString();
    return coupon.usedBy.filter((usedByUserId) => {
      if (!usedByUserId) return false;
      const usedById =
        typeof usedByUserId === 'string'
          ? usedByUserId
          : (usedByUserId as Types.ObjectId).toString();
      return usedById === userIdString;
    }).length;
  }

  /**
   * Validates all products in cart and calculates order totals
   */
  private async validateProductsAndCalculateTotals(
    cartProducts: Array<{ productId: Types.ObjectId; quantity: number }>,
  ): Promise<{ products: OrderProduct[]; subTotalPrice: number }> {
    const products: OrderProduct[] = [];
    let subTotalPrice = 0;

    for (const cartProduct of cartProducts) {
      const productDoc = await this.productRepo.findOne({
        filter: { _id: cartProduct.productId },
      });

      if (!productDoc) {
        throw new NotFoundException(
          `Product ${cartProduct.productId.toString()} not found`,
        );
      }

      if (productDoc.stock < cartProduct.quantity) {
        throw new BadRequestException(
          `Insufficient stock for product ${productDoc.name || cartProduct.productId.toString()}. Available: ${productDoc.stock}, Requested: ${cartProduct.quantity}`,
        );
      }

      const finalPrice = productDoc.salePrice * cartProduct.quantity;
      subTotalPrice += finalPrice;

      products.push({
        productId: productDoc._id,
        quantity: cartProduct.quantity,
        unitPrice: productDoc.salePrice,
        finalPrice,
      });
    }

    if (subTotalPrice <= 0) {
      throw new BadRequestException('Order total must be greater than zero');
    }

    return { products, subTotalPrice };
  }

  /**
   * Calculates discount amount based on coupon type
   */
  private calculateDiscount(
    coupon: CouponDocument | null,
    subTotalPrice: number,
  ): number {
    if (!coupon) {
      return 0;
    }

    if (coupon.discountType === DiscountTypeEnum.PERCENTAGE) {
      const discountAmount = (subTotalPrice * coupon.discount) / 100;
      // Ensure discount doesn't exceed total price
      return Math.min(discountAmount, subTotalPrice);
    }

    // Fixed amount discount
    return Math.min(coupon.discount, subTotalPrice);
  }

  /**
   * Creates the order document in the database
   */
  private async createOrder(orderData: {
    address: string;
    phone: string;
    note?: string;
    paymentType: PaymentTypeEnum;
    coupon?: Types.ObjectId;
    createdBy: Types.ObjectId;
    discount: number;
    products: OrderProduct[];
    subTotalPrice: number;
    totalPrice: number;
  }): Promise<OrderDocument> {
    const orderId = this.generateOrderId(orderData.createdBy);

    const orders = await this.orderRepo.create([
      {
        ...orderData,
        orderId,
      },
    ]);

    if (!orders || orders.length === 0) {
      throw new BadRequestException('Failed to create order');
    }

    return orders[0] as OrderDocument;
  }

  /**
   * Generates a unique order ID
   */
  private generateOrderId(userId: Types.ObjectId): string {
    return `${userId.toString()}-${Date.now()}`;
  }

  /**
   * Marks coupon as used by adding user to usedBy array
   */
  private async markCouponAsUsed(
    coupon: CouponDocument,
    userId: Types.ObjectId,
  ): Promise<void> {
    const usedByArray = (coupon.usedBy || []) as Types.ObjectId[];

    // Avoid duplicate entries
    const userIdString = userId.toString();
    const alreadyUsed = usedByArray.some((id) => {
      if (!id) return false;
      return id.toString() === userIdString;
    });

    if (!alreadyUsed) {
      usedByArray.push(userId);
      coupon.usedBy = usedByArray;
      await coupon.save();
    }
  }

  /**
   * Updates product inventory by decrementing stock
   */
  private async updateProductInventory(
    cartProducts: Array<{ productId: Types.ObjectId; quantity: number }>,
  ): Promise<void> {
    const updatePromises = cartProducts.map((cartProduct) =>
      this.productRepo.updateOne({
        filter: { _id: cartProduct.productId } as Record<string, unknown>,
        update: { $inc: { stock: -cartProduct.quantity } },
      }),
    );

    await Promise.all(updatePromises);
  }
}
