import {
  Body,
  Controller,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { Roles } from "../auth/decorators/roles.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { SeatAssignmentsService } from "./seat-assignments.service";
import { Throttle } from "@nestjs/throttler";
import { AutoAssignDto } from "./dto/auto-assign.dto";

@Controller("seat-assignments")
@UseGuards(JwtAuthGuard, RolesGuard)
export class SeatAssignmentsAutoController {
  constructor(
    private readonly seatAssignmentsService: SeatAssignmentsService,
  ) {}

  @Throttle({ default: { limit: 10, ttl: 60 } })
  @Post("auto-assign")
  @Roles("OWNER", "ADMIN", "HR")
  async autoAssign(
    @Req() req: any,
    @Body() dto: AutoAssignDto,
  ) {
    const actorUserId = req.user.sub;

    return this.seatAssignmentsService.autoAssignSmart(
      actorUserId,
      dto,
    );
  }
}