import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { OtpModel, UserModel, TokenModel } from 'src/DB';
import { OtpRepo, UserRepo, TokenRepo } from 'src/DB/repo';
import { JwtService } from '@nestjs/jwt';
import { TokenService } from 'src/common';

@Module({
  imports: [UserModel, OtpModel, TokenModel],
  controllers: [AuthController],
  providers: [
    AuthService,
    UserRepo,
    OtpRepo,
    TokenRepo,
    JwtService,
    TokenService,
  ],
  exports: [AuthService, TokenService],
})
export class AuthModule {}
