import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { IAuthRequest } from '../interfaces/token.interface';

export const User = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    let req: IAuthRequest | undefined;
    switch (ctx.getType()) {
      case 'http': {
        req = ctx.switchToHttp().getRequest<IAuthRequest>();
        break;
      }
      default:
        break;
    }
    return req?.credentials?.user;
  },
);
