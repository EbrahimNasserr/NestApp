import { Injectable } from '@nestjs/common';
import { DBRepo } from './db.repo';
import { Brand, BrandDocument } from '../models/brand.model';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class BrandRepo extends DBRepo<BrandDocument> {
  constructor(
    @InjectModel(Brand.name)
    protected override readonly model: Model<BrandDocument>,
  ) {
    super(model);
  }
}
