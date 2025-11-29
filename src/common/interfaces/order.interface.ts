import { OrderStatusPriorityEnum, PaymentTypeEnum } from '../enums';
import { ICoupon } from './coupon.interface';
import { IProduct } from './products.interface';
import { IUser } from './user.interface';
import { Types } from 'mongoose';

export interface IOrderProduct {
  _id?: Types.ObjectId;
  productId: Types.ObjectId | IProduct;
  quantity: number;
  unitPrice: number;

  createdAt?: Date;
  updatedAt?: Date;
}

export interface IOrder {
  _id?: Types.ObjectId;
  orderId: string;

  address: string;
  phone: string;
  note?: string;
  cancelReason?: string;

  status: OrderStatusPriorityEnum;

  paymentType: PaymentTypeEnum;

  coupon?: Types.ObjectId | ICoupon;
  discount?: number;
  totalPrice: number;
  subTotalPrice: number;

  paidAt?: Date;
  paymentIntent?: string;

  products: IOrderProduct[];

  updatedBy?: Types.ObjectId | IUser;
  createdBy: Types.ObjectId | IUser;

  createdAt?: Date;
  updatedAt?: Date;

  freezeAt?: Date;
  restoreAt?: Date;
}
