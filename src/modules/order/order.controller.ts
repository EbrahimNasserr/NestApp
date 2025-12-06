import {
  Controller,
  Post,
  Body,
  UsePipes,
  ValidationPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
// import { UpdateOrderDto } from './dto/update-order.dto';
import { Auth } from 'src/common/decorators/auth.decorator';
import { IResponse, RoleEnum, successResponse, User } from 'src/common';
import type { UserDocument } from 'src/DB';
import { OrderResponseEntity } from './entities/order.entity';

@UsePipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    stopAtFirstError: true,
  }),
)
@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  /**
   * Creates a new order from the authenticated user's cart
   * @param createOrderDto - Order creation data (address, phone, payment type, optional coupon)
   * @param user - Authenticated user from JWT token
   * @returns Success response with created order
   */
  @Auth([RoleEnum.USER])
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createOrderDto: CreateOrderDto,
    @User() user: UserDocument,
  ): Promise<IResponse<OrderResponseEntity | undefined>> {
    const order = await this.orderService.create(createOrderDto, user);
    return successResponse<OrderResponseEntity>(
      'Order created successfully',
      HttpStatus.CREATED,
      { order },
    );
  }

  // @Get()
  // findAll() {
  //   return this.orderService.findAll();
  // }

  // @Get(':id')
  // findOne(@Param('id') id: string) {
  //   return this.orderService.findOne(+id);
  // }

  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updateOrderDto: UpdateOrderDto) {
  //   return this.orderService.update(+id, updateOrderDto);
  // }

  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.orderService.remove(+id);
  // }
}
