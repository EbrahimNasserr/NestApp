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
} from '@nestjs/common';
import { BrandService } from './brand.service';
import { CreateBrandDto } from './dto/create-brand.dto';
// import { UpdateBrandDto } from './dto/update-brand.dto';
import { IResponse, RoleEnum, successResponse, User } from 'src/common';
import type { UserDocument } from 'src/DB/models';
import { FileInterceptor } from '@nestjs/platform-express';
import { cloudMulterFile, validationMulter } from 'src/common/utils/multer';
import { StorageEnum } from 'src/common/enums/multer.enum';
import { BrandResponse } from './entities/brand.entity';
import { Auth } from 'src/common/decorators/auth.decorator';

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
  findAll() {
    return this.brandService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.brandService.findOne(+id);
  }

  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updateBrandDto: UpdateBrandDto) {
  //   return this.brandService.update(+id, updateBrandDto);
  // }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.brandService.remove(+id);
  }
}
