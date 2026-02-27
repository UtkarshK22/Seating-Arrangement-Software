import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';

import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { BuildingsModule } from './buildings/buildings.module';
import { FloorsModule } from './floors/floors.module';
import { SeatsModule } from './seats/seats.module';
import { SeatAssignmentsModule } from './seat-assignments/seat-assignments.module';
import { SeatAllocationModule } from './seat-allocation/seat-allocation.module';
import { SeatAuditModule } from './seat-audit/seat-audit.module';
import { ExportLogsModule } from './export-logs/export-logs.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { LoggerModule } from 'nestjs-pino';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';

import { AppController } from './app.controller';

@Module({
  controllers: [AppController],
  
  imports: [
    LoggerModule.forRoot({
      pinoHttp: {
        transport:
        process.env.NODE_ENV !== 'production'
        ? {
              target: 'pino-pretty',

          }
        : undefined,
      },
    }),
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),

    ThrottlerModule.forRoot([
      {
        name: 'auth',
        ttl: 60,
        limit: 5,
      },
      {
        name: 'default',
        ttl: 60,
        limit: 100,
      },
    ]),

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
  providers: [
    // 🔐 1️⃣ Global rate limit
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },

    // 🔐 2️⃣ Global JWT enforcement
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },

    // 🔐 3️⃣ Global role enforcement
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}