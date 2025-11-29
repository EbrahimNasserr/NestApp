import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import {
  ICoupon,
  IOrder,
  IOrderProduct,
  IProduct,
  IUser,
  OrderStatusPriorityEnum,
  PaymentTypeEnum,
} from 'src/common';

@Schema({
  timestamps: true,
  strictQuery: true,
})
export class OrderProduct implements IOrderProduct {
  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  productId: Types.ObjectId | IProduct;
  @Prop({ type: Number, required: true })
  quantity: number;
  @Prop({ type: Number, required: true })
  unitPrice: number;
}

@Schema({
  timestamps: true,
  strictQuery: true,
})
export class Order implements IOrder {
  @Prop({ type: String, required: true, minlength: 3, maxlength: 500 })
  address: string;
  @Prop({ type: String, required: true, minlength: 3, maxlength: 50 })
  phone: string;
  @Prop({ type: String, required: false })
  note?: string | undefined;
  @Prop({ type: String, required: false })
  cancelReason?: string | undefined;
  @Prop({ type: Types.ObjectId, ref: 'Coupon' })
  coupon: Types.ObjectId | ICoupon;
  @Prop({ type: Number, default: 0 })
  discount?: number | undefined;
  @Prop({ type: String, required: true, unique: true })
  orderId: string;
  @Prop({ type: Date, required: false })
  paidAt?: Date | undefined;
  @Prop({ type: String, required: false })
  paymentIntent?: string | undefined;
  @Prop({
    type: String,
    required: true,
    enum: PaymentTypeEnum,
    default: PaymentTypeEnum.CASH,
  })
  paymentType: PaymentTypeEnum;
  @Prop({
    type: String,
    required: true,
    enum: OrderStatusPriorityEnum,
    default: function (this: Order) {
      return this.paymentType === PaymentTypeEnum.CASH
        ? OrderStatusPriorityEnum.PENDING
        : OrderStatusPriorityEnum.PROCESSING;
    },
  })
  status: OrderStatusPriorityEnum;
  @Prop({ type: Number, required: true })
  subTotalPrice: number;
  @Prop({ type: Number, required: true })
  totalPrice: number;
  @Prop({ type: [OrderProduct], required: true })
  products: OrderProduct[];
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId | IUser;
  @Prop({ type: Types.ObjectId, ref: 'User' })
  updatedBy?: Types.ObjectId | IUser;
  @Prop({ type: Date, required: false })
  freezeAt?: Date | undefined;
  @Prop({ type: Date, required: false })
  restoreAt?: Date | undefined;
}

export type OrderDocument = HydratedDocument<Order>;

const OrderSchema = SchemaFactory.createForClass(Order);

export const OrderModel = MongooseModule.forFeature([
  { name: Order.name, schema: OrderSchema },
]);
