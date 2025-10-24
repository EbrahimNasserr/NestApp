import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { NextFunction, Response } from 'express';
import { TokenService } from '../services/token.service';
import { TokenTypeEnum } from '../enums/token.enum';
import { IAuthRequest } from '../interfaces/token.interface';

export const PreAuth = (tokenType: TokenTypeEnum = TokenTypeEnum.Access) => {
  return (req: IAuthRequest, res: Response, next: NextFunction) => {
    req.tokenType = tokenType;
    next();
  };
};
@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(private readonly tokenService: TokenService) {}
  async use(req: IAuthRequest, res: Response, next: NextFunction) {
    try {
      const authorization = req.headers['authorization'] as string;

      if (!authorization) {
        throw new UnauthorizedException('Authorization header is required');
      }

      const tokenResult = await this.tokenService.decodedToken(
        { authorization },
        req.tokenType,
      );

      req.credentials = {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        user: tokenResult.user,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        decoded: tokenResult.decoded,
      };
      next();
    } catch (error) {
      next(error);
    }
  }
}
