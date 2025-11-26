import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  Query,
  NotFoundException,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import {
  CategoryParamsDto,
  UpdateCategoryDto,
} from './dto/update-category.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { cloudMulterFile, validationMulter } from 'src/common/utils/multer';
import { StorageEnum } from 'src/common/enums/multer.enum';
import { Auth } from 'src/common/decorators/auth.decorator';
import { IResponse, RoleEnum, successResponse, User, PaginationDto, PaginationEntity } from 'src/common';
import type { UserDocument } from 'src/DB';
import {
  CategoryResponse,
} from './entities/category.entity';

@UsePipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
  }),
)
@Controller('category')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

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
    @Body() createcategoryDto: CreateCategoryDto,
    @User() user: UserDocument,
    @UploadedFile(ParseFilePipe) file: Express.Multer.File,
  ): Promise<IResponse<CategoryResponse | undefined>> {
    const category = await this.categoryService.create(
      createcategoryDto,
      user,
      file,
    );
    return successResponse<CategoryResponse>(
      'category created successfully',
      201,
      {
        category: category.toObject(),
      },
    );
  }

  @Get()
  async findAll(
    @Query() query: PaginationDto,
  ): Promise<IResponse<PaginationEntity<CategoryResponse> | undefined>> {
    const categorys = await this.categoryService.findAll(query);
    return successResponse<PaginationEntity<CategoryResponse>>(
      'categorys fetched successfully',
      200,
      {
        data: categorys.data.map((category) => ({
          category: category.toObject(),
        })),
        pages: categorys.pages,
        currentPage: categorys.currentPage,
        limit: categorys.limit,
        skip: categorys.skip,
        docscount: categorys.docscount,
      },
    );
  }

  @Auth([RoleEnum.ADMIN, RoleEnum.SUPER_ADMIN])
  @Get('/archived')
  async findAllArchived(
    @Query() query: PaginationDto,
  ): Promise<IResponse<PaginationEntity<CategoryResponse> | undefined>> {
    const categorys = await this.categoryService.findAll(query, true);
    return successResponse<PaginationEntity<CategoryResponse>>(
      'categorys fetched successfully',
      200,
      {
        data: categorys.data.map((category) => ({
          category: category.toObject(),
        })),
        pages: categorys.pages,
        currentPage: categorys.currentPage,
        limit: categorys.limit,
        skip: categorys.skip,
        docscount: categorys.docscount,
      },
    );
  }

  @Get(':categoryId')
  async findOne(
    @Param() params: CategoryParamsDto,
    @Query() query: { archived: boolean },
  ): Promise<IResponse<CategoryResponse | undefined>> {
    const category = await this.categoryService.findOne(
      params.categoryId,
      query.archived,
    );
    if (!category) throw new NotFoundException('category not found');
    return successResponse<CategoryResponse>(
      'category fetched successfully',
      200,
      {
        category: category.toObject(),
      },
    );
  }

  @Auth([RoleEnum.ADMIN, RoleEnum.SUPER_ADMIN])
  @Patch(':categoryId')
  async update(
    @Param() params: CategoryParamsDto,
    @Body() updatecategoryDto: UpdateCategoryDto,
    @User() user: UserDocument,
  ): Promise<IResponse<CategoryResponse | undefined>> {
    const category = await this.categoryService.update(
      params.categoryId,
      updatecategoryDto,
      user,
    );
    return successResponse<CategoryResponse>(
      'category updated successfully',
      200,
      {
        category: category.toObject(),
      },
    );
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
  @Patch(':categoryId/attachment')
  async updateAttachment(
    @Param() params: CategoryParamsDto,
    @UploadedFile(ParseFilePipe) file: Express.Multer.File,
    @User() user: UserDocument,
  ): Promise<IResponse<CategoryResponse | undefined>> {
    const category = await this.categoryService.updateAttachment(
      params.categoryId,
      file,
      user,
    );
    return successResponse<CategoryResponse>(
      'category updated successfully',
      200,
      {
        category: category.toObject(),
      },
    );
  }

  @Auth([RoleEnum.ADMIN, RoleEnum.SUPER_ADMIN])
  @Delete(':categoryId/freeze')
  async freeze(
    @Param() params: CategoryParamsDto,
    @User() user: UserDocument,
  ): Promise<IResponse<CategoryResponse | undefined>> {
    const category = await this.categoryService.freeze(params.categoryId, user);
    return successResponse<CategoryResponse>(
      'category frozen successfully',
      200,
      {
        category: category.toObject(),
      },
    );
  }

  @Auth([RoleEnum.ADMIN, RoleEnum.SUPER_ADMIN])
  @Patch(':categoryId/restore')
  async restore(
    @Param() params: CategoryParamsDto,
    @User() user: UserDocument,
  ): Promise<IResponse<CategoryResponse | undefined>> {
    const category = await this.categoryService.restore(
      params.categoryId,
      user,
    );
    return successResponse<CategoryResponse>(
      'category restored successfully',
      200,
      {
        category: category.toObject(),
      },
    );
  }

  @Auth([RoleEnum.ADMIN, RoleEnum.SUPER_ADMIN])
  @Delete(':categoryId')
  async remove(
    @Param() params: CategoryParamsDto,
  ): Promise<IResponse<CategoryResponse | undefined>> {
    await this.categoryService.remove(params.categoryId);
    return successResponse('category removed successfully', 200);
  }
}
