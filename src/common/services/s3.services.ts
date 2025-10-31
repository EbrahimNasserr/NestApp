import {
  ObjectCannedACL,
  PutObjectCommand,
  S3Client,
  GetObjectCommand,
  GetObjectCommandOutput,
  NoSuchKey,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { BadRequestException, Injectable } from '@nestjs/common';
import { StorageEnum } from '../enums/multer.enum';
import { createReadStream } from 'fs';

@Injectable()
export class S3Service {
  private s3: S3Client;
  constructor() {
    this.s3 = new S3Client({
      region: process.env.AWS_REGION as string,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
      },
    });
  }

  uploadFile = async ({
    storageApproach = StorageEnum.MEMORY,
    BucketName = process.env.AWS_BUCKET_NAME as string,
    Acl,
    path = 'general',
    file,
  }: {
    storageApproach?: StorageEnum;
    BucketName?: string;
    Acl?: string;
    path?: string;
    file: Express.Multer.File;
  }): Promise<string> => {
    if (!file) throw new BadRequestException('File is missing');

    // Validate AWS credentials
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      throw new BadRequestException('AWS credentials are not configured');
    }

    if (!BucketName) {
      throw new BadRequestException('AWS bucket name is not configured');
    }

    const fileKey = `${path}/${Date.now()}-${file.originalname}`;

    const command = new PutObjectCommand({
      Bucket: BucketName,
      Key: fileKey,
      Body:
        storageApproach === StorageEnum.MEMORY
          ? file.buffer
          : createReadStream(file.path),
      // Only set ACL if explicitly provided - many buckets have ACLs disabled
      ...(Acl ? { ACL: Acl as ObjectCannedACL } : {}),
      ContentType: file.mimetype,
    });

    try {
      await this.s3.send(command);
    } catch (error: unknown) {
      // Provide more helpful error messages
      const awsError = error as {
        $metadata?: { httpStatusCode?: number };
        Code?: string;
        message?: string;
      };

      if (awsError?.$metadata?.httpStatusCode === 403) {
        throw new BadRequestException(
          `S3 Access Denied: Check your AWS credentials and IAM permissions. ${awsError.Code || ''} - ${awsError.message || ''}`,
        );
      }
      if (awsError?.$metadata?.httpStatusCode === 404) {
        throw new BadRequestException(
          `S3 Bucket not found: ${BucketName}. Check your bucket name and region.`,
        );
      }
      throw new BadRequestException(
        `S3 upload failed: ${awsError.message || awsError.Code || 'Unknown error'}`,
      );
    }

    return `${fileKey}`;
  };

  createPresignedUrl = async ({
    Key,
    download = 'false',
    filename,
    BucketName = process.env.AWS_BUCKET_NAME as string,
    expiresIn = 3600, // 1 hour default
  }: {
    Key: string;
    download?: 'true' | 'false';
    filename?: string;
    BucketName?: string;
    expiresIn?: number;
  }): Promise<string> => {
    if (!Key) throw new BadRequestException('Key is required');

    const command = new GetObjectCommand({
      Bucket: BucketName,
      Key,
      ResponseContentDisposition:
        download === 'true'
          ? `attachment; filename="${filename || Key.split('/').pop()}"`
          : undefined,
    });

    const signedUrl = await getSignedUrl(this.s3, command, {
      expiresIn,
    });

    return signedUrl;
  };

  getFile = async ({
    Key,
    BucketName = process.env.AWS_BUCKET_NAME as string,
  }: {
    Key: string;
    BucketName?: string;
  }): Promise<GetObjectCommandOutput | null> => {
    if (!Key) throw new BadRequestException('Key is required');

    try {
      const command = new GetObjectCommand({
        Bucket: BucketName,
        Key,
      });

      const response = await this.s3.send(command);
      return response;
    } catch (error) {
      // If file not found, return null instead of throwing
      if (error instanceof NoSuchKey) {
        return null;
      }
      // Check for 404 status code in AWS SDK errors
      const awsError = error as { $metadata?: { httpStatusCode?: number } };
      if (awsError.$metadata?.httpStatusCode === 404) {
        return null;
      }
      throw error;
    }
  };

  deleteFile = async ({
    Key,
    BucketName = process.env.AWS_BUCKET_NAME as string,
  }: {
    Key: string;
    BucketName?: string;
  }): Promise<void> => {
    if (!Key) throw new BadRequestException('Key is required');

    const command = new DeleteObjectCommand({
      Bucket: BucketName,
      Key,
    });

    await this.s3.send(command);
  };
}
