import { Types } from 'mongoose';
import { IUser } from './user.interface';
import { OtpTypeEnum } from '../enums/otp.enums';
export interface IOtp {
  _id?: Types.ObjectId;
  id?: number;

  code: string;

  expiresAt: Date;

  type: OtpTypeEnum;

  createdBy: Types.ObjectId | IUser;

  createdAt?: Date;
  updatedAt?: Date;
}
