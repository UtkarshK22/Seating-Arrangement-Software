import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProjectResolutionService {
  constructor(private prisma: PrismaService) {}

  async resolveActiveProject(userId: string, organizationId: string) {
    const membership = await this.prisma.projectMember.findFirst({
      where: {
        userId,
        organizationId,
        project: { isActive: true },
      },
      orderBy: { lastActiveAt: 'desc' },
      include: { project: true },
    });

    return membership?.project ?? null;
  }
}