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

    const lockedSeats = await this.prisma.seat.count({
      where: {
        isLocked: true,
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
        building: {
          organizationId,
        },
      },
      select: {
        id: true,
        name: true,
      },
    });

    const results = await Promise.all(
      floors.map(async (floor) => {
        const totalSeats = await this.prisma.seat.count({
          where: {
            floorId: floor.id,
          },
        });

        const lockedSeats = await this.prisma.seat.count({
          where: {
            floorId: floor.id,
            isLocked: true,
          },
        });

        const occupiedSeats =
          await this.prisma.seatAssignment.count({
            where: {
              isActive: true,
              seat: {
                floorId: floor.id,
              },
            },
          });

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
      }),
    );

    return results;
  }
}