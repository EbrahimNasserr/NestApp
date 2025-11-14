import { IBrand } from './brand.interface';
import { IUser } from './user.interface';
import { Types } from 'mongoose';

export interface ICategory {
  _id?: Types.ObjectId;
  name: string;
  slug: string;
  description?: string;
  image: string;

  assetsFolderId: string;

  brands?: Types.ObjectId[] | IBrand[];

  createdBy: Types.ObjectId | IUser;
  createdAt?: Date;

  updatedAt?: Date;
  updatedBy?: Date;

  freezeAt?: Date;
  restoreAt?: Date;
}
