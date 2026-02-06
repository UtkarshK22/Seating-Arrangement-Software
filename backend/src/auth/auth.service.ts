import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  // ==========================
  // REGISTER
  // ==========================
  async register(dto: RegisterDto) {
    const { email, password, fullName } = dto;

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new BadRequestException('User already exists');
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        fullName,
      },
    });

    const organization = await this.prisma.organization.create({
      data: {
        name: `${fullName}'s Organization`,
        slug: `${user.id}-org`,
      },
    });

    await this.prisma.organizationMember.create({
      data: {
        userId: user.id,
        organizationId: organization.id,
        role: 'OWNER',
        isActive: true,
      },
    });

    return this.generateToken(
      user.id,
      organization.id,
      'OWNER',
    );
  }

  // ==========================
  // LOGIN
  // ==========================
  async login(email: string, password: string, organizationId: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);

    if (!isValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const membership = await this.prisma.organizationMember.findFirst({
      where: {
        userId: user.id,
        organizationId,
        isActive: true,
      },
    });

    if (!membership) {
      throw new UnauthorizedException(
        'User is not part of any organization',
      );
    }

    return this.generateToken(
      user.id,
      membership.organizationId,
      membership.role as 'OWNER' | 'ADMIN' | 'EMPLOYEE',
    );
  }

  // ==========================
  // JWT HELPER
  // ==========================
  private generateToken(
    userId: string,
    organizationId: string,
    role: 'OWNER' | 'ADMIN' | 'EMPLOYEE',
  ) {
    const payload = {
      sub: userId,
      organizationId,
      role,
    };

    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
