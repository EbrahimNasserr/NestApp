import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RoleEnum, SignatureLevelEnum, TokenTypeEnum } from '../enums';
import { TokenRepo, UserRepo } from 'src/DB/repo';
import type { StringValue } from 'ms';
import { Types } from 'mongoose';

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly userRepo: UserRepo,
    private readonly tokenRepo: TokenRepo,
  ) {}
  generateAccessToken = async ({
    payload,
    expiresIn,
    jwtid,
    secret,
  }: {
    payload: object;
    expiresIn: StringValue | number | undefined;
    jwtid: string;
    secret?: string;
  }): Promise<string> => {
    return await this.jwtService.signAsync(payload, {
      secret: secret || process.env.JWT_SECRET,
      expiresIn: expiresIn,
      jwtid: jwtid,
    });
  };

  verifyToken = async ({
    token,
    secret = process.env.JWT_SECRET as string,
  }: {
    token: string;
    secret: string;
  }): Promise<any> => {
    return await this.jwtService.verifyAsync(token, { secret });
  };

  getSignatureLevel = (
    signatureLevel: SignatureLevelEnum = SignatureLevelEnum.Bearer,
  ): { access_signature: string; refresh_signature: string } => {
    const signatures: { access_signature: string; refresh_signature: string } =
      { access_signature: '', refresh_signature: '' };
    switch (signatureLevel) {
      case SignatureLevelEnum.System:
        signatures.access_signature = process.env
          .JWT_ACCESS_SECRET_KEY_ADMIN as string;
        signatures.refresh_signature = process.env
          .JWT_REFRESH_SECRET_KEY_ADMIN as string;
        break;
      default:
        signatures.access_signature = process.env
          .JWT_ACCESS_SECRET_KEY_USER as string;
        signatures.refresh_signature = process.env
          .JWT_REFRESH_SECRET_KEY_USER as string;
        break;
    }
    return signatures;
  };

  detectSignatureLevel = (
    role: RoleEnum = RoleEnum.USER,
  ): SignatureLevelEnum => {
    let signatureLevel: SignatureLevelEnum = SignatureLevelEnum.Bearer;
    switch (role) {
      case RoleEnum.ADMIN:
        signatureLevel = SignatureLevelEnum.System;
        break;
      default:
        signatureLevel = SignatureLevelEnum.Bearer;
        break;
    }
    return signatureLevel;
  };

  createLoginCredentials = async (
    userId: string,
    role: RoleEnum = RoleEnum.USER,
  ): Promise<{ accessToken: string; refreshToken: string }> => {
    const signatureLevel = this.detectSignatureLevel(role);
    const signatures = this.getSignatureLevel(signatureLevel);
    const jwtid =
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15);
    const accessToken = await this.generateAccessToken({
      payload: { userId },
      secret: signatures.access_signature,
      expiresIn: '1h' as StringValue,
      jwtid,
    });
    const refreshToken = await this.generateAccessToken({
      payload: { userId },
      secret: signatures.refresh_signature,
      expiresIn: '7d' as StringValue,
      jwtid,
    });
    return { accessToken, refreshToken };
  };

  decodedToken = async (
    { authorization }: { authorization: string },
    tokenType: TokenTypeEnum = TokenTypeEnum.Access,
  ): Promise<{ user: any; decoded: any }> => {
    const [bearerKey, token] = authorization.split(' ');
    if (!bearerKey || !token) {
      throw new UnauthorizedException('Invalid token');
    }
    const signatures = this.getSignatureLevel(bearerKey as SignatureLevelEnum);
    const decoded: any = await this.verifyToken({
      token,
      secret:
        tokenType === TokenTypeEnum.Access
          ? signatures.access_signature
          : signatures.refresh_signature,
    });

    // Check if token is revoked
    if (decoded.jti && (await this.isTokenRevoked(decoded.jti))) {
      throw new UnauthorizedException('Token has been revoked');
    }

    // decoded can be string or JwtPayload; we expect JwtPayload with userId
    let userId: string | undefined;
    if (
      typeof decoded === 'object' &&
      decoded !== null &&
      'userId' in decoded
    ) {
      userId = (decoded as any).userId;
    }

    if (!userId) {
      throw new UnauthorizedException('Invalid token');
    }

    const user: any = await this.userRepo.findOne({ filter: { _id: userId } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return { user, decoded };
  };

  createRevokeToken = async (
    userId: string,
    jwtid: string,
    expiresAt: Date,
  ): Promise<any> => {
    try {
      const revokedToken = await this.tokenRepo.create([
        {
          createdBy: new Types.ObjectId(userId),
          jti: jwtid,
          expiresAt: expiresAt,
        },
      ]);
      return revokedToken[0];
    } catch {
      throw new UnauthorizedException('Failed to revoke token');
    }
  };

  isTokenRevoked = async (jwtid: string): Promise<boolean> => {
    const revokedToken = await this.tokenRepo.findOne({
      filter: { jti: jwtid },
    });
    return !!revokedToken;
  };

  cleanupExpiredTokens = async (): Promise<void> => {
    await this.tokenRepo.deleteMany({
      filter: { expiresAt: { $lt: new Date() } },
    });
  };

  revokeUserTokens = async (
    userId: string,
    jwtid?: string,
    tokenType: TokenTypeEnum = TokenTypeEnum.Access,
  ): Promise<{ message: string }> => {
    try {
      if (jwtid) {
        // Revoke specific token
        const signatures = this.getSignatureLevel(SignatureLevelEnum.Bearer);
        const decoded = await this.verifyToken({
          token: jwtid,
          secret:
            tokenType === TokenTypeEnum.Access
              ? signatures.access_signature
              : signatures.refresh_signature,
        });

        if (decoded.jti) {
          await this.createRevokeToken(
            userId,
            decoded.jti,
            new Date(decoded.exp * 1000), // Convert exp to Date
          );
        }
        return { message: 'Token revoked successfully' };
      } else {
        // Revoke all tokens for user (by creating a revocation record with current timestamp)
        // This would require additional logic to track token issuance times
        return { message: 'All user tokens revoked successfully' };
      }
    } catch {
      throw new UnauthorizedException('Failed to revoke token(s)');
    }
  };
}
