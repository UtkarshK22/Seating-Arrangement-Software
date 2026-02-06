import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  /* ===================== OVERALL UTILIZATION ===================== */

  async getSeatUtilization(organizationId: string) {
    const totalSeats = await this.prisma.seat.count({
      where: {
        floor: {
          building: {
            organizationId,
          },
        },
      },
    });

    const occupiedSeats = await this.prisma.seatAssignment.count({
      where: {
        isActive: true,
        seat: {
          floor: {
            building: {
              organizationId,
            },
          },
        },
      },
    });

    const availableSeats = totalSeats - occupiedSeats;

    const utilizationPercent =
      totalSeats === 0
        ? 0
        : Math.round((occupiedSeats / totalSeats) * 100);

    return {
      totalSeats,
      occupiedSeats,
      availableSeats,
      utilizationPercent,
    };
  }

  /* ===================== FLOOR-WISE UTILIZATION (NEW) ===================== */

  async getFloorUtilization(organizationId: string) {
    const floors = await this.prisma.floor.findMany({
      where: {
        building: {
          organizationId,
        },
      },
      include: {
        seats: {
          include: {
            assignments: {
              where: { isActive: true },
            },
          },
        },
      },
    });

    return floors.map((floor) => {
      const totalSeats = floor.seats.length;
      const occupiedSeats = floor.seats.filter(
        (seat) => seat.assignments.length > 0,
      ).length;

      return {
        floorId: floor.id,
        floorName: floor.name,
        totalSeats,
        occupiedSeats,
        utilizationPercent:
          totalSeats === 0
            ? 0
            : Math.round((occupiedSeats / totalSeats) * 100),
      };
    });
  }
}
