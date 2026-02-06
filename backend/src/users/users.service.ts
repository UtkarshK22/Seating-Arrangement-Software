import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  // -----------------------------
  // Get current user (org-aware)
  // -----------------------------
  getMe(userId: string, organizationId: string) {
  return this.prisma.user.findFirst({
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
}

  // -----------------------------
  // Update user profile (NO ROLE)
  // -----------------------------
  updateMe(userId: string, dto: UpdateUserDto) {
    return this.prisma.user.update({
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
  }
}

