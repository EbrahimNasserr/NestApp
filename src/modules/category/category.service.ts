import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { BrandRepo, CategoryRepo } from 'src/DB/repo';
import { S3Service } from 'src/common/services';
import { StorageEnum } from 'src/common/enums/multer.enum';
import { Types } from 'mongoose';
import { CategoryDocument, UserDocument } from 'src/DB/models';
import { ConflictException } from '@nestjs/common';
import { PaginationDto } from '../brand/dto/pagination.dto';
import { FolderEnum } from 'src/common/enums/foldr.enums';

@Injectable()
export class CategoryService {
  constructor(
    private readonly categoryRepo: CategoryRepo,
    private readonly s3Service: S3Service,
    private readonly brandRepo: BrandRepo,
  ) {}
  async create(
    createCategoryDto: CreateCategoryDto,
    user: UserDocument,
    file: Express.Multer.File,
  ): Promise<CategoryDocument> {
    const { name } = createCategoryDto;
    const checkCategory = await this.categoryRepo.findOne({ filter: { name } });
    if (checkCategory) throw new ConflictException('category already exists');
    const brands: Types.ObjectId[] = [
      ...new Set(createCategoryDto.brands || []),
    ];
    if (
      brands &&
      (await this.brandRepo.find({ filter: { _id: { $in: brands } } }))
        .length !== brands.length
    ) {
      throw new NotFoundException('brands not found');
    }
    const assetsFolderId = Math.floor(
      100000 + Math.random() * 900000,
    ).toString();
    const image = await this.s3Service.uploadFile({
      file,
      storageApproach: StorageEnum.DISK,
      path: `${FolderEnum.CATEGORIES}/${assetsFolderId}`,
    });
    const categorys = await this.categoryRepo.create([
      {
        ...createCategoryDto,
        image,
        createdBy: user._id,
        assetsFolderId,
      },
    ]);
    if (!categorys || categorys.length === 0) {
      await this.s3Service.deleteFile({
        Key: image,
      });
      throw new BadRequestException('Failed to create category');
    }
    return categorys[0] as CategoryDocument;
  }

  async findAll(
    query: PaginationDto,
    archived: boolean = false,
  ): Promise<{
    data: CategoryDocument[];
    pages?: number;
    currentPage?: number;
    limit: number;
    skip: number;
    docscount?: number;
    archived?: boolean;
  }> {
    const { page, size, search } = query;
    const categorys = await this.categoryRepo.paginate({
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
    });
    if (!categorys || categorys.data.length === 0)
      throw new NotFoundException('categories not found');
    return categorys as {
      data: CategoryDocument[];
      pages: number;
      currentPage: number;
      limit: number;
      skip: number;
      docscount: number;
    };
  }

  async findOne(
    categoryId: Types.ObjectId,
    archived: boolean = false,
  ): Promise<CategoryDocument | null> {
    const category = await this.categoryRepo.findOne({
      filter: {
        _id: categoryId,
        ...(archived ? { freezeAt: { $exists: true } } : {}),
      },
    });
    if (!category) throw new NotFoundException('category not found');
    return category as CategoryDocument;
  }

  async update(
    id: Types.ObjectId,
    updatecategoryDto: UpdateCategoryDto,
    user: UserDocument,
  ): Promise<CategoryDocument> {
    if (!user || !user._id) {
      throw new BadRequestException('User information is required');
    }
    const checkcategory = await this.categoryRepo.findOne({
      filter: { _id: id },
    });
    if (!checkcategory) throw new NotFoundException('category not found');
    if (checkcategory.name !== updatecategoryDto.name) {
      const checkCategory = await this.categoryRepo.findOne({
        filter: { name: updatecategoryDto.name },
      });
      if (checkCategory) throw new ConflictException('category already exists');
    }
    const brands: Types.ObjectId[] = [
      ...new Set(updatecategoryDto.brands || []),
    ];
    if (
      brands &&
      (await this.brandRepo.find({ filter: { _id: { $in: brands } } }))
        .length !== brands.length
    ) {
      throw new NotFoundException('brands not found');
    }

    const removeBrands = updatecategoryDto.brands ?? [];
    delete updatecategoryDto.removeBrands;


    const updatedcategory = await this.categoryRepo.findOneAndUpdate({
      filter: { _id: id },
      update: [
        {
          $set: {
            ...updatecategoryDto,
            updatedBy: user._id,
            brands: {
              $setUnion: [
                {
                  $setDifference: [
                    '$brands',
                    removeBrands.map((brand) =>
                      brand.toString(),
                    ),
                  ],
                },
                brands.map((brand) =>
                  Types.ObjectId.createFromHexString(brand.toString()),
                ),
              ],
            },
          },
        },
      ],
      options: { new: true },
    });
    if (!updatedcategory)
      throw new BadRequestException('Failed to update category');
    return updatedcategory as CategoryDocument;
  }

