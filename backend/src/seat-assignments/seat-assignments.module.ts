import { Module } from '@nestjs/common';
import { SeatAssignmentsService } from './seat-assignments.service';
import { SeatAssignmentsController } from './seat-assignments.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { SeatAuditModule } from '../seat-audit/seat-audit.module';

@Module({
  imports: [
    PrismaModule,
    SeatAuditModule, // 🔑 REQUIRED
  ],
  providers: [SeatAssignmentsService],
  controllers: [SeatAssignmentsController],
  exports: [SeatAssignmentsService], // 🔑 REQUIRED
})
export class SeatAssignmentsModule {}
