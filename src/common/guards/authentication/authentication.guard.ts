import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { TokenService } from 'src/common/services/token.service';
import { Reflector } from '@nestjs/core';
import { TokenTypeEnum } from 'src/common/enums/token.enum';
import type { IAuthRequest } from 'src/common/interfaces/token.interface';
import type { UserDocument } from 'src/DB';
import type { JwtPayload } from 'jsonwebtoken';
import { TOKEN_TYPE_KEY } from 'src/common/decorators/tokenType.decorator';
@Injectable()
export class AuthenticationGuard implements CanActivate {
  constructor(
    private readonly tokenService: TokenService,
    private readonly reflector: Reflector,
  ) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const tokenType: TokenTypeEnum =
      this.reflector.getAllAndOverride<TokenTypeEnum>(TOKEN_TYPE_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) || TokenTypeEnum.Access;


    let authorization: string | undefined;
    let request: IAuthRequest;

    switch (context.getType()) {
      case 'http': {
        const httpCtx = context.switchToHttp();
        request = httpCtx.getRequest<IAuthRequest>();
        authorization = request.headers.authorization;
        break;
      }
      case 'rpc': {
        // Handle RPC context if needed
        throw new UnauthorizedException('RPC context not supported');
      }
      case 'ws': {
        // Handle WebSocket context if needed
        throw new UnauthorizedException('WebSocket context not supported');
      }
      default: {
        throw new UnauthorizedException('Unsupported context type');
      }
    }

    if (!authorization) {
      throw new UnauthorizedException('Authorization header is required');
    }
    const tokenResult = await this.tokenService.decodedToken(
      { authorization },
      tokenType,
    );
    request.credentials = {
      user: tokenResult.user as UserDocument,
      decoded: tokenResult.decoded as JwtPayload,
    };
    return true;
  }
}
