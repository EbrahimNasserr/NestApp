import { Module } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { CartModel, CartRepo, CouponModel, CouponRepo, OrderModel, OrderRepo, ProductModel, ProductRepo } from 'src/DB';
import { AuthModule } from '../auth/auth.module';
import { CartService } from '../cart/cart.service';

@Module({
  imports: [OrderModel, CartModel, ProductModel, CouponModel, AuthModule],
  controllers: [OrderController],
  providers: [OrderService , OrderRepo, CartRepo, ProductRepo, CouponRepo, CartService],
})
export class OrderModule {}
