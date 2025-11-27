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

  findAll() {
    return `This action returns all cart`;
  }

  findOne(id: number) {
    return `This action returns a #${id} cart`;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  update(id: number, updateCartDto: UpdateCartDto) {
    return `This action updates a #${id} cart`;
  }

  remove(id: number) {
    return `This action removes a #${id} cart`;
  }
}
