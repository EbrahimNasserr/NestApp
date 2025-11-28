import { PartialType } from '@nestjs/mapped-types';
import { CreateCartDto } from './create-cart.dto';
import { Types } from 'mongoose';
import { IsMongoId } from 'class-validator';

export class RemoveCartProductDto {
  @IsMongoId()
  productId: Types.ObjectId;
}

export class UpdateCartDto extends PartialType(CreateCartDto) {}
