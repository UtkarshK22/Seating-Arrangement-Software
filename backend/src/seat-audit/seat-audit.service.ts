import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SeatAuditAction, ExportType } from '@prisma/client';
import { ExportLogsService } from '../export-logs/export-logs.service';
import { ConflictException } from '@nestjs/common';


@Injectable()
export class SeatAuditService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly exportLogsService: ExportLogsService,
  ) {}

  async log(data: {
    seatId: string;
    seatCode: string;
    userId?: string;
    actorId: string;
    action: SeatAuditAction;
    fromSeatId?: string;
    toSeatId?: string;
    isLockedBefore?: boolean;
    isLockedAfter?: boolean;
  }) {
    await this.prisma.seatAuditLog.create({ data });
  }

  async getBySeat(seatId: string, organizationId: string) {
    return this.prisma.seatAuditLog.findMany({
      where: {
        seatId,
        seat: {
          floor: {
            building: {
              organizationId,
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAuditForFloor(
    floorId: string,
    organizationId: string,
    page = 1,
    limit = 20,
    from?: string,
    to?: string,
  ) {
    const skip = (page - 1) * limit;

    const createdAtFilter =
      from || to
        ? {
            createdAt: {
              ...(from ? { gte: new Date(from) } : {}),
              ...(to ? { lte: new Date(to) } : {}),
            },
          }
        : {};

    const where = {
      seat: {
        floorId,
        building: {
          organizationId,
        },
      },
      ...createdAtFilter,
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.seatAuditLog.findMany({
        where,
        include: {
          actor: {
            select: { fullName: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.seatAuditLog.count({ where }),
    ]);

    return {
      data,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  async exportAuditCsv(
    floorId: string,
    organizationId: string,
    userId: string,
    from?: string,
    to?: string,
  ) {
    const createdAtFilter =
      from || to
        ? {
            createdAt: {
              ...(from ? { gte: new Date(from) } : {}),
              ...(to ? { lte: new Date(to) } : {}),
            },
          }
        : {};

    const logs = await this.prisma.seatAuditLog.findMany({
      where: {
        seat: {
          floor: {
            building: {
              organizationId,
            },
          },
        },
        ...createdAtFilter,
      },
      include: {
        actor: {
          select: { fullName: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const header = [
      'Action',
      'Seat Code',
      'Actor',
      'From Seat',
      'To Seat',
      'Timestamp',
    ];

    const rows = logs.map((log) => [
      log.action,
      log.seatCode,
      log.actor.fullName,
      log.fromSeatId ?? '',
      log.toSeatId ?? '',
      log.createdAt.toISOString(),
    ]);

    const csv = [header, ...rows]
      .map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','),
      )
      .join('\n');

    // ✅ LOG EXPORT ONLY AFTER CSV IS SUCCESSFULLY BUILT
    // await this.exportLogsService.logExport(
    //   organizationId,
    //   userId,
    //   ExportType.SEAT_ALLOCATION,
    // );
    try {
      await this.exportLogsService.assertCooldownOrThrow(
        organizationId,
        ExportType.SEAT_ALLOCATION,
      );
    } catch (e) {
      throw new ConflictException(e.message);
    }
    return csv;
  }
}
