import { Injectable } from '@nestjs/common';
import { DBRepo } from './db.repo';
import { Coupon, CouponDocument } from '../models/coupon.model';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class CouponRepo extends DBRepo<CouponDocument> {
  constructor(
    @InjectModel(Coupon.name)
    protected override readonly model: Model<CouponDocument>,
  ) {
    super(model);
  }
}
