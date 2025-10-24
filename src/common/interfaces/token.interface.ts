import { UserDocument } from 'src/DB';
import { JwtPayload } from 'jsonwebtoken';
import type { Request } from 'express';
import { TokenTypeEnum } from '../enums/token.enum';

export interface ICredentials {
  user: UserDocument;
  decoded: JwtPayload;
}

export interface IAuthRequest extends Request {
  credentials?: ICredentials;
  tokenType?: TokenTypeEnum;
}
