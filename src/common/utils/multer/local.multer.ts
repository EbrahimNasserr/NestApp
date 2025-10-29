import { BadRequestException } from '@nestjs/common';
import { existsSync, mkdirSync } from 'fs';
import { Callback } from 'mongoose';
import { diskStorage } from 'multer';
import path from 'path';

export interface IMulterFile extends Express.Multer.File {
  filename: string;
}

export const localMulterFile = ({
  destination = 'public',
  validations = [],
  fileSize,
}: {
  destination: string;
  validations: string[];
  fileSize?: number;
}) => {
  const pathurl = `uploads/${destination}`;
  return {
    storage: diskStorage({
      destination(req, file, cb) {
        const fullPath = path.resolve(`./${pathurl}`);
        if (!existsSync(fullPath)) {
          mkdirSync(fullPath, { recursive: true });
        }
        cb(null, fullPath);
      },
      filename(req, file, cb) {
        const filename = `${Date.now()}-${file.originalname}`;
        cb(null, filename);
      },
    }),

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
