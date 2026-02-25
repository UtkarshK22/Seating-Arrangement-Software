import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  /* ===================== OVERALL UTILIZATION ===================== */

  async getSeatUtilization(organizationId: string) {
    const [totalSeats, lockedSeats, occupiedSeats] =
      await this.prisma.$transaction([
        this.prisma.seat.count({
          where: {
            floor: {
              building: { organizationId },
            },
          },
        }),
        this.prisma.seat.count({
          where: {
            isLocked: true,
            floor: {
              building: { organizationId },
            },
          },
        }),
        this.prisma.seatAssignment.count({
          where: {
            isActive: true,
            seat: {
              floor: {
                building: { organizationId },
              },
            },
          },
        }),
      ]);

    const availableSeats =
      totalSeats - occupiedSeats - lockedSeats;

    const utilizationPercent =
      totalSeats === 0
        ? 0
        : Math.round((occupiedSeats / totalSeats) * 100);

    return {
      totalSeats,
      occupiedSeats,
      availableSeats,
      lockedSeats,
      utilizationPercent,
    };
  }

  /* ===================== FLOOR-WISE UTILIZATION ===================== */

  async getFloorUtilization(organizationId: string) {
    const floors = await this.prisma.floor.findMany({
      where: {
        building: { organizationId },
      },
      include: {
        seats: {
          include: {
            assignments: {
              where: { isActive: true },
              select: { id: true },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return floors.map((floor) => {
      const totalSeats = floor.seats.length;

      const lockedSeats = floor.seats.filter(
        (seat) => seat.isLocked,
      ).length;

      const occupiedSeats = floor.seats.filter(
        (seat) => seat.assignments.length > 0,
      ).length;

      const availableSeats =
        totalSeats - occupiedSeats - lockedSeats;

      return {
        floorId: floor.id,
        floorName: floor.name,
        totalSeats,
        occupiedSeats,
        availableSeats,
        lockedSeats,
        utilizationPercent:
          totalSeats === 0
            ? 0
            : Math.round(
                (occupiedSeats / totalSeats) * 100,
              ),
      };
    });
  }
}