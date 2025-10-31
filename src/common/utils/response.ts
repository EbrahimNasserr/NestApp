import { IResponse } from '../interfaces';

export const successResponse = <T = any>(
  message?: string,
  statusCode?: number,
  data?: T,
): IResponse<T | undefined> => {
  return {
    message: message,
    statusCode: statusCode || 200,
    data: data || undefined,
  };
};
