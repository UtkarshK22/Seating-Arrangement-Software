import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { calculateCentroid, distance } from './distance.util';
import { SeatAuditService } from '../seat-audit/seat-audit.service';
import { SeatAuditAction } from '@prisma/client';

@Injectable()
export class RebalanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly seatAudit: SeatAuditService,
  ) {}

  async rebalanceProject(
    projectId: string,
    organizationId: string,
    actorUserId: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      // 1️⃣ Get project members with active seats
      const activeAssignments = await tx.seatAssignment.findMany({
        where: {
          isActive: true,
          user: {
            projectMemberships: {
              some: { projectId },
            },
          },
          seat: {
            floor: {
              building: { organizationId },
            },
          },
        },
        include: {
          seat: true,
          user: true,
        },
      });

      if (!activeAssignments.length) {
        return { moved: 0 };
      }

      const floorId = activeAssignments[0].seat.floorId;

      // 2️⃣ Fetch all seats on floor
      const seats = await tx.seat.findMany({
        where: { floorId },
        include: {
          assignments: {
            where: { isActive: true },
          },
        },
      });

      const availableSeats = seats.filter(
        s => !s.isLocked
      );

      // 3️⃣ Compute centroid of current cluster
      const centroid = calculateCentroid(
        activeAssignments.map(a => a.seat),
      );

      if (!centroid) return { moved: 0 };

      // 4️⃣ Sort seats by proximity
      const sortedSeats = availableSeats
        .map(seat => ({
          seat,
          dist: distance(seat, centroid),
        }))
        .sort((a, b) => a.dist - b.dist)
        .map(x => x.seat);

      let movedCount = 0;

      // 5️⃣ Re-pack users tightly
      for (let i = 0; i < activeAssignments.length; i++) {
        const currentAssignment = activeAssignments[i];
        const targetSeat = sortedSeats[i];

        if (!targetSeat) break;

        if (currentAssignment.seatId === targetSeat.id) continue;

        // Skip if target seat occupied
        const occupied = targetSeat.assignments.length > 0;
        if (occupied) continue;

        // Move user
        await tx.seatAssignment.update({
          where: { id: currentAssignment.id },
          data: {
            isActive: false,
            unassignedAt: new Date(),
          },
        });

        await tx.seatAssignment.create({
          data: {
            userId: currentAssignment.userId,
            seatId: targetSeat.id,
            isActive: true,
            assignedAt: new Date(),
          },
        });

        await this.seatAudit.log({
          seatId: targetSeat.id,
          seatCode: targetSeat.seatCode,
          userId: currentAssignment.userId,
          actorId: actorUserId,
          action: SeatAuditAction.MOVE,
          fromSeatId: currentAssignment.seatId,
          toSeatId: targetSeat.id,
        });

        movedCount++;
      }

      return { moved: movedCount };
    });
  }
}