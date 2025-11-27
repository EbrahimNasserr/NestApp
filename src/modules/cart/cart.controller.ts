import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UsePipes,
  ValidationPipe,
  HttpStatus,
} from '@nestjs/common';
import { CartService } from './cart.service';
import { CreateCartDto } from './dto/create-cart.dto';
import { Auth } from 'src/common/decorators/auth.decorator';
import { RoleEnum } from 'src/common/enums';
import { User } from 'src/common/decorators/credential.decorator';
import type { UserDocument } from 'src/DB/models/user.model';
import { IResponse, successResponse } from 'src/common';
import { CartResponse } from './entities/cart.entity';

@Auth([RoleEnum.USER])
@UsePipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
  }),
)
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Post()
  async create(
    @Body() createCartDto: CreateCartDto,
    @User() user: UserDocument,
  ): Promise<IResponse<CartResponse | undefined>> {
    const cart = await this.cartService.create(createCartDto, user);
    return successResponse<CartResponse>(
      'Cart created successfully',
      HttpStatus.CREATED,
      {
        cart: cart.data,
      },
    );
  }

  @Get()
  findAll() {
    return this.cartService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.cartService.findOne(+id);
  }

  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updateCartDto: UpdateCartDto) {
  //   return this.cartService.update(+id, updateCartDto);
  // }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.cartService.remove(+id);
  }
}
