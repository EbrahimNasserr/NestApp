import { Injectable } from '@nestjs/common';
import { DBRepo } from './db.repo';
import { Category, CategoryDocument } from '../models/category.model';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class CategoryRepo extends DBRepo<CategoryDocument> {
  constructor(
    @InjectModel(Category.name)
    protected override readonly model: Model<CategoryDocument>,
  ) {
    super(model);
  }
}
