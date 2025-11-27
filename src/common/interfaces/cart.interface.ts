import { IProduct } from './products.interface';
import { IUser } from './user.interface';
import { Types } from 'mongoose';

export interface ICartProduct {
  _id?: Types.ObjectId;
  productId: Types.ObjectId | IProduct;
  quantity: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ICart {
  _id?: Types.ObjectId;

  products: ICartProduct[];
  createdBy: Types.ObjectId | IUser;

  createdAt?: Date;
  updatedAt?: Date;
}
