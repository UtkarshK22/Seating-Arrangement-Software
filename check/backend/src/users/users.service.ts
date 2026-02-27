import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  /* =========================
     GET CURRENT USER (ORG SAFE)
  ========================= */

  async getMe(userId: string, organizationId: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        id: userId,
        memberships: {
          some: {
            organizationId,
            isActive: true,
          },
        },
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new ForbiddenException(
        'User not part of this organization',
      );
    }

    return user;
  }

  /* =========================
     UPDATE USER PROFILE (ORG SAFE)
  ========================= */

  async updateMe(
    userId: string,
    organizationId: string,
    dto: UpdateUserDto,
  ) {
    // 🔐 Validate membership first
    const membership = await this.prisma.organizationMember.findFirst({
      where: {
        userId,
        organizationId,
        isActive: true,
      },
    });

    if (!membership) {
      throw new ForbiddenException(
        'Access denied to this organization',
      );
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        fullName: dto.fullName,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        createdAt: true,
      },
    });

    if (!updated) {
      throw new NotFoundException('User not found');
    }

    return updated;
  }
}