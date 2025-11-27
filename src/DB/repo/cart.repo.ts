import { Injectable } from '@nestjs/common';
import { DBRepo } from './db.repo';
import { Cart, CartDocument } from '../models/cart.model';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class CartRepo extends DBRepo<CartDocument> {
  constructor(
    @InjectModel(Cart.name)
    protected override readonly model: Model<CartDocument>,
  ) {
    super(model);
  }
}
