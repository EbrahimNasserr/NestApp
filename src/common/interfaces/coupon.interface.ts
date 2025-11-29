import { DiscountTypeEnum } from '../enums';
import { IUser } from './user.interface';
import { Types } from 'mongoose';

export interface ICoupon {
  _id?: Types.ObjectId;

  name: string;
  slug: string;
  image: string;


  code: string;
  discount: number;
  discountType: DiscountTypeEnum;

  duration: number;


  startDate: Date;
  endDate: Date;


  createdBy: Types.ObjectId | IUser;
  updatedBy?: Types.ObjectId | IUser;
  usedBy?: Types.ObjectId[] | IUser[];

  freezeAt?: Date;
  restoreAt?: Date;

  createdAt?: Date;
  updatedAt?: Date;
}
