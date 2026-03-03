import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProjectResolutionService } from '../projects/project-resolution.service';
import { calculateCentroid, distance } from './distance.util';
import { Prisma } from '@prisma/client';

@Injectable()
export class ClusterService {
  constructor(
    private prisma: PrismaService,
    private projectResolution: ProjectResolutionService,
  ) {}

  async autoAssignSeat(userId: string, floorId: string, organizationId: string) {
    const project = await this.projectResolution.resolveActiveProject(
      userId,
      organizationId,
    );

    const seats = await this.prisma.seat.findMany({
      where: { floorId },
      include: {
        assignments: {
          where: { isActive: true },
          include: {
            user: {
              include: {
                projectMemberships: true,

            },
          },
        },
      },
    },
  });

    const availableSeats = seats.filter(
      s => s.assignments.length === 0 && !s.isLocked,
    );

    if (!availableSeats.length) {
      throw new Error('No available seats');
    }

    if (!project) {
      return availableSeats[0]; // fallback
    }

    const projectSeats = seats.filter(s =>
      s.assignments.some(a =>
        a.user.projectMemberships?.some(pm => pm.projectId === project.id),
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

    if (project) {
      await this.prisma.projectMember.update({
        where: {
          projectId_userId: {
            projectId: project.id,
            userId,

        },
      },
        data: { lastActiveAt: new Date() },
      });
    }
    return bestSeat;
  }
}