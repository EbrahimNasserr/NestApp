import { Module } from '@nestjs/common';
import { CartService } from './cart.service';
import { CartController } from './cart.controller';
import { CartRepo, ProductRepo } from 'src/DB/repo';
import { CartModel, ProductModel } from 'src/DB/models';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [CartModel, ProductModel, AuthModule],
  controllers: [CartController],
  providers: [CartService, CartRepo, ProductRepo],
})
export class CartModule {}
