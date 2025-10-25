import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { LoggingInterceptor } from './common/interceptors';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port: number | string = process.env.PORT ?? '3000';
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
