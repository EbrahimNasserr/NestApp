import {
  Controller,
  Post,
  Body,
  HttpCode,
  UsePipes,
  ValidationPipe,
  Patch,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  ForgotPasswordDto,
  LoginDto,
  ResetPasswordDto,
  SignupDto,
} from './dto/signup.dto';
import { ConfirmEmailDto } from './dto/signup.dto';

@UsePipes(
  new ValidationPipe({
    stopAtFirstError: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }),
)
@Controller('/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/signup')
  async signup(@Body() body: SignupDto): Promise<{
    message: string;
  }> {
    await this.authService.signup(body);
    return {
      message: 'Signup successful! Please check your email to confirm.',
    };
  }

  @HttpCode(200)
  @Post('/login')
  async login(@Body() body: LoginDto): Promise<Record<string, any>> {
    const data = (await this.authService.login(body)) as Record<string, any>;
    return { message: 'Login successful', data };
  }

  @HttpCode(200)
  @Post('/confirm-email')
  async confirmEmail(@Body() body: ConfirmEmailDto): Promise<{
    message: string;
  }> {
    await this.authService.confirmEmail(body);
    return { message: 'Email confirmed successfully' };
  }

  @HttpCode(200)
  @Post('/forgot-password')
  async forgotPassword(@Body() body: ForgotPasswordDto): Promise<{
    message: string;
  }> {
    await this.authService.forgotPassword(body);
    return { message: 'Reset password link sent to email' };
  }

  @HttpCode(200)
  @Patch('/reset-password')
  async resetPassword(@Body() body: ResetPasswordDto): Promise<{
    message: string;
  }> {
    await this.authService.resetPassword(body);
    return { message: 'Password reset successfully' };
  }

  @HttpCode(200)
  @Post('/google-login')
  async googleLogin(
    @Body() body: { idToken: string },
  ): Promise<Record<string, any>> {
    const data = (await this.authService.googleLogin(body.idToken)) as Record<
      string,
      any
    >;
    return { message: 'Login with Google successful', data };
  }

  @HttpCode(200)
  @Post('/google-signup')
  async googleSignup(
    @Body() body: { idToken: string },
  ): Promise<Record<string, any>> {
    const data = (await this.authService.googleSignup(body.idToken)) as Record<
      string,
      any
    >;
    return { message: 'Signup with Google successful', data };
  }
}
