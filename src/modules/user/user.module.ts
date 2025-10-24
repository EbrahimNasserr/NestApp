import { MiddlewareConsumer, Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { setDefaultLangMiddleware, AuthMiddleware } from 'src/common';
import { AuthModule } from '../auth/auth.module';
import { PreAuth } from 'src/common/middleware/auth.middle';
import { TokenTypeEnum } from 'src/common/enums/token.enum';
@Module({
  imports: [AuthModule],
  controllers: [UserController],
  providers: [UserService],
  exports: [],
})
export class UserModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(
        setDefaultLangMiddleware,
        PreAuth(TokenTypeEnum.Access),
        AuthMiddleware,
      )
      .forRoutes('user');
  }
}
