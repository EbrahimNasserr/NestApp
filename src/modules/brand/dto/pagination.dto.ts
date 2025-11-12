import { Type } from 'class-transformer';
import {
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class PaginationDto {
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  page?: number;
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  size?: number;
  @Type(() => String)
  @IsOptional()
  @IsString()
  search?: string;
}
