import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UserModel } from 'src/DB';
import { UserRepo } from 'src/DB/repo';
import { JwtService } from '@nestjs/jwt';
import { MailService } from 'src/common/email.service';

@Module({
  imports: [UserModel],
  controllers: [AuthController],
  providers: [AuthService, UserRepo, JwtService, MailService],
  exports: [AuthService],
})
export class AuthModule {}