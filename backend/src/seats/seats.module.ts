import { Module } from "@nestjs/common";
import { SeatsController } from "./seats.controller";
import { SeatsService } from "./seats.service";
import { PrismaService } from "../prisma/prisma.service";
import { PrismaModule } from '../prisma/prisma.module';
import { SeatAuditModule } from '../seat-audit/seat-audit.module';

@Module({
  imports: [
    PrismaModule,
    SeatAuditModule, // 🔑 REQUIRED
  ],
  providers: [SeatsService],
  controllers: [SeatsController],
})
export class SeatsModule {}
