import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types, UpdateQuery } from 'mongoose';
import slugify from 'slugify';
import { IProduct } from 'src/common';

@Schema({
  timestamps: true,
  strictQuery: true,
})
export class Product implements IProduct {
  @Prop({ required: true, unique: true, minlength: 3, maxlength: 50 })
  name: string;

  @Prop({ unique: true, minlength: 3, maxlength: 50 })
  slug: string;

  @Prop({ required: false, minlength: 3, maxlength: 5000 })
  description?: string;

  @Prop({ required: true })
  images: string[];

  @Prop({ required: true })
  assetsFolderId: string;

  @Prop({ required: true })
  originalPrice: number;

  @Prop({ required: true })
  discountPercentage: number;

  @Prop({ required: true })
  salePrice: number;

  @Prop({ required: true })
  stock: number;

  @Prop({ required: true, default: 0 })
  soldItems: number;

  @Prop({ type: Types.ObjectId, ref: 'Category', required: true })
  category: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Brand', required: true })
  brand: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  updatedBy?: Date;

  @Prop({ type: Date })
  freezeAt?: Date;

  @Prop({ type: Date })
  restoreAt?: Date;
}

export type ProductDocument = HydratedDocument<Product>;

const ProductSchema = SchemaFactory.createForClass(Product);

ProductSchema.pre('save', function (this: ProductDocument, next) {
  if (this.isModified('name')) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
  next();
});

ProductSchema.pre(['findOneAndUpdate', 'updateOne'], function (next) {
  const update = this.getUpdate() as UpdateQuery<ProductDocument>;
  if (update?.name) {
    update.slug = slugify(update?.name, { lower: true, strict: true });
  }
  next();
});

export const ProductModel = MongooseModule.forFeature([
  { name: Product.name, schema: ProductSchema },
]);
