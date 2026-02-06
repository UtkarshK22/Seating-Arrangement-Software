import { Module } from "@nestjs/common";
import { FloorsService } from "./floors.service";
import { FloorsController } from "./floors.controller";
import { PrismaService } from "../prisma/prisma.service";

@Module({
  controllers: [FloorsController],
  providers: [FloorsService, PrismaService],
})
export class FloorsModule {}
