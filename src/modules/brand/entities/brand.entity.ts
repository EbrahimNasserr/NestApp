import { IBrand } from 'src/common';

export class BrandResponse {
  brand: IBrand;
}

export class BrandPaginationResponse {
  data: BrandResponse[];
  pages?: number;
  currentPage?: number;
  limit: number;
  skip: number;
  docscount?: number;
}
