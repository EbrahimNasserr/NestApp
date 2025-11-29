import { Injectable } from '@nestjs/common';
import { DBRepo } from './db.repo';
import { Order, OrderDocument } from '../models/order.model';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class OrderRepo extends DBRepo<OrderDocument> {
  constructor(
    @InjectModel(Order.name)
    protected override readonly model: Model<OrderDocument>,
  ) {
    super(model);
  }
}
