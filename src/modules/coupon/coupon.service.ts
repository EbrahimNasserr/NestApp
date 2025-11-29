import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import { CouponDocument, CouponRepo, UserDocument } from 'src/DB';
import { S3Service } from 'src/common/services';
import { StorageEnum } from 'src/common/enums/multer.enum';
import { PaginationDto } from 'src/common';
import { Types } from 'mongoose';

@Injectable()
export class CouponService {
  constructor(
    private readonly couponRepo: CouponRepo,
    private readonly s3Service: S3Service,
  ) {}
  async create(
    createCouponDto: CreateCouponDto,
    user: UserDocument,
    file: Express.Multer.File,
  ): Promise<CouponDocument> {
    const checkCoupon = await this.couponRepo.findOne({
      filter: { code: createCouponDto.code },
    });
    if (checkCoupon) throw new ConflictException('Coupon code already exists');
    const image = await this.s3Service.uploadFile({
      file,
      storageApproach: StorageEnum.DISK,
      path: `coupons/${createCouponDto.code}`,
    });
    const coupon = await this.couponRepo.create([
      {
        ...createCouponDto,
        image,
        createdBy: user._id,
      },
    ]);
    if (!coupon || coupon.length === 0) {
      await this.s3Service.deleteFile({
        Key: image,
      });
      throw new BadRequestException('Failed to create coupon');
    }
    return coupon[0] as CouponDocument;
  }

  async findAll(
    query: PaginationDto,
    archived: boolean = false,
  ): Promise<{
    data: CouponDocument[];
    pages?: number;
    currentPage?: number;
    limit: number;
    skip: number;
    docscount?: number;
    archived?: boolean;
  }> {
    const { page, size, search } = query;
    const coupons = await this.couponRepo.paginate({
      filter: {
        ...(archived ? { freezeAt: { $exists: true } } : {}),
        ...(search
          ? {
              $or: [
                { name: { $regex: search, $options: 'i' } },
                { code: { $regex: search, $options: 'i' } },
                { slug: { $regex: search, $options: 'i' } },
              ],
            }
          : {}),
      },
      page,
      size,
    });
    if (!coupons || coupons.data.length === 0)
      throw new NotFoundException('Coupons not found');
    return coupons as {
      data: CouponDocument[];
      pages: number;
      currentPage: number;
      limit: number;
      skip: number;
      docscount: number;
    };
  }

  async findOne(
    couponId: Types.ObjectId,
    archived: boolean = false,
  ): Promise<CouponDocument | null> {
    const coupon = await this.couponRepo.findOne({
      filter: {
        _id: couponId,
        ...(archived ? { freezeAt: { $exists: true } } : {}),
      },
    });
    if (!coupon) throw new NotFoundException('Coupon not found');
    return coupon as CouponDocument;
  }

  async update(
    id: Types.ObjectId,
    updateCouponDto: UpdateCouponDto,
    user: UserDocument,
  ): Promise<CouponDocument> {
    if (!user || !user._id) {
      throw new BadRequestException('User information is required');
    }
    const checkCoupon = await this.couponRepo.findOne({
      filter: { _id: id },
    });
    if (!checkCoupon) throw new NotFoundException('Coupon not found');

    // Check if code is being updated and if it already exists
    if (updateCouponDto.code && updateCouponDto.code !== checkCoupon.code) {
      const existingCoupon = await this.couponRepo.findOne({
        filter: { code: updateCouponDto.code },
      });
      if (existingCoupon) {
        throw new ConflictException('Coupon code already exists');
      }
    }

    const updatedCoupon = await this.couponRepo.findOneAndUpdate({
      filter: { _id: id },
      update: {
        ...updateCouponDto,
        updatedBy: user._id,
      },
      options: { new: true },
    });
    if (!updatedCoupon)
      throw new BadRequestException('Failed to update coupon');
    return updatedCoupon as CouponDocument;
  }

  async remove(couponId: Types.ObjectId): Promise<CouponDocument> {
    const checkCoupon = await this.couponRepo.findOne({
      filter: {
        _id: couponId,
        freezeAt: { $exists: true },
        restoreAt: { $exists: false },
      },
    });
    if (!checkCoupon) throw new NotFoundException('Coupon not found');
    const deletedCoupon = await this.couponRepo.findOneAndDelete({
      filter: { _id: couponId },
    });
    await this.s3Service.deleteFile({
      Key: checkCoupon.image,
    });
    if (!deletedCoupon)
      throw new BadRequestException('Failed to delete coupon');
    return deletedCoupon;
  }
}
