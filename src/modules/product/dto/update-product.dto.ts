import { PartialType } from '@nestjs/mapped-types';
import { CreateProductDto } from './create-product.dto';
import { Types } from 'mongoose';
import { IsMongoId } from 'class-validator';
import { containFields } from 'src/common';

@containFields()
export class UpdateProductDto extends PartialType(CreateProductDto) {}

export class ProductParamDto {
  @IsMongoId()
  productId: Types.ObjectId;
}
