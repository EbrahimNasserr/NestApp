import { Controller, Get, Headers, UseInterceptors } from '@nestjs/common';
import { UserService } from './user.service';
import { IUser, RoleEnum, User } from 'src/common';
import { Auth } from 'src/common/decorators/auth.decorator';
import type { UserDocument } from 'src/DB/models/user.model';
import { ApplyLangInterceptor } from 'src/common/interceptors';

@Controller('/user')
export class UserController {
  constructor(private readonly userService: UserService) {}
  @UseInterceptors(ApplyLangInterceptor)
  @Auth([RoleEnum.ADMIN, RoleEnum.USER])
  @Get()
  getUsers(
    @Headers() header: any,
    @User() user: UserDocument,
  ): { message: string; data: IUser[] } {
    console.log(header);
    if (!user) {
      throw new Error('Authentication required');
    }
    console.log(user);
    return {
      message: 'Users fetched successfully',
      data: this.userService.getUsers(),
    };
  }
}
