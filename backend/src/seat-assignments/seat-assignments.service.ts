import {
  Injectable,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { SeatAuditService } from "../seat-audit/seat-audit.service";
import { SeatAuditAction } from "@prisma/client";

@Injectable()
export class SeatAssignmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly seatAudit: SeatAuditService,
  ) {}

  /* =========================================================
     ASSIGN SEAT (SELF / ADMIN)
     Enforces: one active seat per user
  ========================================================= */

  async assignSeat(
    actorUserId: string,
    userId: string,
    seatId: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const seat = await tx.seat.findUnique({
        where: { id: seatId },
      });

      if (!seat) {
        throw new NotFoundException("Seat not found");
      }

      if (seat.isLocked) {
        throw new BadRequestException("Seat is locked");
      }

      const seatOccupied = await tx.seatAssignment.findFirst({
        where: { seatId, isActive: true },
      });

      if (seatOccupied) {
        throw new ConflictException("Seat already occupied");
      }

      const existingAssignment = await tx.seatAssignment.findFirst({
        where: { userId, isActive: true },
      });

      if (existingAssignment) {
        await tx.seatAssignment.update({
          where: { id: existingAssignment.id },
          data: {
            isActive: false,
            unassignedAt: new Date(),
          },
        });
      }

      const assignment = await tx.seatAssignment.create({
        data: {
          userId,
          seatId,
          isActive: true,
          assignedAt: new Date(),
        },
      });

      await this.seatAudit.log({
        seatId: seat.id,
        seatCode: seat.seatCode,
        userId,
        actorId: actorUserId,
        action: SeatAuditAction.ASSIGN,
      });

      return assignment;
    });
  }
    /* =========================================================
     ADMIN UNASSIGN
  ========================================================= */

  async unassignSeat(userId: string, seatId: string) {
  const assignment = await this.prisma.seatAssignment.findFirst({
    where: {
      userId,
      seatId,
      isActive: true,
    },
  });

  if (!assignment) {
    throw new BadRequestException("No active assignment found");
  }

  return this.prisma.seatAssignment.update({
    where: { id: assignment.id },
    data: {
      isActive: false,
      unassignedAt: new Date(),
    },
  });
}

  /* =========================================================
     ADMIN REASSIGN (DRAG & DROP)
  ========================================================= */

  async reassignSeatByAdmin(
    adminUserId: string,
    targetUserId: string,
    targetSeatId: string,
    force = false,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const activeAssignment = await tx.seatAssignment.findFirst({
        where: { userId: targetUserId, isActive: true },
      });

      if (!activeAssignment) {
        throw new BadRequestException("User has no active seat");
      }

      const targetSeat = await tx.seat.findUnique({
        where: { id: targetSeatId },
      });

      if (!targetSeat) {
        throw new NotFoundException("Seat not found");
      }

      if (targetSeat.isLocked && !force) {
        throw new ForbiddenException("Seat is locked");
      }

      const occupied = await tx.seatAssignment.findFirst({
        where: { seatId: targetSeatId, isActive: true },
      });

      if (occupied) {
        throw new ConflictException("Seat already occupied");
      }

      await tx.seatAssignment.update({
        where: { id: activeAssignment.id },
        data: {
          isActive: false,
          unassignedAt: new Date(),
        },
      });

      const newAssignment = await tx.seatAssignment.create({
        data: {
          userId: targetUserId,
          seatId: targetSeatId,
          isActive: true,
          assignedAt: new Date(),
        },
      });

      await this.seatAudit.log({
        seatId: targetSeat.id,
        seatCode: targetSeat.seatCode,
        userId: targetUserId,
        actorId: adminUserId,
        action: SeatAuditAction.MOVE,
        fromSeatId: activeAssignment.seatId,
        toSeatId: targetSeatId,
      });

      return newAssignment;
    });
  }

  /* =========================================================
     UNASSIGN BY USER (SELF)
  ========================================================= */

  async unassignSeatByUser(
    actorUserId: string,
    userId: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const active = await tx.seatAssignment.findFirst({
        where: { userId, isActive: true },
        include: { seat: true },
      });

      if (!active) {
        return { success: true };
      }

      await tx.seatAssignment.update({
        where: { id: active.id },
        data: {
          isActive: false,
          unassignedAt: new Date(),
        },
      });

      await this.seatAudit.log({
        seatId: active.seat.id,
        seatCode: active.seat.seatCode,
        userId,
        actorId: actorUserId,
        action: SeatAuditAction.UNASSIGN,
      });

      return { success: true };
    });
  }

  /* =========================================================
     UNASSIGN BY ADMIN (BY SEAT)
  ========================================================= */

  async unassignSeatBySeat(
    actorUserId: string,
    seatId: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const active = await tx.seatAssignment.findFirst({
        where: { seatId, isActive: true },
        include: { user: true, seat: true },
      });

      if (!active) {
        throw new BadRequestException("Seat is not occupied");
      }

      await tx.seatAssignment.update({
        where: { id: active.id },
        data: {
          isActive: false,
          unassignedAt: new Date(),
        },
      });

      await this.seatAudit.log({
        seatId: active.seat.id,
        seatCode: active.seat.seatCode,
        userId: active.user.id,
        actorId: actorUserId,
        action: SeatAuditAction.UNASSIGN,
      });

      return { success: true };
    });
  }

  /* =========================================================
     AUTO ASSIGN (STEP 4 — BULK)
  ========================================================= */

  async autoAssignSmart(
  actorUserId: string,
  dto: {
    seatIds: string[];
    userIds: string[];
    strict?: boolean;
  },
) {
  const { seatIds, userIds, strict = false } = dto;

  return this.prisma.$transaction(async (tx) => {
    // 1️⃣ Fetch eligible seats with row-level protection
    const seats = await tx.seat.findMany({
      where: {
        id: { in: seatIds },
        isLocked: false,
        assignments: {
          none: { isActive: true },
        },
      },
      select: {
        id: true,
        x: true,
        y: true,
        seatCode: true,
      },
    });

    if (!seats.length) {
      if (strict) {
        throw new BadRequestException("No available seats");
      }
      return { assigned: [], skippedUsers: userIds };
    }

    // 2️⃣ Fetch users (ensure no active seat)
    const usersWithActiveSeat = await tx.seatAssignment.findMany({
      where: {
        userId: { in: userIds },
        isActive: true,
      },
      select: { userId: true },
    });

    const blockedUsers = new Set(
      usersWithActiveSeat.map((u) => u.userId),
    );

    const eligibleUsers = userIds.filter(
      (id) => !blockedUsers.has(id),
    );

    if (strict && eligibleUsers.length !== userIds.length) {
      throw new ConflictException(
        "Some users already have active seats",
      );
    }

    if (strict && seats.length < eligibleUsers.length) {
      throw new ConflictException(
        "Not enough available seats",
      );
    }

    // 3️⃣ Spatial sort (cluster by centroid)
    const centroid = {
      x:
        seats.reduce((sum, s) => sum + (s.x ?? 0), 0) /
        seats.length,
      y:
        seats.reduce((sum, s) => sum + (s.y ?? 0), 0) /
        seats.length,
    };

    const sortedSeats = seats.sort((a, b) => {
      const distA =
        Math.pow((a.x ?? 0) - centroid.x, 2) +
        Math.pow((a.y ?? 0) - centroid.y, 2);

      const distB =
        Math.pow((b.x ?? 0) - centroid.x, 2) +
        Math.pow((b.y ?? 0) - centroid.y, 2);

      return distA - distB;
    });

    const assignCount = Math.min(
      eligibleUsers.length,
      sortedSeats.length,
    );

    const assignments = [];

    for (let i = 0; i < assignCount; i++) {
      const userId = eligibleUsers[i];
      const seat = sortedSeats[i];

      const created = await tx.seatAssignment.create({
        data: {
          userId,
          seatId: seat.id,
          isActive: true,
          assignedAt: new Date(),
        },
      });

      await this.seatAudit.log({
        seatId: seat.id,
        seatCode: seat.seatCode,
        userId,
        actorId: actorUserId,
        action: SeatAuditAction.ASSIGN,
      });

      assignments.push(created);
    }

    return {
      assigned: assignments,
      skippedUsers: userIds.filter(
        (u) =>
          !eligibleUsers.includes(u) ||
          eligibleUsers.indexOf(u) >= assignCount,
      ),
    };
  });
}
  /* =========================================================
     READ HELPERS
  ========================================================= */

  async getActiveSeatForUser(userId: string) {
    return this.prisma.seatAssignment.findFirst({
      where: { userId, isActive: true },
      include: { seat: true },
    });
  }

  async getActiveUserForSeat(seatId: string) {
    const assignment = await this.prisma.seatAssignment.findFirst({
      where: { seatId, isActive: true },
      include: { user: true },
    });

    return assignment ?? null;
  }
}
