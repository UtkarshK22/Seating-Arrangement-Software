import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { Parser } from "json2csv";

@Injectable()
export class AuditExportService {
  constructor(private prisma: PrismaService) {}

  async exportSeatAuditCSV(organizationId: string) {
    const logs = await this.prisma.seatAuditLog.findMany({
      where: {
        seat: {
          floor: {
            building: {
              organizationId,
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const parser = new Parser({
      fields: [
        "createdAt",
        "action",
        "seatCode",
        "userId",
        "actorId",
        "fromSeatId",
        "toSeatId",
      ],
    });

    return parser.parse(logs);
  }
}
