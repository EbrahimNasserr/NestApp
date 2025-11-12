import {
  Controller,
  Get,
  Post,
  Body,
  // Patch,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  Patch,
  UsePipes,
  ValidationPipe,
  Query,
  NotFoundException,
} from '@nestjs/common';
import { BrandService } from './brand.service';
import { CreateBrandDto } from './dto/create-brand.dto';
// import { UpdateBrandDto } from './dto/update-brand.dto';
import { IResponse, RoleEnum, successResponse, User } from 'src/common';
import type { UserDocument } from 'src/DB/models';
import { FileInterceptor } from '@nestjs/platform-express';
import { cloudMulterFile, validationMulter } from 'src/common/utils/multer';
import { StorageEnum } from 'src/common/enums/multer.enum';
import {
  BrandPaginationResponse,
  BrandResponse,
} from './entities/brand.entity';
import { Auth } from 'src/common/decorators/auth.decorator';
import { BrandParamsDto, UpdateBrandDto } from './dto/update-brand.dto';
import { PaginationDto } from './dto/pagination.dto';

@UsePipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
  }),
)
@Controller('brand')
export class BrandController {
  constructor(private readonly brandService: BrandService) {}

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
    @Body() createBrandDto: CreateBrandDto,
    @User() user: UserDocument,
    @UploadedFile(ParseFilePipe) file: Express.Multer.File,
  ): Promise<IResponse<BrandResponse | undefined>> {
    const brand = await this.brandService.create(createBrandDto, user, file);
    return successResponse<BrandResponse>('Brand created successfully', 201, {
      brand: brand.toObject(),
    });
  }

  @Get()
  async findAll(
    @Query() query: PaginationDto,
  ): Promise<IResponse<BrandPaginationResponse | undefined>> {
    const brands = await this.brandService.findAll(query);
    return successResponse<BrandPaginationResponse>(
      'Brands fetched successfully',
      200,
      {
        data: brands.data.map((brand) => ({ brand: brand.toObject() })),
        pages: brands.pages,
        currentPage: brands.currentPage,
        limit: brands.limit,
        skip: brands.skip,
        docscount: brands.docscount,
      },
    );
  }

  @Auth([RoleEnum.ADMIN, RoleEnum.SUPER_ADMIN])
  @Get("/archived")
  async findAllArchived(
    @Query() query: PaginationDto,
  ): Promise<IResponse<BrandPaginationResponse | undefined>> {
    const brands = await this.brandService.findAll(query , true);
    return successResponse<BrandPaginationResponse>(
      'Brands fetched successfully',
      200,
      {
        data: brands.data.map((brand) => ({ brand: brand.toObject() })),
        pages: brands.pages,
        currentPage: brands.currentPage,
        limit: brands.limit,
        skip: brands.skip,
        docscount: brands.docscount,
      },
    );
  }

  @Get(':brandId')
  async findOne(
    @Param() params: BrandParamsDto,
    @Query() query: { archived: boolean },
  ): Promise<IResponse<BrandResponse | undefined>> {
    const brand = await this.brandService.findOne(params.brandId, query.archived);
    if (!brand) throw new NotFoundException('Brand not found');
    return successResponse<BrandResponse>('Brand fetched successfully', 200, {
      brand: brand.toObject(),
    });
  }

  @Auth([RoleEnum.ADMIN, RoleEnum.SUPER_ADMIN])
  @Patch(':brandId')
  async update(
    @Param() params: BrandParamsDto,
    @Body() updateBrandDto: UpdateBrandDto,
    @User() user: UserDocument,
  ): Promise<IResponse<BrandResponse | undefined>> {
    const brand = await this.brandService.update(
      params.brandId,
      updateBrandDto,
      user,
    );
    return successResponse<BrandResponse>('Brand updated successfully', 200, {
      brand: brand.toObject(),
    });
  }

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
  @Patch(':brandId/attachment')
  async updateAttachment(
    @Param() params: BrandParamsDto,
    @UploadedFile(ParseFilePipe) file: Express.Multer.File,
    @User() user: UserDocument,
  ): Promise<IResponse<BrandResponse | undefined>> {
    const brand = await this.brandService.updateAttachment(
      params.brandId,
      file,
      user,
    );
    return successResponse<BrandResponse>('Brand updated successfully', 200, {
      brand: brand.toObject(),
    });
  }

  @Auth([RoleEnum.ADMIN, RoleEnum.SUPER_ADMIN])
  @Delete(':brandId/freeze')
  async freeze(
    @Param() params: BrandParamsDto,
    @User() user: UserDocument,
  ): Promise<IResponse<BrandResponse | undefined>> {
    const brand = await this.brandService.freeze(params.brandId, user);
    return successResponse<BrandResponse>('Brand frozen successfully', 200, {
      brand: brand.toObject(),
    });
  }

  @Auth([RoleEnum.ADMIN, RoleEnum.SUPER_ADMIN])
  @Patch(':brandId/restore')
  async restore(
    @Param() params: BrandParamsDto,
    @User() user: UserDocument,
  ): Promise<IResponse<BrandResponse | undefined>> {
    const brand = await this.brandService.restore(params.brandId, user);
    return successResponse<BrandResponse>('Brand restored successfully', 200, {
      brand: brand.toObject(),
    });
  }

  @Auth([RoleEnum.ADMIN, RoleEnum.SUPER_ADMIN])
  @Delete(':brandId')
  async remove(
    @Param() params: BrandParamsDto,
  ): Promise<IResponse<BrandResponse | undefined>> {
    await this.brandService.remove(params.brandId);
    return successResponse('Brand removed successfully', 200);
  }
}
