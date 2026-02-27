import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ExportLogsService } from './export-logs.service';
import { ExportLogsController } from './export-logs.controller';
import { AuditExportService } from './audit-export.service';
import { AuditExportController } from './audit-export.controller';
import { ConfigModule, ConfigService } from "@nestjs/config";
import { S3Client } from "@aws-sdk/client-s3";

@Module({
  imports: [ConfigModule],
  controllers: [
    ExportLogsController,
    AuditExportController,
  ],
  providers: [
    ExportLogsService,
    AuditExportService,
    PrismaService,
  
  {
      provide: S3Client,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        return new S3Client({
          region: config.get<string>("AWS_REGION"),
          credentials: {
            accessKeyId: config.get<string>("AWS_ACCESS_KEY_ID"),
            secretAccessKey: config.get<string>("AWS_SECRET_ACCESS_KEY"),
          },
        });
      },
    },
  ],
  exports: [
    ExportLogsService,
    AuditExportService,
    S3Client,
  ],
})
export class ExportLogsModule {}
