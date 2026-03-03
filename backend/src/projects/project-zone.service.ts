import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProjectZoneService {
  constructor(private prisma: PrismaService) {}

  async upsertZone(
    projectId: string,
    organizationId: string,
    floorId: string,
    boundary: {
      minX: number;
      minY: number;
      maxX: number;
      maxY: number;
      isHardBoundary: boolean;
    },
  ) {
    return this.prisma.projectZone.upsert({
      where: { projectId },
      update: {
        ...boundary,
        floorId,
      },
      create: {
        projectId,
        organizationId,
        floorId,
        ...boundary,
      },
    });
  }
}