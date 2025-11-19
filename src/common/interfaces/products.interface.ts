import { ICategory } from './category.interface';
import { IBrand } from './brand.interface';
import { IUser } from './user.interface';
import { Types } from 'mongoose';

export interface IProduct {
  _id?: Types.ObjectId;
  name: string;
  slug: string;
  description?: string;
  images: string[];
  assetsFolderId: string;

  originalPrice: number;
  discountPercentage: number;
  salePrice: number;

  stock: number;
  soldItems: number;

  category: Types.ObjectId | ICategory;
  brand: Types.ObjectId | IBrand;

  createdBy: Types.ObjectId | IUser;
  updatedBy?: Date;

  createdAt?: Date;
  updatedAt?: Date;

  freezeAt?: Date;
  restoreAt?: Date;
}
