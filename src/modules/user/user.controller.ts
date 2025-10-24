import { Controller, Get, Req } from '@nestjs/common';
import { UserService } from './user.service';
import { IUser } from 'src/common';
import type { IAuthRequest } from 'src/common/interfaces/token.interface';

@Controller('/user')
export class UserController {
  constructor(private readonly userService: UserService) {}
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
