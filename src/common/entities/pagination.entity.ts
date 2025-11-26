export class PaginationEntity<T = any> {
  data: T[];
  pages?: number;
  currentPage?: number;
  limit: number;
  skip: number;
  docscount?: number;
}