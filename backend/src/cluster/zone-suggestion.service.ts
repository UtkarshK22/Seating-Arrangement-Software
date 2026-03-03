import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ZoneSuggestionService {
  constructor(private readonly prisma: PrismaService) {}

  async suggestZone(
    projectId: string,
    organizationId: string,
  ) {
    // 1️⃣ Fetch active project seat assignments
    const assignments = await this.prisma.seatAssignment.findMany({
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
      },
    });

    if (!assignments.length) {
      throw new NotFoundException('No active seats for this project');
    }

    const seats = assignments.map(a => a.seat);

    // 2️⃣ Compute bounding box
    const minX = Math.min(...seats.map(s => s.posX));
    const maxX = Math.max(...seats.map(s => s.posX));
    const minY = Math.min(...seats.map(s => s.posY));
    const maxY = Math.max(...seats.map(s => s.posY));

    const width = maxX - minX;
    const height = maxY - minY;
    const area = width * height;

    const seatCount = seats.length;

    // 3️⃣ Density calculation
    const density = area > 0 ? seatCount / area : 0;

    // 4️⃣ Suggest padding (optional tightening)
    const padding = 20; // configurable later

    const suggestedZone = {
      minX: minX - padding,
      minY: minY - padding,
      maxX: maxX + padding,
      maxY: maxY + padding,
    };

    // 5️⃣ Smart recommendation logic
    let recommendation: 'SOFT' | 'HARD';

    if (density > 0.0005) {
      recommendation = 'HARD';
    } else {
      recommendation = 'SOFT';
    }

    return {
      seatCount,
      area,
      density,
      currentSpread: { minX, minY, maxX, maxY },
      suggestedZone,
      recommendedMode: recommendation,
    };
  }
}