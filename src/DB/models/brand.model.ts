import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import slugify from 'slugify';
import { IBrand } from 'src/common';

@Schema({
  timestamps: true,
})
export class Brand implements IBrand {
  @Prop({ required: true, unique: true, minlength: 3, maxlength: 50 })
  name: string;

  @Prop({ unique: true, minlength: 3, maxlength: 50 })
  slug: string;

  @Prop({ required: true, minlength: 3, maxlength: 50 })
  slogan: string;

  @Prop({ required: true })
  image: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  updatedBy?: Date;
}

export type BrandDocument = HydratedDocument<Brand>;

const BrandSchema = SchemaFactory.createForClass(Brand);

BrandSchema.pre('save', function (this: BrandDocument, next) {
  if (this.isModified('name')) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
  next();
});

export const BrandModel = MongooseModule.forFeature([
  { name: Brand.name, schema: BrandSchema },
]);
