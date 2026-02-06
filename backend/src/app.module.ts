import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { BuildingsModule } from './buildings/buildings.module';
import { FloorsModule } from './floors/floors.module';
import { SeatsModule } from './seats/seats.module';
import { SeatAssignmentsModule } from './seat-assignments/seat-assignments.module';
import { SeatAllocationModule } from './seat-allocation/seat-allocation.module';
import { ScheduleModule } from '@nestjs/schedule';
import { SeatAuditModule } from './seat-audit/seat-audit.module';
import { ExportLogsModule } from './export-logs/export-logs.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { ThrottlerModule } from "@nestjs/throttler";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerGuard } from "@nestjs/throttler";

@Module({
  imports: [
    ThrottlerModule.forRoot([{name: 'default',ttl: 60,limit: 100,},]),
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    UsersModule,
    BuildingsModule,
    FloorsModule,
    SeatsModule,
    SeatAssignmentsModule,
    SeatAllocationModule,
    SeatAuditModule,
    ExportLogsModule,
    AnalyticsModule,
  ],
  providers: [{provide: APP_GUARD,useClass: ThrottlerGuard,},], 
})
export class AppModule {}