import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SeatAssignmentsService } from '../seat-assignments/seat-assignments.service';

@Injectable()
export class SeatAllocationService {
  constructor(
    private prisma: PrismaService,
    private seatAssignmentsService: SeatAssignmentsService,
  ) {}

  /**
   * Auto-assign seats on a single floor (sequential, no grouping)
   * ADMIN / OWNER action
   */
  async autoAssignSequential(
    actorUserId: string,          // ✅ ADD ACTOR
    floorId: string,
    organizationId: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Validate floor belongs to org
      const floor = await tx.floor.findFirst({
        where: {
          id: floorId,
          building: {
            organizationId,
          },
        },
      });

      if (!floor) {
        throw new BadRequestException('Invalid floor or access denied');
      }

      // 2. Get free seats
      const seats = await tx.seat.findMany({
        where: {
          floorId,
          isLocked: false,
          assignments: {
            none: { isActive: true },
          },
        },
        orderBy: [
          { y: 'asc' },
          { x: 'asc' },
        ],
      });

      if (seats.length === 0) {
        return { assignedCount: 0, message: 'No available seats' };
      }

      // 3. Get users in SAME ORG without seats
      const users = await tx.user.findMany({
        where: {
          isActive: true,
          memberships: {
            some: {
              organizationId,
            },
          },
          seatAssignments: {
            none: { isActive: true },
          },
        },
        orderBy: { createdAt: 'asc' },
      });

      if (users.length === 0) {
        return { assignedCount: 0, message: 'No users require assignment' };
      }

      const assignments = Math.min(seats.length, users.length);

      // 4. Assign sequentially (safe)
      for (let i = 0; i < assignments; i++) {
        await this.seatAssignmentsService.assignSeat(
          actorUserId,      // ✅ ADMIN ACTOR
          users[i].id,      // affected user
          seats[i].id,      // target seat
        );
      }

      return {
        assignedCount: assignments,
        totalSeats: seats.length,
        totalUsers: users.length,
      };
    });
  }
}
