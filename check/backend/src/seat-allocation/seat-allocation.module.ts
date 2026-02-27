import { Module } from '@nestjs/common';
import { SeatAllocationService } from './seat-allocation.service';
import { SeatAllocationController } from './seat-allocation.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { SeatAssignmentsModule } from '../seat-assignments/seat-assignments.module';
import { SeatAuditModule } from '../seat-audit/seat-audit.module';

@Module({
  imports: [
    PrismaModule,
    SeatAssignmentsModule, // 🔑 pulls SeatAssignmentsService correctly
    SeatAuditModule,
  ],
  providers: [SeatAllocationService],
  controllers: [SeatAllocationController],
  exports: [SeatAllocationService],
})
export class SeatAllocationModule {}

