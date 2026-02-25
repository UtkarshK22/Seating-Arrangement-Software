import { BadRequestException, Injectable, ForbiddenException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { SeatAuditService } from "../seat-audit/seat-audit.service";
import { SeatAuditAction } from "@prisma/client";
import { CreateSeatDto } from "./dto/create-seat.dto";

@Injectable()
export class SeatsService {
  constructor(
    private prisma: PrismaService,
    private seatAudit: SeatAuditService,
  ) {}

  // ---------- CREATE SEAT (ORG SAFE) ----------
  async createSeat(
    floorId: string,
    organizationId: string,
    dto: CreateSeatDto,
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
      throw new ForbiddenException("Floor not found or access denied");
    }

    return this.prisma.seat.create({
      data: {
        seatCode: dto.seatCode,
        x: dto.x,
        y: dto.y,
        floorId,
        isLocked: false,
      },
    });
  }

  // ---------- LEGACY CREATE (HARDENED) ----------
  async create(data: {
    seatCode: string;
    x: number;
    y: number;
    floorId: string;
    isLocked?: boolean;
  }) {
    const floor = await this.prisma.floor.findUnique({
      where: { id: data.floorId },
    });

    if (!floor) {
      throw new BadRequestException("Floor not found");
    }

    const existingSeat = await this.prisma.seat.findFirst({
      where: {
        floorId: data.floorId,
        seatCode: data.seatCode,
      },
    });

    if (existingSeat) {
      throw new BadRequestException(
        "Seat code already exists on this floor"
      );
    }

    return this.prisma.seat.create({
      data: {
        seatCode: data.seatCode,
        x: data.x,
        y: data.y,
        floorId: data.floorId,
        isLocked: data.isLocked ?? false,
      },
    });
  }

  // ---------- GET MY ACTIVE SEAT ----------
  async getMyActiveSeat(userId: string) {
    const assignment = await this.prisma.seatAssignment.findFirst({
      where: {
        userId,
        isActive: true,
      },
      include: {
        seat: {
          include: {
            floor: {
              include: {
                building: true,
              },
            },
          },
        },
      },
    });

    if (!assignment) {
      return null;
    }

    const { seat } = assignment;

    return {
      seatId: seat.id,
      seatCode: seat.seatCode,
      x: seat.x,
      y: seat.y,
      floorId: seat.floorId,
      floor: {
        id: seat.floor.id,
        width: seat.floor.width,
        height: seat.floor.height,
        imageUrl: seat.floor.imageUrl,
      },
    };
  }

  // ---------- LOCK / UNLOCK SEAT (ORG SAFE) ----------
  async toggleSeatLock(
    actorUserId: string,
    organizationId: string,
    seatId: string,
    isLocked: boolean,
  ) {
    const seat = await this.prisma.seat.findFirst({
      where: {
        id: seatId,
        floor: {
          building: {
            organizationId,
          },
        },
      },
    });

    if (!seat) {
      throw new ForbiddenException("Seat not found or access denied");
    }

    if (seat.isLocked === isLocked) {
      return seat;
    }

    const updatedSeat = await this.prisma.seat.update({
      where: { id: seatId },
      data: { isLocked },
    });

    await this.seatAudit.log({
      seatId: updatedSeat.id,
      seatCode: updatedSeat.seatCode,
      actorId: actorUserId,
      action: isLocked
        ? SeatAuditAction.LOCK
        : SeatAuditAction.UNLOCK,
      isLockedBefore: seat.isLocked,
      isLockedAfter: isLocked,
    });

    return updatedSeat;
  }
}