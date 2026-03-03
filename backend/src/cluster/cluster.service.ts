import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ProjectResolutionService } from '../projects/project-resolution.service';
import { calculateCentroid, distance } from './distance.util';

@Injectable()
export class ClusterService {
  constructor(
    private readonly projectResolution: ProjectResolutionService,
  ) {}

  async autoAssignSeat(
    tx: Prisma.TransactionClient,
    userId: string,
    floorId: string,
    organizationId: string,
  ) {
    // 1️⃣ Resolve active project
    const project =
      await this.projectResolution.resolveActiveProject(
        userId,
        organizationId,
      );

    // 2️⃣ Fetch all seats on floor
    const seats = await tx.seat.findMany({
      where: { floorId },
      include: {
        assignments: {
          where: { isActive: true },
        },
      },
    });

    // 3️⃣ Determine available seats
    let availableSeats = seats.filter(
      s => s.assignments.length === 0 && !s.isLocked,
    );

    if (!availableSeats.length) return null;

    // 4️⃣ No project → fallback
    if (!project) {
      return availableSeats[0];
    }

    // 5️⃣ Fetch project zone (if exists)
    const zone = await tx.projectZone.findUnique({
      where: { projectId: project.id },
    });

    // 6️⃣ Enforce hard boundary if enabled
    if (zone && zone.isHardBoundary) {
      availableSeats = availableSeats.filter(seat =>
        seat.posX >= zone.minX &&
        seat.posX <= zone.maxX &&
        seat.posY >= zone.minY &&
        seat.posY <= zone.maxY,
      );

      if (!availableSeats.length) return null;
    }

    // 7️⃣ Get all active project seat assignments
    const projectAssignments = await tx.seatAssignment.findMany({
      where: {
        isActive: true,
        user: {
          projectMemberships: {
            some: { projectId: project.id },
          },
        },
        seat: { floorId },
      },
      include: {
        seat: true,
      },
    });

    // 8️⃣ Compute centroid from ALL project seats
    const centroid = calculateCentroid(
      projectAssignments.map(a => a.seat),
    );

    let bestSeat;

    if (centroid) {
      bestSeat = availableSeats
        .map(seat => ({
          seat,
          dist: distance(seat, centroid),
        }))
        .sort((a, b) => a.dist - b.dist)[0]?.seat;
    } else {
      // First project member case
      bestSeat = availableSeats[0];
    }

    // 9️⃣ Update project activity
    await tx.projectMember.update({
      where: {
        projectId_userId: {
          projectId: project.id,
          userId,
        },
      },
      data: { lastActiveAt: new Date() },
    });

    return bestSeat;
  }
}