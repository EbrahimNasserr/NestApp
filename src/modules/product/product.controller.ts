import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UploadedFiles,
  ParseFilePipe,
  UsePipes,
  ValidationPipe,
  Query,
  NotFoundException,
} from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductParamDto, UpdateProductDto } from './dto/update-product.dto';
import { FilesInterceptor } from '@nestjs/platform-express';
import { cloudMulterFile, validationMulter } from 'src/common/utils/multer';
import { StorageEnum } from 'src/common/enums/multer.enum';
import { Auth } from 'src/common/decorators/auth.decorator';
import { IResponse, PaginationDto, RoleEnum, User } from 'src/common';
import { successResponse } from 'src/common/utils/response';
import type { UserDocument } from 'src/DB';
import { ProductResponseEntity } from './entities/product.entity';

@UsePipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
  }),
)
@Controller('product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @UseInterceptors(
    FilesInterceptor(
      'attachment',
      5,
      cloudMulterFile({
        storageApproach: StorageEnum.DISK,
        validations: validationMulter.image,
        fileSize: 1024 * 1024 * 10,
      }),
    ),
  )
  @Auth([RoleEnum.ADMIN, RoleEnum.SUPER_ADMIN])
  @Post()
  create(
    @Body() createProductDto: CreateProductDto,
    @User() user: UserDocument,
    @UploadedFiles(ParseFilePipe) files: Express.Multer.File[],
  ) {
    return this.productService.create(createProductDto, user, files);
  }

  @Get()
  async findAll(@Query() query: PaginationDto): Promise<IResponse<any>> {
    const products = await this.productService.findAll(query);
    return successResponse('products fetched successfully', 200, {
       products: products.data.map((product) => {
        const productObj = product.toObject();
        // Remove internal MongoDB fields for cleaner response
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { __v: _, ...cleanProduct } = productObj;
        return cleanProduct;
      }),
      pagination: {
        pages: products.pages,
        currentPage: products.currentPage,
        limit: products.limit,
        skip: products.skip,
        total: products.docscount,
      },
    });
  }

  @Get(':productId')
  async findOne(
    @Param() params: ProductParamDto,
    @Query() query: { archived: boolean },
  ): Promise<IResponse<ProductResponseEntity | undefined>> {
    const product = await this.productService.findOne(
      params.productId,
      query.archived,
    );
    if (!product) throw new NotFoundException('product not found');
    return successResponse<ProductResponseEntity>(
      'product fetched successfully',
      200,
      {
        product: product.toObject(),
      },
    );
  }

  @UseInterceptors(
    FilesInterceptor(
      'attachment',
      5,
      cloudMulterFile({
        storageApproach: StorageEnum.DISK,
        validations: validationMulter.image,
        fileSize: 1024 * 1024 * 10,
      }),
    ),
  )
  @Auth([RoleEnum.ADMIN, RoleEnum.SUPER_ADMIN])
  @Patch(':productId')
  update(
    @Param() params: ProductParamDto,
    @Body() updateProductDto: UpdateProductDto,
    @User() user: UserDocument,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    return this.productService.update(
      params.productId,
      updateProductDto,
      user,
      files,
    );
  }

  @Auth([RoleEnum.ADMIN, RoleEnum.SUPER_ADMIN])
  @Delete(':productId/freeze')
  async freeze(
    @Param() params: ProductParamDto,
    @User() user: UserDocument,
  ): Promise<IResponse<ProductResponseEntity | undefined>> {
    const product = await this.productService.freeze(params.productId, user);
    return successResponse<ProductResponseEntity>(
      'product frozen successfully',
      200,
      {
        product: product.toObject(),
      },
    );
  }

  @Auth([RoleEnum.ADMIN, RoleEnum.SUPER_ADMIN])
  @Patch(':productId/restore')
  async restore(
    @Param() params: ProductParamDto,
    @User() user: UserDocument,
  ): Promise<IResponse<ProductResponseEntity | undefined>> {
    const product = await this.productService.restore(params.productId, user);
    return successResponse<ProductResponseEntity>(
      'product restored successfully',
      200,
      {
        product: product.toObject(),
      },
    );
  }

  @Auth([RoleEnum.ADMIN, RoleEnum.SUPER_ADMIN])
  @Delete(':productId')
  async remove(
    @Param() params: ProductParamDto,
  ): Promise<IResponse<ProductResponseEntity | undefined>> {
    await this.productService.remove(params.productId);
    return successResponse('product removed successfully', 200);
  }
}
