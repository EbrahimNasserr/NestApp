import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { CreateBrandDto } from './dto/create-brand.dto';
// import { UpdateBrandDto } from './dto/update-brand.dto';
import { BrandRepo } from 'src/DB/repo/brand.repo';
import { BrandDocument, UserDocument } from 'src/DB/models';
import { S3Service } from 'src/common/services';
import { StorageEnum } from 'src/common/enums/multer.enum';

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

  findAll() {
    return `This action returns all brand`;
  }

  findOne(id: number) {
    return `This action returns a #${id} brand`;
  }

  // update(id: number, updateBrandDto: UpdateBrandDto) {
  //   return `This action updates a #${id} brand`;
  // }

  remove(id: number) {
    return `This action removes a #${id} brand`;
  }
}
