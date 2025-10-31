import {
  Controller,
  MaxFileSizeValidator,
  ParseFilePipe,
  Patch,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { UserService } from './user.service';
import { RoleEnum, successResponse, User } from 'src/common';
import { Auth } from 'src/common/decorators/auth.decorator';
import type { UserDocument } from 'src/DB/models/user.model';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import {
  cloudMulterFile,
  localMulterFile,
  validationMulter,
} from 'src/common/utils/multer';
import type { IMulterFile } from 'src/common/utils/multer/local.multer';
import { StorageEnum } from 'src/common/enums/multer.enum';
import { IResponse } from 'src/common/interfaces';
@Controller('/user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseInterceptors(
    FileInterceptor(
      'profileImage',
      cloudMulterFile({
        storageApproach: StorageEnum.DISK,
        validations: validationMulter.image,
        fileSize: 1024 * 1024 * 5,
      }),
    ),
  )
  @Auth([RoleEnum.USER])
  @Patch('/profile-image')
  async profileImage(
    @User() user: UserDocument,
    @UploadedFile(
      new ParseFilePipe({
        fileIsRequired: true,
        validators: [new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 5 })],
      }),
    )
    file: IMulterFile,
  ): Promise<IResponse<{ path: string } | undefined>> {
    const url = await this.userService.profileImage(user, file);

    return successResponse('Profile image updated successfully', undefined, { path: url });
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
        validators: [new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 5 })],
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
