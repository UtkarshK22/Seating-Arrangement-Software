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
    @Req() req,
    @Body('seatId') seatId: string,
  ) {
    return this.seatService.assignSeat(
      req.user.userId, // actor
      req.user.userId, // target user (self)
      seatId,
    );
  }

  /* =========================
     UNASSIGN SEAT (SELF)
     ========================= */
  @Post('unassign')
  unassignSeat(@Req() req) {
    return this.seatService.unassignSeatByUser(
      req.user.userId, // actor
      req.user.userId, // target user (self)
    );
  }

  /* =========================
     GET MY ACTIVE SEAT
     ========================= */
  @Get('me')
  getMySeat(@Req() req) {
    return this.seatService.getActiveSeatForUser(
      req.user.userId,
    );
  }

  /* =========================
     GET OCCUPANT OF A SEAT
     ========================= */
  @Get('seat/:seatId')
  getSeatOccupant(@Param('seatId') seatId: string) {
    return this.seatService.getActiveUserForSeat(seatId);
  }

  /* =========================
     ADMIN UNASSIGN BY SEAT
     ========================= */
  @Post('unassign/seat/:seatId')
  @UseGuards(RolesGuard)
  @Roles('OWNER', 'ADMIN')
  unassignSeatBySeat(
    @Req() req,
    @Param('seatId') seatId: string,
  ) {
    return this.seatService.unassignSeatBySeat(
      req.user.userId,
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
    @Req() req,
    @Body() dto: ReassignSeatDto,
  ) {
    return this.seatService.reassignSeatByAdmin(
      req.user.userId,      // actor (admin)
      dto.userId,           // target user
      dto.targetSeatId,     // new seat
      dto.force ?? false,
    );
  }
}
