import { BadRequestException } from '@nestjs/common';
import { Callback } from 'mongoose';
import { diskStorage, memoryStorage } from 'multer';
import { tmpdir } from 'node:os';
import { StorageEnum } from 'src/common/enums/multer.enum';

export const cloudMulterFile = ({
  storageApproach = StorageEnum.MEMORY,
  validations = [],
  fileSize,
}: {
  storageApproach: StorageEnum;
  validations: string[];
  fileSize?: number;
}) => {
  return {
    storage: storageApproach === StorageEnum.MEMORY ? memoryStorage() : diskStorage({
      destination: tmpdir(),
      filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
      },
    }) ,

    fileFilter: (req, file: Express.Multer.File, cb: Callback) => {
      if (validations.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new BadRequestException('Invalid file type'), false);
      }
    },

    limits: {
      fileSize: fileSize,
    },
  };
};
