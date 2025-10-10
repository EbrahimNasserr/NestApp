import { Injectable } from '@nestjs/common';
import { ICategory } from 'src/common';

@Injectable()
export class CategoryService {
    getCategories(): ICategory[] {
        return [
            {
                id: 1,
                name: 'Category 1',
                description: 'Description 1',
            },
        ];
    }
}
