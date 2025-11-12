import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types, UpdateQuery } from 'mongoose';
import slugify from 'slugify';
import { IBrand } from 'src/common';

@Schema({
  timestamps: true,
  strictQuery: true,
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

  @Prop({ type: Date })
  freezeAt?: Date;

  @Prop({ type: Date })
  restoreAt?: Date;
}

export type BrandDocument = HydratedDocument<Brand>;

const BrandSchema = SchemaFactory.createForClass(Brand);

BrandSchema.pre('save', function (this: BrandDocument, next) {
  if (this.isModified('name')) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
  next();
});

BrandSchema.pre(['findOneAndUpdate', 'updateOne'], function (next) {
  const update = this.getUpdate() as UpdateQuery<BrandDocument>;
  if (update?.name) {
    update.slug = slugify(update?.name, { lower: true, strict: true });
  }
  next();
});

export const BrandModel = MongooseModule.forFeature([
  { name: Brand.name, schema: BrandSchema },
]);
