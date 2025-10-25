import { applyDecorators, UseGuards } from '@nestjs/common';
import { RoleEnum, TokenTypeEnum } from '../enums';
import { TokenType } from './tokenType.decorator';
import { AccessRoles } from './roles.decorator';
import { AuthenticationGuard } from '../guards/authentication/authentication.guard';
import { AuthorizationGuard } from '../guards/authorization/authorization.guard';

export const Auth = (
  roles: RoleEnum[],
  type: TokenTypeEnum = TokenTypeEnum.Access,
) => {
  return applyDecorators(TokenType(type), AccessRoles(roles) , UseGuards(AuthenticationGuard, AuthorizationGuard));
};
