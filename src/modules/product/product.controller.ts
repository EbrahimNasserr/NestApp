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
} from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { FilesInterceptor } from '@nestjs/platform-express';
import { cloudMulterFile, validationMulter } from 'src/common/utils/multer';
import { StorageEnum } from 'src/common/enums/multer.enum';
import { Auth } from 'src/common/decorators/auth.decorator';
import { RoleEnum, User } from 'src/common';
import type { UserDocument } from 'src/DB';

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
  findAll() {
    return this.productService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productService.update(+id, updateProductDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productService.remove(+id);
  }
}
