import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ACCESS_ROLES_KEY } from 'src/common/decorators';
import { RoleEnum } from 'src/common/enums';
import { IAuthRequest } from 'src/common/interfaces/token.interface';


@Injectable()
export class AuthorizationGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}
  canActivate(context: ExecutionContext): boolean {
    const accessRoles: RoleEnum[] =
      this.reflector.getAllAndOverride<RoleEnum[]>(ACCESS_ROLES_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? [];

    let role: RoleEnum = RoleEnum.USER;

    switch (context.getType()) {
      case 'http': {
        role = context.switchToHttp().getRequest<IAuthRequest>().credentials
          ?.user?.role as RoleEnum;

        break;
      }
    }

    return accessRoles.includes(role);
  }
}
