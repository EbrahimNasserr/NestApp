import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import type { ProductDocument, UserDocument } from 'src/DB';
import { ProductRepo } from 'src/DB/repo/product.repo';
import { BrandRepo } from 'src/DB/repo/brand.repo';
import { CategoryRepo } from 'src/DB/repo/category.repo';
import { S3Service } from 'src/common/services';
import { FolderEnum } from 'src/common/enums/foldr.enums';

@Injectable()
export class ProductService {
  constructor(
    private readonly productRepo: ProductRepo,
    private readonly s3Service: S3Service,
    private readonly brandRepo: BrandRepo,
    private readonly categoryRepo: CategoryRepo,
  ) {}
  async create(
    createProductDto: CreateProductDto,
    user: UserDocument,
    files: Express.Multer.File[],
  ) {
    const { name, description, originalPrice, discountPercentage, stock } =
      createProductDto;
    const category = await this.categoryRepo.findOne({
      filter: { _id: createProductDto.category },
    });
    if (!category) throw new NotFoundException('Category not found');
    const brand = await this.brandRepo.findOne({
      filter: { _id: createProductDto.brand },
    });
    if (!brand) throw new NotFoundException('Brand not found');
    const assetsFolderId = Math.floor(
      100000 + Math.random() * 900000,
    ).toString();
    const images = await this.s3Service.uploadFiles({
      files,
      path: `${FolderEnum.CATEGORIES}/${category._id.toString()}/${FolderEnum.PRODUCTS}/${assetsFolderId}`,
    });
    const product = await this.productRepo.create([
      {
        name,
        description,
        originalPrice,
        discountPercentage,
        stock,
        images,
        category: category._id,
        brand: brand._id,
        createdBy: user._id,
        assetsFolderId,
        salePrice:
          originalPrice - originalPrice * ((discountPercentage || 0) / 100),
      },
    ]);
    if (!product || product.length === 0) {
      await this.s3Service.deleteFiles({
        Keys: images,
      });
      throw new BadRequestException('Failed to create product');
    }
    return product[0] as ProductDocument;
  }

  findAll() {
    return `This action returns all product`;
  }

  findOne(id: number) {
    return `This action returns a #${id} product`;
  }

  update(id: number, updateProductDto: UpdateProductDto) {
    return `This action updates a #${id} product`;
  }

  remove(id: number) {
    return `This action removes a #${id} product`;
  }
}
