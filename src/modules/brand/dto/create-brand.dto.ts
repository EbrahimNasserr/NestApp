import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';
import { IBrand } from 'src/common';

export class CreateBrandDto implements Partial<IBrand> {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(50)
  name: string;
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(50)
  slogan: string;
}
