import { Module } from '@nestjs/common';
import { BrandService } from './brand.service';
import { BrandController } from './brand.controller';
import { BrandRepo } from 'src/DB/repo/brand.repo';
import { S3Service } from 'src/common/services';
import { BrandModel } from 'src/DB/models/brand.model';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [BrandModel, AuthModule],
  controllers: [BrandController],
  providers: [BrandService, S3Service, BrandRepo],
  exports: [BrandService],
})
export class BrandModule {}
