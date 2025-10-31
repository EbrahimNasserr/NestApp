export interface IResponse<T = any> {
  data?: T;
  message?: string;
  statusCode?: number;
}