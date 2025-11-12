import { PartialType } from '@nestjs/mapped-types';
import { CreateBrandDto } from './create-brand.dto';
import { IsMongoId } from 'class-validator';
import { Types } from 'mongoose';
import { containFields } from 'src/common';

@containFields()
export class UpdateBrandDto extends PartialType(CreateBrandDto) {}

export class BrandParamsDto {
  @IsMongoId()
  brandId: Types.ObjectId;
}
