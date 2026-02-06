import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FloorsService {
  constructor(private readonly prisma: PrismaService) {}

  // =========================
  // CREATE FLOOR (ORG SAFE)
  // =========================
  async createFloor(
    organizationId: string,
    buildingId: string,
    name: string,
    imageUrl: string,
    width: number,
    height: number,
  ) {
    const building = await this.prisma.building.findFirst({
      where: {
        id: buildingId,
        organizationId,
      },
    });

    if (!building) {
      throw new ForbiddenException(
        'Building does not belong to your organization',
      );
    }

    return this.prisma.floor.create({
      data: {
        name,
        buildingId,
        imageUrl,
        width,
        height,
      },
    });
  }

  // =========================
  // GET SEATS (ORG SAFE)
  // =========================
  async getSeats(
    organizationId: string,
    floorId: string,
  ) {
    const floor = await this.prisma.floor.findFirst({
      where: {
        id: floorId,
        building: {
          organizationId,
        },
      },
    });

    if (!floor) {
      throw new ForbiddenException('Access denied');
    }

    return this.prisma.seat.findMany({
      where: { floorId },
      orderBy: { seatCode: 'asc' },
    });
  }

  // =========================
  // GET FLOOR MAP (ORG SAFE)
  // =========================
  async getFloorMap(
    organizationId: string,
    floorId: string,
  ) {
    const floor = await this.prisma.floor.findFirst({
      where: {
        id: floorId,
        building: {
          organizationId,
        },
      },
      include: {
        building: true,
        seats: {
          orderBy: { seatCode: 'asc' },
          include: {
            assignments: {
              where: { isActive: true },
              include: {
                user: {
                  select: {
                    id: true,
                    fullName: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!floor) {
      throw new ForbiddenException('Access denied');
    }

    return {
      floor: {
        id: floor.id,
        name: floor.name,
        imageUrl: floor.imageUrl,
        width: floor.width,
        height: floor.height,
      },
      seats: floor.seats.map((seat) => {
        const activeAssignment = seat.assignments[0] ?? null;

        return {
          id: seat.id,
          seatCode: seat.seatCode,
          x: seat.x,
          y: seat.y,
          isLocked: seat.isLocked,
          isOccupied: Boolean(activeAssignment),
          assignedUser: activeAssignment
            ? {
                id: activeAssignment.user.id,
                fullName: activeAssignment.user.fullName,
                email: activeAssignment.user.email,
              }
            : null,
        };
      }),
    };
  }
}
