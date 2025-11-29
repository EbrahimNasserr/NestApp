import { DiscountTypeEnum, ICoupon } from 'src/common';
import { IsDateString, IsEnum, IsNotEmpty, IsNumber, IsPositive, IsString, MaxLength, MinLength } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCouponDto implements Partial<ICoupon> {
  @Type(() => Number)
  @IsPositive()
  @IsNumber()
  discount: number | undefined;
  @Type(() => Number)
  @IsPositive()
  @IsNumber()
  duration: number | undefined;
  @IsDateString()
  startDate: Date | undefined;
  @IsDateString()
  endDate: Date | undefined;
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(50)
  name: string | undefined;
  @IsEnum(DiscountTypeEnum)
  @IsNotEmpty()
  discountType: DiscountTypeEnum | undefined;
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(50)
  code: string | undefined;
}
