import {
  BadRequestException,
  ConflictException,
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
import { Types } from 'mongoose';
import { PaginationDto, PaginationEntity } from 'src/common';

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
    const checkProduct = await this.productRepo.findOne({
      filter: { name },
    });
    if (checkProduct) throw new ConflictException('Product name already exists');
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

  async findAll(
    query: PaginationDto,
    archived: boolean = false,
  ): Promise<{
    data: ProductDocument[];
    pages?: number;
    currentPage?: number;
    limit: number;
    skip: number;
    docscount?: number;
    archived?: boolean;
  }> {
    const { page, size, search } = query;
    const products = await this.productRepo.paginate({
      filter: {
        ...(archived ? { freezeAt: { $exists: true } } : {}),
        ...(search
          ? {
              $or: [
                { name: { $regex: search, $options: 'i' } },
                { slug: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
              ],
            }
          : {}),
      },
      page,
      size,
      options: {
        populate: [
          { path: 'category', select: 'name slug image' },
          { path: 'brand', select: 'name slug image slogan' },
        ],
      },
    });
    if (!products || products.data.length === 0)
      throw new NotFoundException('products not found');
    return products as PaginationEntity<ProductDocument>;
  }

  async findOne(
    productId: Types.ObjectId,
    archived: boolean = false,
  ): Promise<ProductDocument | null> {
    const product = await this.productRepo.findOne({
      filter: {
        _id: productId,
        ...(archived ? { freezeAt: { $exists: true } } : {}),
      },
    });
    if (!product) throw new NotFoundException('product not found');
    return product as ProductDocument;
  }

  async update(
    productId: Types.ObjectId,
    updateProductDto: UpdateProductDto,
    user: UserDocument,
    files?: Express.Multer.File[],
  ) {
    const checkProduct = await this.productRepo.findOne({
      filter: { _id: productId },
    });
    if (!checkProduct) throw new NotFoundException('Product not found');
    if (updateProductDto.category) {
      const category = await this.categoryRepo.findOne({
        filter: { _id: updateProductDto.category },
      });
      if (!category) throw new NotFoundException('Category not found');
    }
    if (updateProductDto.brand) {
      const brand = await this.brandRepo.findOne({
        filter: { _id: updateProductDto.brand },
      });
      if (!brand) throw new NotFoundException('Brand not found');
    }

    let salePrice = checkProduct.salePrice;

    if (updateProductDto.originalPrice || updateProductDto.discountPercentage) {
      const originalPrice =
        updateProductDto.originalPrice ?? checkProduct.originalPrice;
      const discountPercentage =
        updateProductDto.discountPercentage ?? checkProduct.discountPercentage;
      const finalSalePrice =
        originalPrice - originalPrice * ((discountPercentage || 0) / 100);
      if (finalSalePrice !== salePrice) {
        salePrice = finalSalePrice;
      }
    }

    const updateData: Record<string, unknown> = {
      ...updateProductDto,
      updatedBy: user._id,
      salePrice,
    };

    // Handle file uploads if provided
    if (files && files.length > 0) {
      const categoryId = updateProductDto.category
        ? updateProductDto.category
        : checkProduct.category;
      const category = await this.categoryRepo.findOne({
        filter: { _id: categoryId },
      });
      if (!category) throw new NotFoundException('Category not found');

      const assetsFolderId =
        checkProduct.assetsFolderId ||
        Math.floor(100000 + Math.random() * 900000).toString();
      const images = await this.s3Service.uploadFiles({
        files,
        path: `${FolderEnum.CATEGORIES}/${category._id.toString()}/${FolderEnum.PRODUCTS}/${assetsFolderId}`,
      });

      // Delete old images if they exist
      if (checkProduct.images && checkProduct.images.length > 0) {
        await this.s3Service.deleteFiles({
          Keys: checkProduct.images,
        });
      }

      updateData.images = images;
      updateData.assetsFolderId = assetsFolderId;
    }

    const updatedProduct = await this.productRepo.findOneAndUpdate({
      filter: { _id: productId },
      update: updateData,
      options: { new: true },
    });
    if (!updatedProduct)
      throw new BadRequestException('Failed to update product');
    return updatedProduct as ProductDocument;
  }

  async freeze(
    productId: Types.ObjectId,
    user: UserDocument,
  ): Promise<ProductDocument> {
    const checkProduct = await this.productRepo.findOne({
      filter: { _id: productId },
    });
    if (!checkProduct) throw new NotFoundException('Product not found');
    if (checkProduct.freezeAt)
      throw new BadRequestException('Product is already frozen');
    const updatedProduct = await this.productRepo.findOneAndUpdate({
      filter: { _id: productId },
      update: {
        freezeAt: new Date(),
        $unset: {
          restoreAt: 1,
        },
        updatedBy: user._id,
      },
      options: { new: true, upsert: true },
    });
    if (!updatedProduct)
      throw new BadRequestException('Failed to freeze product');
    return updatedProduct as ProductDocument;
  }

  async restore(
    productId: Types.ObjectId,
    user: UserDocument,
  ): Promise<ProductDocument> {
    const checkProduct = await this.productRepo.findOne({
      filter: { _id: productId },
    });
    if (!checkProduct) throw new NotFoundException('Product not found');
    if (checkProduct.restoreAt)
      throw new BadRequestException('Product is already restored');
    const updatedProduct = await this.productRepo.findOneAndUpdate({
      filter: { _id: productId },
      update: {
        restoreAt: new Date(),
        freezeAt: null,
        updatedBy: user._id,
      },
      options: { new: true },
    });
    if (!updatedProduct)
      throw new BadRequestException('Failed to restore product');

    return updatedProduct as ProductDocument;
  }

  async remove(productId: Types.ObjectId): Promise<ProductDocument> {
    const checkProduct = await this.productRepo.findOne({
      filter: {
        _id: productId,
        freezeAt: { $exists: true },
        restoreAt: { $exists: false },
      },
    });
    if (!checkProduct) throw new NotFoundException('Product not found');
    const deletedProduct = await this.productRepo.findOneAndDelete({
      filter: { _id: productId },
    });
    await this.s3Service.deleteFiles({
      Keys: checkProduct.images,
    });
    if (!deletedProduct)
      throw new BadRequestException('Failed to delete product');
    return deletedProduct;
  }
}
