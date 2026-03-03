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
import { ClusterService } from '../cluster/cluster.service';

@Injectable()
export class SeatAssignmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly seatAudit: SeatAuditService,
    private readonly clusterService: ClusterService,
  ) {}

  /* =========================================================
     ASSIGN SEAT (ORG SAFE)
  ========================================================= */

  async assignSeat(
    actorUserId: string,
    organizationId: string,
    userId: string,
    seatId: string,
  ) {
    return this.prisma.$transaction(async (tx) => {

      // 🔐 Validate seat belongs to org
      const seat = await tx.seat.findFirst({
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

      if (seat.isLocked) {
        throw new BadRequestException("Seat is locked");
      }

      // 🔐 Validate user belongs to organization
      const membership = await tx.organizationMember.findFirst({
        where: {
          userId,
          organizationId,
          isActive: true,
        },
      });
      
      if (!membership) {
        throw new ForbiddenException("User does not belong to this organization");
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
     UNASSIGN (ORG SAFE)
  ========================================================= */

  async unassignSeat(
    organizationId: string,
    userId: string,
    seatId: string,
  ) {
    const assignment = await this.prisma.seatAssignment.findFirst({
      where: {
        userId,
        seatId,
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

    if (!assignment) {
      throw new ForbiddenException("No active assignment found");
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
     ADMIN REASSIGN (ORG SAFE)
  ========================================================= */

  async reassignSeatByAdmin(
    adminUserId: string,
    organizationId: string,
    targetUserId: string,
    targetSeatId: string,
    force = false,
  ) {
    return this.prisma.$transaction(async (tx) => {

      const activeAssignment = await tx.seatAssignment.findFirst({
        where: {
          userId: targetUserId,
          isActive: true,
          seat: {
            floor: {
              building: { organizationId },
            },
          },
        },
      });

      if (!activeAssignment) {
        throw new BadRequestException("User has no active seat");
      }

      const targetSeat = await tx.seat.findFirst({
        where: {
          id: targetSeatId,
          floor: {
            building: { organizationId },
          },
        },
      });

      if (!targetSeat) {
        throw new ForbiddenException("Seat not found or access denied");
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
   AUTO ASSIGN (ORG SAFE + CLUSTER INTELLIGENCE)
========================================================= */

async autoAssignSmart(
    actorUserId: string,
    organizationId: string,
    dto: {
      seatIds: string[];   // KEEPING this
     userIds: string[];
     strict?: boolean;
   },
 ) {
   const { seatIds, userIds, strict = false } = dto;
   return this.prisma.$transaction(async (tx) => {
     // 🔐 Fetch available seats from provided seatIds
     const seats = await tx.seat.findMany({
       where: {
         id: { in: seatIds },
         isLocked: false,
         floor: {
           building: { organizationId },
         },
         assignments: {
           none: { isActive: true },
         },
       },
       select: {
         id: true,
         posX: true,
         posY: true,
         seatCode: true,
         floorId: true,
       },
     });
     if (!seats.length) {
       if (strict) {
         throw new BadRequestException("No available seats");
       }
       return { assigned: [], skippedUsers: userIds };
     }
     // 🔐 Validate eligible users
     const eligibleUsers = await tx.user.findMany({
       where: {
         id: { in: userIds },
         memberships: {
           some: {
             organizationId,
             isActive: true,
           },
         },
         seatAssignments: {
           none: { isActive: true },
         },
       },
       select: { id: true },
     });
     const validUserIds = eligibleUsers.map(u => u.id);
     if (strict && validUserIds.length !== userIds.length) {
       throw new ConflictException(
         "Some users already have active seats or invalid",
       );
     }
     const assignments = [];
     const skippedUsers: string[] = [];
     // 🔥 Use cluster engine to determine best seat per user
     for (const userId of validUserIds) {
       try {
         const bestSeat =
           await this.clusterService.autoAssignSeat(
             userId,
             seats[0].floorId,   // derive floor from provided
             organizationId,
           );
         if (!bestSeat) {
           skippedUsers.push(userId);
           continue;
         }
         const created = await tx.seatAssignment.create({
           data: {
             userId,
             seatId: bestSeat.id,
             isActive: true,
             assignedAt: new Date(),
           },
         });
         await this.seatAudit.log({
           seatId: bestSeat.id,
           seatCode: bestSeat.seatCode,
           userId,
           actorId: actorUserId,
           action: SeatAuditAction.ASSIGN,
         });
         assignments.push(created);
       } catch (e) {
         skippedUsers.push(userId);
       }
     }
     return {
       assigned: assignments,
       skippedUsers,
     };
   });
  }

  /* =========================================================
     READ HELPERS (ORG SAFE)
  ========================================================= */

  async getActiveSeatForUser(
    organizationId: string,
    userId: string,
  ) {
    return this.prisma.seatAssignment.findFirst({
      where: {
        userId,
        isActive: true,
        seat: {
          floor: {
            building: { organizationId },
          },
        },
      },
      include: { seat: true },
    });
  }

  async getActiveUserForSeat(
    organizationId: string,
    seatId: string,
  ) {
    const assignment = await this.prisma.seatAssignment.findFirst({
      where: {
        seatId,
        isActive: true,
        seat: {
          floor: {
            building: { organizationId },
          },
        },
      },
      include: { user: true },
    });

    return assignment ?? null;
  }
}