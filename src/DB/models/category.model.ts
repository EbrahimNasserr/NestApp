import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types, UpdateQuery } from 'mongoose';
import slugify from 'slugify';
import { IBrand, ICategory } from 'src/common';

@Schema({
  timestamps: true,
  strictQuery: true,
  strict: true,
})
export class Category implements ICategory {
  @Prop({ required: true, unique: true, minlength: 3, maxlength: 50 })
  name: string;

  @Prop({ unique: true, minlength: 3, maxlength: 50 })
  slug: string;

  @Prop({ required: false, minlength: 3, maxlength: 5000 })
  description: string;

  @Prop({ required: true })
  image: string;

  @Prop({ required: true })
  assetsFolderId: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  updatedBy?: Date;

  @Prop({ type: Date })
  freezeAt?: Date;

  @Prop({ type: Date })
  restoreAt?: Date;

  @Prop({ type: Types.ObjectId, ref: 'Brand' })
  brands?: Types.ObjectId[] | IBrand[];
}

export type CategoryDocument = HydratedDocument<Category>;

const CategorySchema = SchemaFactory.createForClass(Category);

CategorySchema.pre('save', function (this: CategoryDocument, next) {
  if (this.isModified('name')) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
  next();
});

CategorySchema.pre(['findOneAndUpdate', 'updateOne'], function (next) {
  const update = this.getUpdate() as UpdateQuery<CategoryDocument>;
  if (update?.name) {
    update.slug = slugify(update?.name, { lower: true, strict: true });
  }
  next();
});

export const CategoryModel = MongooseModule.forFeature([
  { name: Category.name, schema: CategorySchema },
]);
