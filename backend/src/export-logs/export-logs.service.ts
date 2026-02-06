import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ExportType } from '@prisma/client';
import { EXPORT_COOLDOWN_MS } from './export-logs.constants';
import { ConfigService } from '@nestjs/config';
import { seatAuditToCSV } from './csv.util';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class ExportLogsService {
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

  /* ===================== EXPORT HISTORY ===================== */

  async getExportHistory(organizationId: string) {
    return {
      data: await this.prisma.exportLog.findMany({
        where: { organizationId },
        include: {
          exportedBy: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
        },
        orderBy: { exportedAt: 'desc' },
      }),
    };
  }

  async getLastExport(
    organizationId: string,
    exportType: ExportType,
  ) {
    return this.prisma.exportLog.findFirst({
      where: { organizationId, exportType },
      orderBy: { exportedAt: 'desc' },
    });
  }

  /* ===================== SEAT AUDIT EXPORT ===================== */

  async exportSeatAudit(
    organizationId: string,
    userId: string,
  ) {
    if (!userId) {
      throw new ForbiddenException('Missing userId');
    }

    await this.assertCooldownOrThrow(
      organizationId,
      ExportType.SEAT_AUDIT,
    );

    const logs = await this.prisma.seatAuditLog.findMany({
      where: {
        seat: {
          floor: {
            building: { organizationId },
          },
        },
      },
      include: {
        user: { select: { email: true } },
        actor: { select: { email: true } },
        seat: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    const rows = logs.map(l => ({
      seatCode: l.seatCode,
      action: l.action,
      userEmail: l.user?.email ?? '',
      actorEmail: l.actor?.email ?? '',
      createdAt: l.createdAt.toISOString(),
    }));

    const csv = seatAuditToCSV(rows);

    // ✅ SINGLE source of truth
    const exportedAt = new Date();
    const s3Key = `seat-audit/${organizationId}/${exportedAt.getTime()}.csv`;

    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.config.get<string>('AUDIT_EXPORT_S3_BUCKET'),
        Key: s3Key,
        Body: csv,
        ContentType: 'text/csv',
      }),
    );

    await this.prisma.exportLog.create({
      data: {
        exportType: ExportType.SEAT_AUDIT,exportedAt,
        s3Key,
        
        organization: {
          connect: { id: organizationId },
        },
        
        exportedBy: {
          connect: { id: userId },
        },
      },
    });

    return {
      success: true,
      exportedAt: exportedAt.toISOString(),
      s3Key,
    };
  }

  /* ===================== DOWNLOAD ===================== */

  async getSeatAuditDownloadUrl(
    organizationId: string,
    userId: string,
  ) {
    if (!userId) {
      throw new ForbiddenException('Missing userId');
    }

    await this.assertCooldownOrThrow(
      organizationId,
      ExportType.SEAT_AUDIT,
    );

    const last = await this.getLastExport(
      organizationId,
      ExportType.SEAT_AUDIT,
    );

    if (!last) {
      throw new ForbiddenException('No export available');
    }

    const command = new GetObjectCommand({
      Bucket: this.config.get<string>('AUDIT_EXPORT_S3_BUCKET'),
      Key: last.s3Key, // ✅ DB is source of truth
    });

    const url = await getSignedUrl(this.s3, command, {
      expiresIn: 60 * 5,
    });

    return { url };
  }

  /* ===================== COOLDOWN ===================== */

  async assertCooldownOrThrow(
    organizationId: string,
    exportType: ExportType,
  ) {
    const last = await this.getLastExport(
      organizationId,
      exportType,
    );

    if (!last) return;

    const elapsed =
      Date.now() - last.exportedAt.getTime();

    if (elapsed < EXPORT_COOLDOWN_MS) {
      throw new ForbiddenException(
        `Export cooldown active. Try again in ${Math.ceil(
          (EXPORT_COOLDOWN_MS - elapsed) / 1000,
        )} seconds.`,
      );
    }
  }
}
