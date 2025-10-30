import { UserDocument } from 'src/DB';
import { JwtPayload } from 'jsonwebtoken';
import type { Request } from 'express';
import { TokenTypeEnum } from '../enums/token.enum';
import { IUser } from './user.interface';
import { Types } from 'mongoose';

export interface IToken {
  _id?: Types.ObjectId;
  id?: number;

  createdBy: Types.ObjectId | IUser;
  jti: string;
  expiresAt: Date;

  createdAt?: Date;
  updatedAt?: Date;
}

export interface ICredentials {
  user: UserDocument;
  decoded: JwtPayload;
}

export interface IAuthRequest extends Request {
  credentials?: ICredentials;
  tokenType?: TokenTypeEnum;
}
