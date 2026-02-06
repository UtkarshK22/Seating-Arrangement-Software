import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class AuditRetentionService {
  private readonly logger = new Logger(AuditRetentionService.name);

  constructor(private prisma: PrismaService) {}

  @Cron("0 3 * * *") // every day at 03:00
  async cleanupOldLogs() {
    const retentionDays = 90;

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - retentionDays);

    const result = await this.prisma.seatAuditLog.deleteMany({
      where: {
        createdAt: { lt: cutoff },
      },
    });

    this.logger.log(
      `Audit retention cleanup: deleted ${result.count} logs`,
    );
  }
}
