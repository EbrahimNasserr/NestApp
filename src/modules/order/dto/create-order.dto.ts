import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Types } from 'mongoose';
import { ICoupon, IOrder, PaymentTypeEnum } from 'src/common';

export class CreateOrderDto implements Omit<Partial<IOrder>, 'coupon'> {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(500)
  address: string;

  /**
   * Coupon can be either a MongoDB ObjectId (string) or a coupon code (string)
   * The service will automatically detect and handle both cases
   */
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  coupon?: string | Types.ObjectId | ICoupon;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  note?: string;

  @Matches(/^01[0,1,2,5][0-9]{8}$/)
  phone: string;

  @IsEnum(PaymentTypeEnum)
  paymentType: PaymentTypeEnum;
}
