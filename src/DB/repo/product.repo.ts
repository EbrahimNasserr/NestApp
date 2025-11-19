import { Injectable } from '@nestjs/common';
import { DBRepo } from './db.repo';
import { Product, ProductDocument } from '../models/product.model';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class ProductRepo extends DBRepo<ProductDocument> {
  constructor(
    @InjectModel(Product.name)
    protected override readonly model: Model<ProductDocument>,
  ) {
    super(model);
  }
}
