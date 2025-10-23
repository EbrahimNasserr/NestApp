import { NextFunction } from "express";

export const setDefaultLangMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const lang = req.headers['accept-language'] as string | undefined;
  req.headers['accept-language'] = lang || 'en';
  console.log(req.headers['accept-language']);
  
  next();
};