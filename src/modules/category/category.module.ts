import { Module } from '@nestjs/common';
import { CategoryService } from './category.service';
import { CategoryController } from './category.controller';
import { BrandModel, CategoryModel } from 'src/DB';
import { CategoryRepo } from 'src/DB/repo/category.repo';
import { BrandRepo } from 'src/DB/repo/brand.repo';
import { S3Service } from 'src/common/services';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [CategoryModel, AuthModule, BrandModel],
  controllers: [CategoryController],
  providers: [S3Service, CategoryRepo, BrandRepo, CategoryService],
})
export class CategoryModule {}
