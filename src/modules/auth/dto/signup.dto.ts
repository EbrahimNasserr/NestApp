import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { IsMatch } from 'src/common';

export class LoginDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;
  @IsNotEmpty()
  @IsString()
  @MaxLength(20)
  @MinLength(8)
  password: string;
}

export class SignupDto extends LoginDto {
  @MinLength(3)
  @MaxLength(20)
  @IsString()
  @IsNotEmpty()
  username: string;
  @IsMatch(['password'])
  confirmPassword: string;
}

export class ConfirmEmailDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;
  @IsNotEmpty()
  @IsString()
  otp: string;
}

export class ForgotPasswordDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;
}

export class ResetPasswordDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;
  @IsNotEmpty()
  @IsString()
  otp: string;
  @IsNotEmpty()
  @MaxLength(20)
  @MinLength(8)
  @IsString()
  password: string;
}
