import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { OtpModel, UserModel } from 'src/DB';
import { OtpRepo, UserRepo } from 'src/DB/repo';
import { JwtService } from '@nestjs/jwt';

@Module({
  imports: [UserModel, OtpModel],
  controllers: [AuthController],
  providers: [AuthService, UserRepo, OtpRepo, JwtService],
  exports: [AuthService],
})
export class AuthModule {}
