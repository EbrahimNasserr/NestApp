import { Module } from '@nestjs/common';
import { CategoryService } from './category.service';
import { CategoryController } from './category.controller';
import { S3Service } from 'src/common/services';
import { BrandRepo, CategoryRepo } from 'src/DB';
import { CategoryModel } from 'src/DB/models/category.model';
import { AuthModule } from '../auth/auth.module';
import { BrandModel } from 'src/DB/models/brand.model';

@Module({
  imports: [CategoryModel, AuthModule, BrandModel],
  controllers: [CategoryController],
  providers: [CategoryService, S3Service, CategoryRepo, BrandRepo],
})
export class CategoryModule {}
