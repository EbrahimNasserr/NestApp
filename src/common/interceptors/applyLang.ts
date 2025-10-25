
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { IAuthRequest } from '../interfaces/token.interface';
import { LangEnum } from '../enums/user.provider';

@Injectable()
export class ApplyLangInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<IAuthRequest>();
    request.headers['accept-language'] = request.credentials?.user?.lang as LangEnum;
    return next.handle();
  }
}
