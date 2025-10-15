import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { compareHash, generateHash, IUser, ProviderEnum } from 'src/common';
import {
  ConfirmEmailDto,
  ForgotPasswordDto,
  LoginDto,
  ResetPasswordDto,
  SignupDto,
} from './dto/signup.dto';
import { UserRepo } from 'src/DB/repo';
import { JwtService } from '@nestjs/jwt';
import { MailService } from 'src/common/email.service';
import { OAuth2Client } from 'google-auth-library';

@Injectable()
export class AuthService {
  private users: IUser[] = [];
  private googleClient: OAuth2Client;
  constructor(
    private readonly userRepo: UserRepo,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
  ) {
    this.googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  }

  async signup(data: SignupDto): Promise<string> {
    const { username, email, password } = data;
    const checkUser = await this.userRepo.findOne({ filter: { email } });
    if (checkUser) {
      throw new ConflictException('User already exists');
    }
    const otp = Math.random().toString().slice(2, 8);

    const user = await this.userRepo.create([
      {
        username,
        email,
        password,
        confirmEmailOtp: otp,
      },
    ]);
    if (!user) {
      throw new BadRequestException('Failed to create user');
    }

    this.mailService
      .sendMail(email, 'Confirm Email OTP', `Your OTP is ${otp}`)
      .catch((error) => {
        console.error('Failed to send confirmation email:', error);
      });

    return 'Signup successful! Please check your email to confirm.';
  }

  async confirmEmail(data: ConfirmEmailDto): Promise<string> {
    const { email, otp } = data;
    const user = await this.userRepo.findOne({
      filter: { email, confirmEmail: { $exists: false } },
    });
    if (!user) {
      throw new BadRequestException('User not found');
    }
    if (user.confirmEmailOtp !== otp) {
      throw new BadRequestException('Invalid OTP');
    }
    await this.userRepo.updateOne({
      filter: { email },
      update: { confirmEmail: new Date() },
    });
    return 'Email confirmed successfully';
  }

  async login(data: LoginDto): Promise<any> {
    const { email, password } = data;
    const user = await this.userRepo.findOne({
      filter: { email },
    });
    if (!user) {
      throw new BadRequestException('User not found');
    }
    const isPasswordValid = await compareHash(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid password');
    }
    if (!user.confirmEmail) {
      throw new BadRequestException('Email not confirmed');
    }
    const payload = { email: user.email, sub: user._id };
    const token = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_SECRET,
    });
    const userWithoutPassword = await this.userRepo.findOne({
      filter: { email },
      select: {
        password: 0,
        confirmEmailOtp: 0,
        resetPasswordToken: 0,
        resetPasswordExpires: 0,
      },
    });
    return { user: userWithoutPassword, token };
  }

  async forgotPassword(data: ForgotPasswordDto): Promise<string> {
    const { email } = data;
    const user = await this.userRepo.findOne({
      filter: { email, resetPasswordToken: { $exists: false } },
    });
    if (!user) {
      throw new BadRequestException('User not found');
    }
    const resetPasswordToken = Math.random().toString().slice(2, 8);
    const resetPasswordExpires = new Date(Date.now() + 1000 * 60 * 60 * 24); // 1 day
    await this.userRepo.updateOne({
      filter: { email },
      update: { resetPasswordToken, resetPasswordExpires },
    });
    this.mailService
      .sendMail(
        email,
        'Reset Password OTP',
        `Your OTP is ${resetPasswordToken}`,
      )
      .catch((error) => {
        console.error('Failed to send reset password email:', error);
      });
    return 'Reset password link sent to email';
  }

  async resetPassword(data: ResetPasswordDto): Promise<string> {
    const { email, otp, password } = data;
    const user = await this.userRepo.findOne({
      filter: {
        email,
      },
    });
    if (!user) {
      throw new BadRequestException('User not found');
    }
    if (user.resetPasswordToken !== otp) {
      throw new BadRequestException('Invalid OTP');
    }
    const hashedPassword = await generateHash(password);
    await this.userRepo.updateOne({
      filter: { email },
      update: {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      },
    });
    return 'Password reset successfully';
  }

  async googleSignup(idToken: string): Promise<any> {
    const ticket = await this.googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      throw new BadRequestException('Invalid Google token');
    }
    const { email, name, picture } = payload;
    const checkUser = await this.userRepo.findOne({
      filter: { email },
    });
    if (checkUser) {
      throw new ConflictException('User already exists');
    }
    const createdUser = await this.userRepo.create([
      {
        username: name,
        email,
        confirmEmail: new Date(),
        provider: ProviderEnum.GOOGLE,
        password: '',
        profilePicture: picture,
      },
    ]);
    if (!createdUser) {
      throw new BadRequestException('Failed to create user');
    }
    return createdUser;
  }

  async googleLogin(idToken: string): Promise<any> {
    const ticket = await this.googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      throw new BadRequestException('Invalid Google token');
    }
    const { email } = payload;
    const checkUser = await this.userRepo.findOne({
      filter: { email },
    });
    if (!checkUser) {
      throw new BadRequestException('User not found');
    }
    if (!checkUser.confirmEmail) {
      throw new BadRequestException('Email not confirmed');
    }
    const token = await this.jwtService.signAsync(
      { email: checkUser.email, sub: checkUser._id },
      {
        secret: process.env.JWT_SECRET,
      },
    );
    return { user: checkUser, token };
  }
}
