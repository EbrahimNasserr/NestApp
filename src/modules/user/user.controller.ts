import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { IUser, TokenType } from 'src/common';
import type { IAuthRequest } from 'src/common/interfaces/token.interface';
import { AuthenticationGuard } from 'src/common/guards/authentication/authentication.guard';
import { TokenTypeEnum } from 'src/common/enums/token.enum';

@Controller('/user')
export class UserController {
  constructor(private readonly userService: UserService) {}
  @TokenType(TokenTypeEnum.Access)
  @UseGuards(AuthenticationGuard)
  @Get()
  getUsers(@Req() req: IAuthRequest): { message: string; data: IUser[] } {
    if (!req.credentials) {
      throw new Error('Authentication required');
    }

    console.log('Authenticated user:', req.credentials.user);
    return {
      message: 'Users fetched successfully',
      data: this.userService.getUsers(),
    };
  }
}
