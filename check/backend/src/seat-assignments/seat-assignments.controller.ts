import {
  Controller,
  Post,
  Body,
  Req,
  UseGuards,
  Get,
  Param,
} from '@nestjs/common';
import { SeatAssignmentsService } from './seat-assignments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ReassignSeatDto } from './dto/reassign-seat.dto';
import { Org } from '../common/decorators/org.decorator';

@Controller('seat-assignments')
@UseGuards(JwtAuthGuard)
export class SeatAssignmentsController {
  constructor(
    private readonly seatService: SeatAssignmentsService,
  ) {}

  /* =========================
     ASSIGN SEAT (SELF)
     ========================= */
  @Post('assign')
  assignSeat(
    @Req() req: any,
    @Org() organizationId: string,
    @Body('seatId') seatId: string,
  ) {
    return this.seatService.assignSeat(
      req.user.userId,        // actor
      organizationId,         // org
      req.user.userId,        // target user
      seatId,                 // seat
    );
  }

  /* =========================
     UNASSIGN SEAT (SELF)
     ========================= */
  @Post('unassign')
  unassignSeat(
    @Req() req: any,
    @Org() organizationId: string,
  ) {
    return this.seatService.unassignSeat(
      req.user.userId,        // actor
      organizationId,
      req.user.userId,        // target user
    );
  }

  /* =========================
     GET MY ACTIVE SEAT
     ========================= */
  @Get('me')
  getMySeat(
    @Req() req: any,
    @Org() organizationId: string,
  ) {
    return this.seatService.getActiveSeatForUser(
      req.user.userId,
      organizationId,
    );
  }

  /* =========================
     GET OCCUPANT OF A SEAT
     ========================= */
  @Get('seat/:seatId')
  getSeatOccupant(
    @Param('seatId') seatId: string,
    @Org() organizationId: string,
  ) {
    return this.seatService.getActiveUserForSeat(
      seatId,
      organizationId,
    );
  }

  /* =========================
     ADMIN UNASSIGN BY SEAT
     ========================= */
  @Post('unassign/seat/:seatId')
  @UseGuards(RolesGuard)
  @Roles('OWNER', 'ADMIN', 'HR', 'MANAGER')
  unassignSeatBySeat(
    @Req() req: any,
    @Org() organizationId: string,
    @Param('seatId') seatId: string,
  ) {
    return this.seatService.unassignSeat(
      req.user.userId,   // actor
      organizationId,
      seatId,
    );
  }

  /* =========================
     ADMIN REASSIGN
     ========================= */
  @Post('reassign')
  @UseGuards(RolesGuard)
  @Roles('OWNER', 'ADMIN')
  reassignSeat(
    @Req() req: any,
    @Org() organizationId: string,
    @Body() dto: ReassignSeatDto,
  ) {
    return this.seatService.reassignSeatByAdmin(
      req.user.userId,      // admin actor
      organizationId,
      dto.userId,
      dto.targetSeatId,
      dto.force ?? false,
    );
  }
}