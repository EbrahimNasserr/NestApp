import { IUser } from './user.interface';
import { Types } from 'mongoose';

export interface IBrand {
  _id?: Types.ObjectId;
  name: string;
  slug: string;
  slogan: string;
  image: string;
  createdBy: Types.ObjectId | IUser;
  createdAt?: Date;
  updatedAt?: Date;
  updatedBy?: Date;
}
