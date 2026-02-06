import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BuildingsService {
  constructor(private prisma: PrismaService) {}

  async createBuilding(organizationId: string, name: string) {
    return this.prisma.building.create({
      data: {
        name,
        organizationId,
      },
    });
  }
  async findAll(organizationId: string) {
  return this.prisma.building.findMany({
    where: { organizationId },
    orderBy: { createdAt: 'asc' },
  });
}

async getFloors(buildingId: string, organizationId: string) {
  return this.prisma.floor.findMany({
    where: {
      buildingId,
      building: { organizationId },
    },
    orderBy: { createdAt: 'asc' },
  });
}

async findAllForOrg(organizationId: string) {
  return this.prisma.building.findMany({
    where: { organizationId },
  });
}

async create(organizationId: string, name: string) {
  return this.prisma.building.create({
    data: {
      name,
      organizationId,
    },
  });
}


}
