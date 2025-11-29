import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UsePipes,
  ValidationPipe,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  NotFoundException,
} from '@nestjs/common';
import { CouponService } from './coupon.service';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto, CouponParamsDto } from './dto/update-coupon.dto';
import {
  IResponse,
  RoleEnum,
  successResponse,
  User,
  PaginationDto,
  PaginationEntity,
} from 'src/common';
import { Auth } from 'src/common/decorators/auth.decorator';
import type { UserDocument } from 'src/DB';
import { FileInterceptor } from '@nestjs/platform-express';
import { cloudMulterFile, validationMulter } from 'src/common/utils/multer';
import { StorageEnum } from 'src/common/enums/multer.enum';
import { CouponResponseEntity } from './entities/coupon.entity';

@UsePipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
  }),
)
@Controller('coupon')
export class CouponController {
  constructor(private readonly couponService: CouponService) {}

  @UseInterceptors(
    FileInterceptor(
      'attachment',
      cloudMulterFile({
        storageApproach: StorageEnum.DISK,
        validations: validationMulter.image,
        fileSize: 1024 * 1024 * 5,
      }),
    ),
  )
  @Auth([RoleEnum.ADMIN, RoleEnum.SUPER_ADMIN])
  @Post()
  async create(
    @Body() createCouponDto: CreateCouponDto,
    @User() user: UserDocument,
    @UploadedFile(ParseFilePipe) file: Express.Multer.File,
  ): Promise<IResponse<CouponResponseEntity | undefined>> {
    const coupon = await this.couponService.create(createCouponDto, user, file);
    return successResponse<CouponResponseEntity>(
      'Coupon created successfully',
      201,
      {
        coupon: coupon.toObject(),
      },
    );
  }

  @Get()
  async findAll(
    @Query() query: PaginationDto,
  ): Promise<IResponse<PaginationEntity<CouponResponseEntity> | undefined>> {
    const coupons = await this.couponService.findAll(query);
    return successResponse<PaginationEntity<CouponResponseEntity>>(
      'Coupons fetched successfully',
      200,
      {
        data: coupons.data.map((coupon) => ({
          coupon: coupon.toObject(),
        })),
        pages: coupons.pages,
        currentPage: coupons.currentPage,
        limit: coupons.limit,
        skip: coupons.skip,
        docscount: coupons.docscount,
      },
    );
  }

  @Get(':id')
  async findOne(
    @Param() params: CouponParamsDto,
    @Query() query: { archived?: boolean },
  ): Promise<IResponse<CouponResponseEntity | undefined>> {
    const coupon = await this.couponService.findOne(
      params.id,
      query.archived || false,
    );
    if (!coupon) throw new NotFoundException('Coupon not found');
    return successResponse<CouponResponseEntity>(
      'Coupon fetched successfully',
      200,
      {
        coupon: coupon.toObject(),
      },
    );
  }

  @Auth([RoleEnum.ADMIN, RoleEnum.SUPER_ADMIN])
  @Patch(':id')
  async update(
    @Param() params: CouponParamsDto,
    @Body() updateCouponDto: UpdateCouponDto,
    @User() user: UserDocument,
  ): Promise<IResponse<CouponResponseEntity | undefined>> {
    const coupon = await this.couponService.update(
      params.id,
      updateCouponDto,
      user,
    );
    return successResponse<CouponResponseEntity>(
      'Coupon updated successfully',
      200,
      {
        coupon: coupon.toObject(),
      },
    );
  }

  @Auth([RoleEnum.ADMIN, RoleEnum.SUPER_ADMIN])
  @Delete(':id')
  async remove(
    @Param() params: CouponParamsDto,
  ): Promise<IResponse<CouponResponseEntity | undefined>> {
    const coupon = await this.couponService.remove(params.id);
    return successResponse<CouponResponseEntity>(
      'Coupon deleted successfully',
      200,
      {
        coupon: coupon.toObject(),
      },
    );
  }
}
