import { Injectable } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { CartRepo, CouponRepo, OrderRepo, ProductRepo, UserDocument } from 'src/DB';

@Injectable()
export class OrderService {
  constructor(
    private readonly orderRepo: OrderRepo,
    private readonly couponRepo: CouponRepo,
    private readonly productRepo: ProductRepo,
    private readonly cartRepo: CartRepo,
  ) {}
  create(createOrderDto: CreateOrderDto, user: UserDocument) {
    return 'This action adds a new order';
  }

  findAll() {
    return `This action returns all order`;
  }

  findOne(id: number) {
    return `This action returns a #${id} order`;
  }

  update(id: number, updateOrderDto: UpdateOrderDto) {
    return `This action updates a #${id} order`;
  }

  remove(id: number) {
    return `This action removes a #${id} order`;
  }
}
