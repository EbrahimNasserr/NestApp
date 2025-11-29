import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types, UpdateQuery } from 'mongoose';
import slugify from 'slugify';
import { DiscountTypeEnum, ICoupon, IUser } from 'src/common';

@Schema({
  timestamps: true,
  strictQuery: true,
})
export class Coupon implements ICoupon {
  @Prop({ required: true, unique: true, minlength: 3, maxlength: 50 })
  name: string;

  @Prop({ unique: true, minlength: 3, maxlength: 50 })
  slug: string;

  @Prop({ required: true })
  image: string;

  @Prop({ required: true, minlength: 3, maxlength: 50 })
  code: string;

  @Prop({ required: true })
  discount: number;

  @Prop({ required: true, enum: DiscountTypeEnum })
  discountType: DiscountTypeEnum;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  updatedBy?: Types.ObjectId | IUser;

  @Prop({ required: true })
  startDate: Date;

  @Prop({ required: true })
  endDate: Date;

  @Prop({ required: true, default: 1 })
  duration: number;

  @Prop({ type: [Types.ObjectId], ref: 'User', required: false })
  usedBy?: Types.ObjectId[] | IUser[];

  @Prop({ type: Date })
  freezeAt?: Date;

  @Prop({ type: Date })
  restoreAt?: Date;
}

export type CouponDocument = HydratedDocument<Coupon>;

const CouponSchema = SchemaFactory.createForClass(Coupon);

CouponSchema.pre('save', function (this: CouponDocument, next) {
  if (this.isModified('name')) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
  next();
});

CouponSchema.pre(['findOneAndUpdate', 'updateOne'], function (next) {
  const update = this.getUpdate() as UpdateQuery<CouponDocument>;
  if (update?.name) {
    update.slug = slugify(update?.name, { lower: true, strict: true });
  }
  next();
});

export const CouponModel = MongooseModule.forFeature([
  { name: Coupon.name, schema: CouponSchema },
]);
