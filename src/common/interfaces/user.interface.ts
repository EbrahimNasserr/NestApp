import { Types } from 'mongoose';
import {
  GenderEnum,
  LangEnum,
  ProviderEnum,
  RoleEnum,
} from '../enums/user.provider';
import { OtpDocument } from 'src/DB';
export interface IUser {
  _id?: Types.ObjectId;
  id?: number;

  firstName: string;

  lastName: string;

  username?: string;

  email: string;

  confirmEmail?: Date;

  confirmEmailOtp?: string;

  password?: string;

  resetPasswordToken?: string;

  resetPasswordExpires?: Date;

  provider: ProviderEnum;

  gender: GenderEnum;

  changeCredentialsTime?: Date;

  role: RoleEnum;

  lang: LangEnum;

  profilePicture?: string;

  otp?: OtpDocument[];

  createdAt?: Date;
  updatedAt?: Date;
}

export interface ICategory {
  id: number;
  name: string;
  description: string;
}
