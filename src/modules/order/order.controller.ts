import { Controller, Get, Post, Body, Patch, Param, Delete, UsePipes, ValidationPipe } from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { Auth } from 'src/common/decorators/auth.decorator';
import { IResponse, RoleEnum, successResponse, User } from 'src/common';
import type { UserDocument } from 'src/DB';
import { OrderResponseEntity } from './entities/order.entity';

@UsePipes(new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
}))
@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Auth([RoleEnum.USER])
  @Post()
  async create(@Body() createOrderDto: CreateOrderDto , @User() user: UserDocument) {
    const order = await this.orderService.create(createOrderDto, user);
    return successResponse<OrderResponseEntity>('Order created successfully', 201, { order });
  }

  @Get()
  findAll() {
    return this.orderService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.orderService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateOrderDto: UpdateOrderDto) {
    return this.orderService.update(+id, updateOrderDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.orderService.remove(+id);
  }
}
