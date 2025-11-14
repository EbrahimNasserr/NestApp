import { ICategory } from 'src/common';

export class CategoryResponse {
  category: ICategory;
}

export class CategoryPaginationResponse {
  data: CategoryResponse[];
  pages?: number;
  currentPage?: number;
  limit: number;
  skip: number;
  docscount?: number;
}
