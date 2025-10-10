import { Controller, Get } from '@nestjs/common';
import { CategoryService } from './category.service';
import { ICategory } from 'src/common';

@Controller('category')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}
  @Get()
  getCategories(): { message: string; data: ICategory[] } {
    return {
      message: 'Categories fetched successfully',
      data: this.categoryService.getCategories(),
    };
  }
}
