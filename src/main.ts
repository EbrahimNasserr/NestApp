import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { LoggingInterceptor } from './common/interceptors';
import express from 'express';
import path from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bodyParser: false, // Disable default body parser
  });
  const port: number | string = process.env.PORT ?? '3000';
  
  // Create JSON parser middleware
  const jsonParser = express.json({ limit: '10mb' });
  
  // Custom JSON body parser that handles empty bodies
  app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
    const contentType = req.headers['content-type'] || '';
    
    // Only process JSON content types
    if (contentType.includes('application/json')) {
      const contentLength = parseInt(req.headers['content-length'] || '0', 10);
      
      // If body is empty, set to empty object and skip parsing
      if (contentLength === 0) {
        req.body = {};
        return next();
      }
      
      // Use express.json() for non-empty bodies, wrapped in error handler
      jsonParser(req, res, (err: any) => {
        if (err && (err.type === 'entity.parse.failed' || err.message?.includes('JSON'))) {
          // JSON parsing failed (empty or invalid), set empty object
          req.body = {};
          return next();
        }
        if (err) {
          return next(err);
        }
        next();
      });
    } else {
      next();
    }
  });
  
  app.use('/uploads', express.static(path.resolve('./uploads')));
  app.useGlobalInterceptors(new LoggingInterceptor());
  app.enableCors({
    origin: '*',
    credentials: true,
  });
  await app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
}
bootstrap();
