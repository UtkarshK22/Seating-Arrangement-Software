import { Module } from '@nestjs/common';
import { SeatAuditService } from './seat-audit.service';
import { SeatAuditController } from './seat-audit.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { SeatAuditRetentionService } from './seat-audit.retention.service';
import { PrismaService } from '../prisma/prisma.service';
import { ExportLogsModule } from '../export-logs/export-logs.module';


@Module({
  imports: [PrismaModule, ExportLogsModule],
  providers: [SeatAuditService, PrismaService, SeatAuditRetentionService],
  controllers: [SeatAuditController],
  exports: [SeatAuditService],
})
export class SeatAuditModule {}
