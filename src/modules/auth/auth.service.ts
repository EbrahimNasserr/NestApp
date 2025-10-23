import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import {
  compareHash,
  generateHash,
  IUser,
  OtpTypeEnum,
  ProviderEnum,
  emailEvent,
  TokenService,
  RoleEnum,
} from 'src/common';
import {
  ConfirmEmailDto,
  ForgotPasswordDto,
  LoginDto,
  ResetPasswordDto,
  SignupDto,
} from './dto/signup.dto';
import { OtpRepo, UserRepo } from 'src/DB/repo';
import { UserDocument } from 'src/DB/models/user.model';
import { OtpDocument } from 'src/DB/models/otp.model';
import { JwtService } from '@nestjs/jwt';
import { OAuth2Client } from 'google-auth-library';

@Injectable()
export class AuthService {
  private users: IUser[] = [];
  private googleClient: OAuth2Client;
  constructor(
    private readonly userRepo: UserRepo,
    private readonly otpRepo: OtpRepo,
    private readonly jwtService: JwtService,
    private readonly tokenService: TokenService,
  ) {
    this.googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  }

  async signup(data: SignupDto): Promise<string> {
    const { username, email, password } = data;
    const checkUser = await this.userRepo.findOne({ filter: { email } });
    if (checkUser) {
      throw new ConflictException('User already exists');
    }

    const nameParts = username.trim().split(' ');
    const firstName = nameParts[0] || 'User';
    const lastName =
      nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'Name';

    const user = await this.userRepo.create([
      {
        firstName,
        lastName,
        email,
        password,
      },
    ]);
    if (!user || user.length === 0) {
      throw new BadRequestException('Failed to create user');
    }

    const createdUser = user[0] as UserDocument;
    const otpCode = Math.random().toString().slice(2, 8);
    const otp = (await this.otpRepo.create([
      {
        code: otpCode,
        expiresAt: new Date(Date.now() + 2 * 60 * 1000),
        createdBy: createdUser._id,
        type: OtpTypeEnum.CONFIRM_EMAIL,
      },
    ])) as OtpDocument[];

    if (!otp || otp.length === 0) {
      throw new BadRequestException('Failed to create OTP');
    }
    return 'Signup successful! Please check your email to confirm.';
  }

  async confirmEmail(data: ConfirmEmailDto): Promise<string> {
    const { email, otp } = data;
    const user = await this.userRepo.findOne({
      filter: { email, confirmEmail: { $exists: false } },
      options: {
        populate: {
          path: 'otp',
          match: { type: OtpTypeEnum.CONFIRM_EMAIL },
        },
      },
    });
    if (!user) {
      throw new BadRequestException('User not found');
    }
    if (!(user.otp.length && (await compareHash(otp, user.otp[0].code)))) {
      throw new BadRequestException('Invalid OTP');
    }
    await this.userRepo.updateOne({
      filter: { email },
      update: { confirmEmail: new Date() },
    });
    await this.otpRepo.deleteOne({
      filter: { createdBy: user._id, type: OtpTypeEnum.CONFIRM_EMAIL },
    });
    return 'Email confirmed successfully';
  }

  async login(data: LoginDto): Promise<any> {
    const { email, password } = data;
    const user = await this.userRepo.findOne({
      filter: {
        email,
        confirmEmail: { $exists: true },
        provider: ProviderEnum.SYSTEM,
      },
    });
    if (!user) {
      throw new BadRequestException('User not found');
    }
    const isPasswordValid = await compareHash(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid Credentials');
    }
    if (!user.confirmEmail) {
      throw new BadRequestException('Email not confirmed');
    }
    const credentials = await this.tokenService.createLoginCredentials(
      user._id.toString(),
      RoleEnum.USER,
    );
    const userWithoutPassword = await this.userRepo.findOne({
      filter: { email },
      select: {
        password: 0,
        confirmEmailOtp: 0,
        resetPasswordToken: 0,
        resetPasswordExpires: 0,
      },
    });
    return { user: userWithoutPassword, ...credentials };
  }

  async forgotPassword(data: ForgotPasswordDto): Promise<string> {
    const { email } = data;
    const user = await this.userRepo.findOne({
      filter: { email, resetPasswordToken: { $ne: null } },
    });
    if (!user) {
      throw new BadRequestException('User not found');
    }
    const resetPasswordToken = Math.random().toString().slice(2, 8);
    const resetPasswordExpires = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes
    const otp = (await this.otpRepo.create([
      {
        code: resetPasswordToken,
        expiresAt: resetPasswordExpires,
        createdBy: user._id,
        type: OtpTypeEnum.RESET_PASSWORD,
      },
    ])) as OtpDocument[];
    if (!otp || otp.length === 0) {
      throw new BadRequestException('Failed to create OTP');
    }
    await this.userRepo.updateOne({
      filter: { email },
      update: { resetPasswordToken, resetPasswordExpires },
    });
    // Emit email event for sending reset password email
    emailEvent.emit(
      'sendResetPasswordEmail',
      email,
      resetPasswordToken,
      user.username,
    );
    return 'Reset password link sent to email';
  }

  async resetPassword(data: ResetPasswordDto): Promise<string> {
    const { email, otp, password } = data;
    const user = await this.userRepo.findOne({
      filter: {
        email,
      },
      options: {
        populate: {
          path: 'otp',
          match: { type: OtpTypeEnum.RESET_PASSWORD },
        },
      },
    });
    if (!user) {
      throw new BadRequestException('User not found');
    }
    if (!user.otp || user.otp.length === 0) {
      throw new BadRequestException('No valid reset password OTP found');
    }
    const otpRecord = user.otp[0];
    if (otpRecord.expiresAt < new Date()) {
      throw new BadRequestException('OTP has expired');
    }
    if (!(await compareHash(otp, otpRecord.code))) {
      throw new BadRequestException('Invalid OTP');
    }
    const hashedPassword = await generateHash(password);
    await this.userRepo.updateOne({
      filter: { email },
      update: { password: hashedPassword },
    });
    await this.otpRepo.deleteOne({
      filter: { createdBy: user._id, type: OtpTypeEnum.RESET_PASSWORD },
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
    const credentials = await this.tokenService.createLoginCredentials(
      checkUser._id.toString(),
      RoleEnum.USER,
    );
    return { user: checkUser, ...credentials };
  }
}
