import { Module } from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { BrandModel, CategoryModel, ProductModel } from 'src/DB';
import { ProductRepo } from 'src/DB/repo/product.repo';
import { BrandRepo } from 'src/DB/repo/brand.repo';
import { CategoryRepo } from 'src/DB/repo/category.repo';
import { S3Service } from 'src/common/services';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [BrandModel, CategoryModel, ProductModel, AuthModule],
  controllers: [ProductController],
  providers: [ProductService, ProductRepo, BrandRepo, CategoryRepo, S3Service],
})
export class ProductModule {}
