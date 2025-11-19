import { IBrand, ICategory, IProduct } from 'src/common';
import { Types } from 'mongoose';
import {
  IsMongoId,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProductDto implements Partial<IProduct> {
  @IsMongoId()
  brand: Types.ObjectId | IBrand;
  @IsMongoId()
  category: Types.ObjectId | ICategory;
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  name: string;
  @MinLength(3)
  @MaxLength(5000)
  @IsString()
  @IsOptional()
  description: string;
  @IsPositive()
  @IsNumber()
  @Type(() => Number)
  originalPrice: number;
  @IsPositive()
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  discountPercentage: number;
  @IsPositive()
  @IsNumber()
  @Type(() => Number)
  stock?: number;
}
