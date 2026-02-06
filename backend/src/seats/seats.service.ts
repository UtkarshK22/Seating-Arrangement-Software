import { BadRequestException, Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { SeatAuditService } from "../seat-audit/seat-audit.service";
import { SeatAuditAction } from "@prisma/client";


@Injectable()
export class SeatsService {
  constructor(
    private prisma: PrismaService,
    private seatAudit: SeatAuditService,
  ) {}

  // ---------- CREATE SEAT ----------
  async create(data: {
    seatCode: string;
    x: number;
    y: number;
    floorId: string;
    isLocked?: boolean;
  }) {
    // 1. Validate floor exists
    const floor = await this.prisma.floor.findUnique({
      where: { id: data.floorId },
    });

    if (!floor) {
      throw new BadRequestException("Floor not found");
    }

    // 2. Ensure seatCode is unique per floor
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

    // 3. Create seat
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

  // ---------- STEP 2: GET LOGGED-IN USER SEAT ----------
  async getMyActiveSeat(userId: string) {
    const assignment = await this.prisma.seatAssignment.findFirst({
      where: {
        userId,
        isActive: true,
      },
      include: {
        seat: {
          include: {
            floor: true,
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

  // ---------- LOCK / UNLOCK SEAT (PHASE 2) ----------
  async toggleSeatLock(
    actorUserId: string,
    seatId: string,
    isLocked: boolean,
  ) {
    const seat = await this.prisma.seat.findUnique({
      where: { id: seatId },
    });

    if (!seat) {
      throw new BadRequestException("Seat not found");
    }

    if (seat.isLocked === isLocked) {
      return seat; // no-op
    }

    const updatedSeat = await this.prisma.seat.update({
      where: { id: seatId },
      data: { isLocked },
    });

    // ✅ AUDIT LOG
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
