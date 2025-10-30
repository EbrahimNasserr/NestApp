import {
  BadRequestException,
  Controller,
  Get,
  NotFoundException,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AppService } from './app.service';
import { S3Service } from './common/services';
import { promisify } from 'node:util';
import { pipeline } from 'node:stream';

const s3writeStreamPipeline = promisify(pipeline);
@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly s3Service: S3Service,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('/upload/pre-signed/*')
  async getPreSignedUrl(
    @Query() query: { download?: 'true' | 'false'; filename?: string },
    @Req() request: Request,
  ): Promise<{ message: string; data: { url: string } }> {
    const { download = 'false', filename: queryFilename } = query;

    // Extract the key from the URL path
    const fullPath = request.path;
    const Key = fullPath.replace('/upload/pre-signed/', '');

    // Ensure we have a valid key
    if (!Key || Key.trim() === '') {
      throw new BadRequestException('Key is required');
    }

    const url = await this.s3Service.createPresignedUrl({
      Key,
      download,
      filename: queryFilename,
    });
    return {
      message: 'Pre-signed URL created successfully',
      data: { url },
    };
  }

  @Get('/upload/*')
  async getAssetUrl(
    @Query() query: { download?: 'true' | 'false'; filename?: string },
    @Req() request: Request,
    @Res() response: Response,
  ): Promise<void> {
    const { download = 'false', filename: queryFilename } = query;

    // Extract the key from the URL path
    const fullPath = request.path;
    const Key = fullPath.replace('/upload/', '');

    // Ensure we have a valid key
    if (!Key || Key.trim() === '') {
      throw new BadRequestException('Key is required');
    }

    const s3Response = await this.s3Service.getFile({ Key });
    if (!s3Response) {
      throw new NotFoundException('File not found');
    }

    // Set response headers
    if (s3Response.ContentType) {
      response.setHeader('Content-Type', s3Response.ContentType);
    }
    if (s3Response.ContentLength) {
      response.setHeader('Content-Length', s3Response.ContentLength);
    }
    if (s3Response.LastModified) {
      response.setHeader(
        'Last-Modified',
        s3Response.LastModified.toISOString(),
      );
    }

    // Set download header if requested
    if (download === 'true') {
      const filename = queryFilename || Key.split('/').pop() || 'download';
      response.setHeader(
        'Content-Disposition',
        `attachment; filename="${filename}"`,
      );
    }

    // Stream the file content to the response
    if (s3Response.Body) {
      await s3writeStreamPipeline(
        s3Response.Body as NodeJS.ReadableStream,
        response,
      );
    } else {
      throw new NotFoundException('File content not available');
    }
  }
}
