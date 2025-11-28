import {
  BadRequestException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateCartDto } from './dto/create-cart.dto';
import { CartRepo, ProductRepo } from 'src/DB/repo';
import type { UserDocument } from 'src/DB/models/user.model';
import type { CartDocument } from 'src/DB/models/cart.model';
import { RemoveCartProductDto } from './dto/update-cart.dto';
import { Types } from 'mongoose';

@Injectable()
export class CartService {
  constructor(
    private readonly cartRepo: CartRepo,
    private readonly productRepo: ProductRepo,
  ) {}
  async create(
    createCartDto: CreateCartDto,
    user: UserDocument,
  ): Promise<{
    statusCode: HttpStatus;
    message: string;
    data: CartDocument;
  }> {
    const product = await this.productRepo.findById({
      id: createCartDto.productId.toString(),
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    if (product.stock < createCartDto.quantity) {
      throw new BadRequestException(
        `can't add more than ${product.stock} products`,
      );
    }
    const cart = await this.cartRepo.findOne({
      filter: {
        createdBy: user._id,
      },
    });
    if (!cart) {
      const newCart = await this.cartRepo.create([
        {
          createdBy: user._id,
          products: [
            {
              productId: product._id,
              quantity: createCartDto.quantity,
            },
          ],
        },
      ]);
      if (!newCart || newCart.length === 0) {
        throw new BadRequestException('Failed to create cart');
      }
      return {
        statusCode: HttpStatus.CREATED,
        message: 'Cart created successfully',
        data: newCart[0] as CartDocument,
      };
    }
    const checkProductInCart = cart.products.find(
      (cartProduct) =>
        cartProduct.productId.toString() === product._id.toString(),
    );
    if (checkProductInCart) {
      checkProductInCart.quantity += createCartDto.quantity;
    } else {
      cart.products.push({
        productId: product._id,
        quantity: createCartDto.quantity,
      });
    }
    await cart.save();
    return {
      statusCode: HttpStatus.OK,
      message: 'Cart updated successfully',
      data: cart,
    };
  }

  async removeProduct(
    removeCartProductDto: RemoveCartProductDto,
    user: UserDocument,
  ): Promise<{
    statusCode: HttpStatus;
    message: string;
    data: CartDocument;
  }> {
    const productId = new Types.ObjectId(removeCartProductDto.productId);
    const cart = await this.cartRepo.findOneAndUpdate({
      filter: { createdBy: user._id },
      update: {
        $pull: { products: { productId } },
      },
      options: { new: true },
    });
    if (!cart) {
      throw new NotFoundException('Cart not found');
    }
    return {
      statusCode: HttpStatus.OK,
      message: 'Product removed from cart successfully',
      data: cart as CartDocument,
    };
  }

  async clearCart(user: UserDocument): Promise<{
    statusCode: HttpStatus;
    message: string;
    data: CartDocument;
  }> {
    const deletedCart = await this.cartRepo.deleteOne({
      filter: { createdBy: user._id },
    });
    if (!deletedCart) {
      throw new NotFoundException('Cart not found');
    }
    return {
      statusCode: HttpStatus.OK,
      message: 'Cart cleared successfully',
      data: deletedCart as unknown as CartDocument,
    };
  }

  findAll() {
    return `This action returns all cart`;
  }

  async findOne(user: UserDocument): Promise<{
    statusCode: HttpStatus;
    message: string;
    data: CartDocument;
  }> {
    const cart = await this.cartRepo.findOne({
      filter: { createdBy: user._id },
      options: {
        populate: {
          path: 'products.productId',
        },
      },
    });
    if (!cart) {
      throw new NotFoundException('Cart is empty');
    }
    return {
      statusCode: HttpStatus.OK,
      message: 'Cart found successfully',
      data: cart as CartDocument,
    };
  }

  remove(id: number) {
    return `This action removes a #${id} cart`;
  }
}
