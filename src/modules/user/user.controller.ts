import { Controller, Get } from '@nestjs/common';
import { UserService } from './user.service';
import { IUser } from 'src/common';

@Controller('/user')
export class UserController {
  constructor(private readonly userService: UserService) {}
  @Get()
  getUsers(): { message: string; data: IUser[] } {
    return {
      message: 'Users fetched successfully',
      data: this.userService.getUsers(),
    };
  }
}
