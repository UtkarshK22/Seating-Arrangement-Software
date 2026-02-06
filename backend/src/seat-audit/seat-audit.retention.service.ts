import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

@Injectable()
export class SeatAuditRetentionService {
  private readonly logger = new Logger(SeatAuditRetentionService.name);
  private readonly s3: S3Client;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    this.s3 = new S3Client({
      region: this.config.get<string>('AWS_REGION'),
      credentials: {
        accessKeyId: this.config.get<string>('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.config.get<string>('AWS_SECRET_ACCESS_KEY'),
      },
    });
  }

  /**
   * 🔁 CRON: runs daily at 03:00 AM
   */
  @Cron('0 3 * * *')
  async exportAndCleanupOldAuditLogs() {
    return this.exportAndCleanup();
  }

  /**
   * 🔘 Manual trigger (used by controller)
   */
  async cleanupOldAuditLogs() {
    return this.exportAndCleanup();
  }

  /**
   * 🔧 Core logic (shared by cron + manual trigger)
   */
  private async exportAndCleanup() {
    const retentionDays = Number(
      this.config.get('AUDIT_RETENTION_DAYS') ?? 90,
    );

    const dryRun =
      this.config.get('AUDIT_RETENTION_DRY_RUN') === 'true';

    const bucket = this.config.get<string>('AUDIT_EXPORT_S3_BUCKET');
    const prefix =
      this.config.get<string>('AUDIT_EXPORT_S3_PREFIX') ?? 'audit-exports';

    if (!bucket && !dryRun) {
      this.logger.error('AUDIT_EXPORT_S3_BUCKET not configured');
      return { dryRun, exported: 0, deleted: 0 };
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const logs = await this.prisma.seatAuditLog.findMany({
      where: {
        createdAt: { lt: cutoffDate },
      },
      include: {
        actor: { select: { fullName: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    if (!logs.length) {
      this.logger.log('No audit logs eligible for export/deletion');
      return {
        dryRun,
        cutoffDate,
        wouldExport: 0,
        wouldDelete: 0,
      };
    }

    // ---------------- DRY RUN ----------------
    if (dryRun) {
      this.logger.warn(
        `[DRY-RUN] ${logs.length} audit logs would be exported and deleted`,
      );

      return {
        dryRun: true,
        cutoffDate,
        wouldExport: logs.length,
        wouldDelete: logs.length,
      };
    }

    // ---------------- CSV ----------------
    const header = [
      'Action',
      'Seat Code',
      'Actor',
      'From Seat',
      'To Seat',
      'Timestamp',
    ];

    const rows = logs.map((log) => [
      log.action,
      log.seatCode,
      log.actor?.fullName ?? '',
      log.fromSeatId ?? '',
      log.toSeatId ?? '',
      log.createdAt.toISOString(),
    ]);

    const csv = [header, ...rows]
      .map((row) =>
        row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','),
      )
      .join('\n');

    // ---------------- S3 UPLOAD ----------------
    const datePart = cutoffDate.toISOString().split('T')[0];
    const objectKey = `${prefix}/${datePart}/seat-audit-backup-${datePart}.csv`;

    await this.s3.send(
      new PutObjectCommand({
        Bucket: bucket!,
        Key: objectKey,
        Body: csv,
        ContentType: 'text/csv',
      }),
    );

    this.logger.log(
      `Audit logs exported to s3://${bucket}/${objectKey} (${logs.length} rows)`,
    );

    // ---------------- DELETE AFTER EXPORT ----------------
    const deleted = await this.prisma.seatAuditLog.deleteMany({
      where: { createdAt: { lt: cutoffDate } },
    });

    this.logger.log(
      `Audit cleanup complete: deleted ${deleted.count} records`,
    );

    return {
      dryRun: false,
      exported: logs.length,
      deleted: deleted.count,
    };
  }
}
