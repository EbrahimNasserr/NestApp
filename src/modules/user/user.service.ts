
import { Injectable } from '@nestjs/common';
import { UserDocument } from 'src/DB/models/user.model';
import { S3Service } from 'src/common/services';
import { StorageEnum } from 'src/common/enums/multer.enum';

@Injectable()
export class UserService {
  constructor(private readonly s3Service: S3Service) {}
  // getUsers(): IUser[] {
  //   return [
  //     {
  //       id: 1,
  //       username: 'John Doe',
  //       email: 'john.doe@example.com',
  //       password: 'password',
  //     },
  //   ];
  // }

  async profileImage(
    user: UserDocument,
    file: Express.Multer.File,
  ): Promise<string> {
    user.profilePicture = await this.s3Service.uploadFile({
      file,
      storageApproach: StorageEnum.DISK,
      path: `profile-images/${user.id}`,
    });
    await user.save();
    return user.profilePicture;
  }
}
