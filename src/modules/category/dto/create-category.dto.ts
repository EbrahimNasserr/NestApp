import {
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
  Validate,
} from 'class-validator';
import { ICategory, MongooseObjectId } from 'src/common';
import { Types } from 'mongoose';

export class CreateCategoryDto implements Partial<ICategory> {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(50)
  name: string;
  @IsString()
  @MinLength(3)
  @MaxLength(5000)
  description: string;

  @Validate(MongooseObjectId)
  brands: Types.ObjectId[];
}
