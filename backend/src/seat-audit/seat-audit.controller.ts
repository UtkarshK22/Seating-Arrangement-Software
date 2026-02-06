import {
  Controller,
  Get,
  Param,
  UseGuards,
  Query,
  Res,
  Req,
} from '@nestjs/common';
import type { Response, Request } from 'express';

import { SeatAuditService } from './seat-audit.service';
import { SeatAuditRetentionService } from './seat-audit.retention.service';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Org } from '../common/decorators/org.decorator';

@Controller('seat-audit')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SeatAuditController {
  constructor(
    private readonly seatAuditService: SeatAuditService,
    private readonly seatAuditRetentionService: SeatAuditRetentionService,
  ) {}

  @Get('seat/:seatId')
  @Roles('OWNER', 'ADMIN')
  getSeatHistory(
    @Org() organizationId: string,
    @Param('seatId') seatId: string,
  ) {
    return this.seatAuditService.getBySeat(seatId, organizationId);
  }

  @Get('floor/:floorId')
  @Roles('OWNER', 'ADMIN')
  getFloorHistory(
    @Org() organizationId: string,
    @Param('floorId') floorId: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.seatAuditService.getAuditForFloor(
      floorId,
      organizationId,
      Number(page),
      Number(limit),
      from,
      to,
    );
  }

  @Get('floor/:floorId/export')
  @Roles('OWNER', 'ADMIN')
  async exportFloorAuditCsv(
    @Org() organizationId: string,
    @Param('floorId') floorId: string,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const csv = await this.seatAuditService.exportAuditCsv(
      floorId,
      organizationId,
      req.user.id,
      from,
      to,
    );

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="floor-audit-${floorId}.csv"`,
    );

    return csv;
  }

  /**
   * Manual export + cleanup
   */
  @Get('export-now')
  @Roles('OWNER', 'ADMIN')
  async exportNow() {
    return this.seatAuditRetentionService.cleanupOldAuditLogs();
  }
}
