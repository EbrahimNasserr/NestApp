import { Module } from '@nestjs/common';
import { CouponService } from './coupon.service';
import { CouponController } from './coupon.controller';
import { CouponRepo } from 'src/DB/repo/coupon.repo';
import { CouponModel } from 'src/DB/models';
import { AuthModule } from '../auth/auth.module';
@Module({
  imports: [CouponModel, AuthModule],
  controllers: [CouponController],
  providers: [CouponService, CouponRepo],
})
export class CouponModule {}
