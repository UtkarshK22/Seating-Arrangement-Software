import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    const { sub, organizationId, role } = payload;

    if (!sub || !organizationId) {
      throw new UnauthorizedException(
        'Invalid token payload',
      );
    }

    // 🔐 Validate membership from DB
    const membership = await this.prisma.organizationMember.findFirst({
      where: {
        userId: sub,
        organizationId,
        isActive: true,
      },
      include: {
        user: true,
      },
    });

    if (!membership) {
      throw new UnauthorizedException(
        'User not authorized for this organization',
      );
    }

    return {
      id: membership.user.id,
      email: membership.user.email,
      role,
      organizationId,
    };
  }
}