  async updateAttachment(
    id: Types.ObjectId,
    file: Express.Multer.File,
    user: UserDocument,
  ): Promise<CategoryDocument> {
    if (!user || !user._id) {
      throw new BadRequestException('User information is required');
    }
    const checkcategory = await this.categoryRepo.findOne({
      filter: { _id: id },
    });
    if (!checkcategory) throw new NotFoundException('category not found');
    const image = await this.s3Service.uploadFile({
      file,
      storageApproach: StorageEnum.DISK,
      path: `${FolderEnum.CATEGORIES}`,
    });
    const updatedcategory = await this.categoryRepo.findOneAndUpdate({
      filter: { _id: id },
      update: {
        image,
        updatedBy: user._id,
      },
      options: { new: true },
    });
    if (!updatedcategory)
      throw new BadRequestException('Failed to update category');
    await this.s3Service.deleteFile({
      Key: checkcategory.image,
    });
    return updatedcategory as CategoryDocument;
  }

  async freeze(
    categoryId: Types.ObjectId,
    user: UserDocument,
  ): Promise<CategoryDocument> {
    const checkcategory = await this.categoryRepo.findOne({
      filter: { _id: categoryId },
    });
    if (!checkcategory) throw new NotFoundException('category not found');
    if (checkcategory.freezeAt)
      throw new BadRequestException('category is already frozen');
    const updatedcategory = await this.categoryRepo.findOneAndUpdate({
      filter: { _id: categoryId },
      update: {
        freezeAt: new Date(),
        $unset: {
          restoreAt: 1,
        },
        updatedBy: user._id,
      },
      options: { new: true, upsert: true },
    });
    if (!updatedcategory)
      throw new BadRequestException('Failed to freeze category');
    return updatedcategory as CategoryDocument;
  }

  async restore(
    categoryId: Types.ObjectId,
    user: UserDocument,
  ): Promise<CategoryDocument> {
    const checkcategory = await this.categoryRepo.findOne({
      filter: { _id: categoryId },
    });
    if (!checkcategory) throw new NotFoundException('category not found');
    if (checkcategory.restoreAt)
      throw new BadRequestException('category is already restored');
    const updatedcategory = await this.categoryRepo.findOneAndUpdate({
      filter: { _id: categoryId },
      update: {
        restoreAt: new Date(),
        freezeAt: null,
        updatedBy: user._id,
      },
      options: { new: true },
    });
    if (!updatedcategory)
      throw new BadRequestException('Failed to restore category');

    return updatedcategory as CategoryDocument;
  }

  async remove(categoryId: Types.ObjectId): Promise<CategoryDocument> {
    const checkcategory = await this.categoryRepo.findOne({
      filter: {
        _id: categoryId,
        freezeAt: { $exists: true },
        restoreAt: { $exists: false },
      },
    });
    if (!checkcategory) throw new NotFoundException('category not found');
    const deletedcategory = await this.categoryRepo.findOneAndDelete({
      filter: { _id: categoryId },
    });
    await this.s3Service.deleteFile({
      Key: checkcategory.image,
    });
    if (!deletedcategory)
      throw new BadRequestException('Failed to delete category');
    return deletedcategory;
  }
}
