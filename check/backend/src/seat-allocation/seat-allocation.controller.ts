import {
  Controller,
  Post,
  Req,
  Param,
  UseGuards,
} from '@nestjs/common';
import { SeatAllocationService } from './seat-allocation.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';

@Controller('seat-allocation')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SeatAllocationController {
  constructor(private readonly seatAllocationService: SeatAllocationService) {}

  /**
   * ADMIN / OWNER only
   * Trigger auto seat assignment on a floor
   */
  @Post('auto-assign/:floorId')
  @Roles('OWNER', 'ADMIN')
  autoAssign(@Param('floorId') floorId: string, @Req() req) {
    return this.seatAllocationService.autoAssignSequential(
      req.user.userId,          // ✅ ACTOR
      floorId,
      req.user.organizationId,
    );
  }
}
