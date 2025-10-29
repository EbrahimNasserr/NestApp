import {
  Controller,
  FileTypeValidator,
  Get,
  Headers,
  MaxFileSizeValidator,
  ParseFilePipe,
  Patch,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { UserService } from './user.service';
import { IUser, RoleEnum, User } from 'src/common';
import { Auth } from 'src/common/decorators/auth.decorator';
import type { UserDocument } from 'src/DB/models/user.model';
import { ApplyLangInterceptor } from 'src/common/interceptors';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { localMulterFile, validationMulter } from 'src/common/utils/multer';
import type { IMulterFile } from 'src/common/utils/multer/local.multer';

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

  @UseInterceptors(
    FileInterceptor(
      'profileImage',
      localMulterFile({
        destination: 'profile-images',
        validations: validationMulter.image,
        fileSize: 1024 * 1024 * 5,
      }),
    ),
  )
  @Auth([RoleEnum.USER])
  @Patch('/profile-image')
  profileImage(
    @UploadedFile(
      new ParseFilePipe({
        fileIsRequired: true,
        validators: [
          new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 5 }),
          new FileTypeValidator({ fileType: 'image/*' }),
        ],
      }),
    )
    file: IMulterFile,
  ) {
    // Override the absolute path with relative path starting with 'uploads/'
    const relativePath = `uploads/profile-images/${file.filename}`;

    return {
      message: 'Profile image updated successfully',
      data: {
        ...file,
        path: relativePath,
      },
    };
  }

  @UseInterceptors(
    FilesInterceptor(
      'cover-images',
      2,
      localMulterFile({
        destination: 'cover-images',
        validations: validationMulter.image,
        fileSize: 1024 * 1024 * 5,
      }),
    ),
  )
  @Auth([RoleEnum.USER])
  @Patch('/cover-image')
  coverImage(
    @UploadedFiles(
      new ParseFilePipe({
        fileIsRequired: true,
        validators: [
          new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 5 }),
        ],
      }),
    )
    file: Array<IMulterFile>,
  ) {
    // Override the absolute path with relative path starting with 'uploads/'
    const relativePath = `uploads/cover-images/${file.map((file) => file.filename).join(',')}`;

    return {
      message: 'Cover image updated successfully',
      data: {
        ...file,
        path: relativePath,
      },
    };
  }
}
