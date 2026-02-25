import {
  Injectable,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SeatAuditAction, ExportType } from '@prisma/client';
import { ExportLogsService } from '../export-logs/export-logs.service';

@Injectable()
export class SeatAuditService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly exportLogsService: ExportLogsService,
  ) {}

  /* =========================================================
     CREATE AUDIT LOG (INTERNAL SAFE)
  ========================================================= */

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
    // Optional validation: ensure seat exists
    const seat = await this.prisma.seat.findUnique({
      where: { id: data.seatId },
      select: { id: true },
    });

    if (!seat) {
      throw new NotFoundException('Seat not found for audit log');
    }

    await this.prisma.seatAuditLog.create({ data });
  }

  /* =========================================================
     GET AUDIT BY SEAT (ORG SAFE)
  ========================================================= */

  async getBySeat(seatId: string, organizationId: string) {
    const seat = await this.prisma.seat.findFirst({
      where: {
        id: seatId,
        floor: {
          building: { organizationId },
        },
      },
    });

    if (!seat) {
      throw new ForbiddenException('Access denied');
    }

    return this.prisma.seatAuditLog.findMany({
      where: { seatId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /* =========================================================
     GET FLOOR AUDIT (ORG SAFE + PAGINATED)
  ========================================================= */

  async getAuditForFloor(
    floorId: string,
    organizationId: string,
    page = 1,
    limit = 20,
    from?: string,
    to?: string,
  ) {
    const floor = await this.prisma.floor.findFirst({
      where: {
        id: floorId,
        building: { organizationId },
      },
    });

    if (!floor) {
      throw new ForbiddenException('Access denied');
    }

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
      seat: { floorId },
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

  /* =========================================================
     EXPORT CSV (ORG SAFE + COOLDOWN FIRST)
  ========================================================= */

  async exportAuditCsv(
    floorId: string,
    organizationId: string,
    userId: string,
    from?: string,
    to?: string,
  ) {
    // 🔐 Validate floor first
    const floor = await this.prisma.floor.findFirst({
      where: {
        id: floorId,
        building: { organizationId },
      },
    });

    if (!floor) {
      throw new ForbiddenException('Access denied');
    }

    // 🔐 Check cooldown BEFORE heavy DB query
    try {
      await this.exportLogsService.assertCooldownOrThrow(
        organizationId,
        ExportType.SEAT_ALLOCATION,
      );
    } catch (e) {
      throw new ConflictException(e.message);
    }

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
        seat: { floorId },
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
        row.map((cell) =>
          `"${String(cell).replace(/"/g, '""')}"`,
        ).join(','),
      )
      .join('\n');

// Cooldown already enforced earlier
// Export logging handled by ExportLogsService

    return csv;
  }
}