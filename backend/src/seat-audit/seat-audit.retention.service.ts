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

  /* =========================================================
     CRON — PROCESS ALL ORGANIZATIONS SAFELY
  ========================================================= */

  @Cron('0 3 * * *')
  async exportAndCleanupOldAuditLogs() {
    const organizations = await this.prisma.organization.findMany({
      select: { id: true },
    });

    const results = [];

    for (const org of organizations) {
      const result = await this.exportAndCleanup(org.id);
      results.push({ organizationId: org.id, ...result });
    }

    return results;
  }

  /* =========================================================
     MANUAL — PROCESS SINGLE ORGANIZATION
  ========================================================= */

  async cleanupOldAuditLogs(organizationId: string) {
    return this.exportAndCleanup(organizationId);
  }

  /* =========================================================
     CORE LOGIC — PER ORGANIZATION
  ========================================================= */

  private async exportAndCleanup(organizationId: string) {
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

    // 🔐 Only logs belonging to this organization
    const logs = await this.prisma.seatAuditLog.findMany({
      where: {
        createdAt: { lt: cutoffDate },
        seat: {
          floor: {
            building: {
              organizationId,
            },
          },
        },
      },
      include: {
        actor: { select: { fullName: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    if (!logs.length) {
      return {
        dryRun,
        cutoffDate,
        exported: 0,
        deleted: 0,
      };
    }

    if (dryRun) {
      this.logger.warn(
        `[DRY-RUN] Org ${organizationId} — ${logs.length} logs would be exported & deleted`,
      );

      return {
        dryRun: true,
        cutoffDate,
        exported: logs.length,
        deleted: logs.length,
      };
    }

    /* ================= CSV BUILD ================= */

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
        row.map((c) =>
          `"${String(c).replace(/"/g, '""')}"`,
        ).join(','),
      )
      .join('\n');

    /* ================= S3 UPLOAD ================= */

    const datePart = cutoffDate.toISOString().split('T')[0];

    const objectKey = `${prefix}/${organizationId}/${datePart}/seat-audit-backup-${datePart}.csv`;

    await this.s3.send(
      new PutObjectCommand({
        Bucket: bucket!,
        Key: objectKey,
        Body: csv,
        ContentType: 'text/csv',
      }),
    );

    this.logger.log(
      `Org ${organizationId} — exported ${logs.length} logs to s3://${bucket}/${objectKey}`,
    );

    /* ================= DELETE ================= */

    const deleted = await this.prisma.seatAuditLog.deleteMany({
      where: {
        createdAt: { lt: cutoffDate },
        seat: {
          floor: {
            building: {
              organizationId,
            },
          },
        },
      },
    });

    this.logger.log(
      `Org ${organizationId} — deleted ${deleted.count} logs`,
    );

    return {
      dryRun: false,
      exported: logs.length,
      deleted: deleted.count,
    };
  }
}