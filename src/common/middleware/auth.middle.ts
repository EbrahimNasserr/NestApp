import {
  NextFunction, Request, Response } from 'express';
import { UnauthorizedException } from '@nestjs/common';

export const PreAuth = (req: Request, res: Response, next: NextFunction) => {
  if (req.headers.authorization?.split(' ')?.length !== 2) {
    throw new UnauthorizedException('Authorization header is required');
  }
  next();
};
