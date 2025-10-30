import { MiddlewareConsumer, Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { setDefaultLangMiddleware } from 'src/common';
import { AuthModule } from '../auth/auth.module';
import { PreAuth } from 'src/common/middleware/auth.middle';
import { S3Service } from 'src/common/services';
@Module({
  imports: [
    AuthModule,
  ],
  controllers: [UserController],
  providers: [UserService, S3Service],
  exports: [],
})
export class UserModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(setDefaultLangMiddleware, PreAuth).forRoutes('user');
  }
}
