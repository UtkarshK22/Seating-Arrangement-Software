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
    const project =
      await this.projectResolution.resolveActiveProject(
        userId,
        organizationId,
      );

    const seats = await tx.seat.findMany({
      where: { floorId },
      include: {
        assignments: {
          where: { isActive: true },
        },
      },
    });

    const availableSeats = seats.filter(
      s => s.assignments.length === 0 && !s.isLocked,
    );

    if (!availableSeats.length) return null;

    if (!project) {
      return availableSeats[0];
    }

    const projectSeats = seats.filter(s =>
      s.assignments.some(a =>
        a.userId === userId
      ),
    );

    const centroid = calculateCentroid(projectSeats);

    let bestSeat;

    if (centroid) {
      bestSeat = availableSeats
        .map(seat => ({
          seat,
          dist: distance(seat, centroid),
        }))
        .sort((a, b) => a.dist - b.dist)[0]?.seat;
    } else {
      bestSeat = availableSeats[0];
    }

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