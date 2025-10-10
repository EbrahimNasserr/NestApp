import { IUser } from 'src/common';
import { Injectable } from '@nestjs/common';

@Injectable()
export class UserService {
  constructor() {}
  getUsers(): IUser[] {
    return [
      {
        id: 1,
        username: 'John Doe',
        email: 'john.doe@example.com',
        password: 'password',
      },
    ];
  }
}
