import { PartialType } from '@nestjs/mapped-types';
import { CreateCategoryDto } from './create-category.dto';
import { IsMongoId, IsOptional, Validate } from 'class-validator';
import { Types } from 'mongoose';
import { containFields, MongooseObjectId } from 'src/common';

@containFields()
export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {
  @IsOptional()
  @Validate(MongooseObjectId)
  removeBrands?: Types.ObjectId[];
}

export class CategoryParamsDto {
  @IsMongoId()
  categoryId: Types.ObjectId;
}
