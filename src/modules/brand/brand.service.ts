import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateBrandDto } from './dto/create-brand.dto';
// import { UpdateBrandDto } from './dto/update-brand.dto';
import { BrandRepo } from 'src/DB/repo/brand.repo';
import { BrandDocument, UserDocument } from 'src/DB/models';
import { S3Service } from 'src/common/services';
import { StorageEnum } from 'src/common/enums/multer.enum';
import { Types } from 'mongoose';
import { UpdateBrandDto } from './dto/update-brand.dto';
import { FolderEnum } from 'src/common/enums/foldr.enums';
import { PaginationDto } from './dto/pagination.dto';
@Injectable()
export class BrandService {
  constructor(
    private readonly brandRepo: BrandRepo,
    private readonly s3Service: S3Service,
  ) {}
  async create(
    createBrandDto: CreateBrandDto,
    user: UserDocument,
    file: Express.Multer.File,
  ): Promise<BrandDocument> {
    const { name, slogan } = createBrandDto;
    const checkBrand = await this.brandRepo.findOne({ filter: { name } });
    if (checkBrand) throw new ConflictException('Brand already exists');
    const image = await this.s3Service.uploadFile({
      file,
      storageApproach: StorageEnum.DISK,
      path: `brands/${name}`,
    });
    const brands = await this.brandRepo.create([
      {
        name,
        slogan,
        image,
        createdBy: user._id,
      },
    ]);
    if (!brands || brands.length === 0) {
      await this.s3Service.deleteFile({
        Key: image,
      });
      throw new BadRequestException('Failed to create brand');
    }
    return brands[0] as BrandDocument;
  }

  async findAll(query: PaginationDto, archived: boolean = false): Promise<{
    data: BrandDocument[];
    pages?: number;
    currentPage?: number;
    limit: number;
    skip: number;
    docscount?: number;
    archived?: boolean;
  }> {
    const { page, size, search } = query;
    const brands = await this.brandRepo.paginate({
      filter: {
        ...(archived ? { freezeAt: { $exists: true } } : {}),
        ...(search
          ? {
              $or: [
                { name: { $regex: search, $options: 'i' } },
                { slug: { $regex: search, $options: 'i' } },
                { slogan: { $regex: search, $options: 'i' } },
              ],
            }
          : {}),
      },
      page,
      size,
    });
    if (!brands || brands.data.length === 0)
      throw new NotFoundException('Brands not found');
    return brands as {
      data: BrandDocument[];
      pages: number;
      currentPage: number;
      limit: number;
      skip: number;
      docscount: number;
    };
  }

  findOne(id: number) {
    return `This action returns a #${id} brand`;
  }

  async update(
    id: Types.ObjectId,
    updateBrandDto: UpdateBrandDto,
    user: UserDocument,
  ): Promise<BrandDocument> {
    if (!user || !user._id) {
      throw new BadRequestException('User information is required');
    }
    const checkBrand = await this.brandRepo.findOne({
      filter: { _id: id },
    });
    if (!checkBrand) throw new NotFoundException('Brand not found');
    const updatedBrand = await this.brandRepo.findOneAndUpdate({
      filter: { _id: id },
      update: {
        ...updateBrandDto,
        updatedBy: user._id,
      },
      options: { new: true },
    });
    if (!updatedBrand) throw new BadRequestException('Failed to update brand');
    return updatedBrand as BrandDocument;
  }

  async updateAttachment(
    id: Types.ObjectId,
    file: Express.Multer.File,
    user: UserDocument,
  ): Promise<BrandDocument> {
    if (!user || !user._id) {
      throw new BadRequestException('User information is required');
    }
    const checkBrand = await this.brandRepo.findOne({
      filter: { _id: id },
    });
    if (!checkBrand) throw new NotFoundException('Brand not found');
    const image = await this.s3Service.uploadFile({
      file,
      storageApproach: StorageEnum.DISK,
      path: `${FolderEnum.BRANDS}`,
    });
    const updatedBrand = await this.brandRepo.findOneAndUpdate({
      filter: { _id: id },
      update: {
        image,
        updatedBy: user._id,
      },
      options: { new: true },
    });
    if (!updatedBrand) throw new BadRequestException('Failed to update brand');
    await this.s3Service.deleteFile({
      Key: checkBrand.image,
    });
    return updatedBrand as BrandDocument;
  }

  async freeze(
    brandId: Types.ObjectId,
    user: UserDocument,
  ): Promise<BrandDocument> {
    const checkBrand = await this.brandRepo.findOne({
      filter: { _id: brandId },
    });
    if (!checkBrand) throw new NotFoundException('Brand not found');
    if (checkBrand.freezeAt)
      throw new BadRequestException('Brand is already frozen');
    const updatedBrand = await this.brandRepo.findOneAndUpdate({
      filter: { _id: brandId },
      update: {
        freezeAt: new Date(),
        $unset: {
          restoreAt: 1,
        },
        updatedBy: user._id,
      },
      options: { new: true, upsert: true },
    });
    if (!updatedBrand) throw new BadRequestException('Failed to freeze brand');
    return updatedBrand as BrandDocument;
  }

  async restore(
    brandId: Types.ObjectId,
    user: UserDocument,
  ): Promise<BrandDocument> {
    const checkBrand = await this.brandRepo.findOne({
      filter: { _id: brandId },
    });
    if (!checkBrand) throw new NotFoundException('Brand not found');
    if (checkBrand.restoreAt)
      throw new BadRequestException('Brand is already restored');
    const updatedBrand = await this.brandRepo.findOneAndUpdate({
      filter: { _id: brandId },
      update: {
        restoreAt: new Date(),
        freezeAt: null,
        updatedBy: user._id,
      },
      options: { new: true },
    });
    if (!updatedBrand) throw new BadRequestException('Failed to restore brand');

    return updatedBrand as BrandDocument;
  }

  async remove(brandId: Types.ObjectId): Promise<BrandDocument> {
    const checkBrand = await this.brandRepo.findOne({
      filter: {
        _id: brandId,
        freezeAt: { $exists: true },
        restoreAt: { $exists: false },
      },
    });
    if (!checkBrand) throw new NotFoundException('Brand not found');
    const deletedBrand = await this.brandRepo.findOneAndDelete({
      filter: { _id: brandId },
    });
    await this.s3Service.deleteFile({
      Key: checkBrand.image,
    });
    if (!deletedBrand) throw new BadRequestException('Failed to delete brand');
    return deletedBrand;
  }
}
