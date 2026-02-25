import {
  Controller,
  Get,
  Param,
  UseGuards,
  Query,
  Res,
  Req,
  ParseIntPipe,
  DefaultValuePipe,
  BadRequestException,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import type { Response, Request } from 'express';

import { SeatAuditService } from './seat-audit.service';
import { SeatAuditRetentionService } from './seat-audit.retention.service';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Org } from '../common/decorators/org.decorator';
import { Throttle } from '@nestjs/throttler';

@Controller('seat-audit')
@UseGuards(JwtAuthGuard, RolesGuard)
@UsePipes(new ValidationPipe({ transform: true }))
export class SeatAuditController {
  constructor(
    private readonly seatAuditService: SeatAuditService,
    private readonly seatAuditRetentionService: SeatAuditRetentionService,
  ) {}

  /* =========================================================
     SEAT HISTORY
  ========================================================= */

  @Get('seat/:seatId')
  @Roles('OWNER', 'ADMIN')
  @Throttle({ default: { limit: 20, ttl: 60 } })
  getSeatHistory(
    @Org() organizationId: string,
    @Param('seatId') seatId: string,
  ) {
    if (!seatId) {
      throw new BadRequestException('Invalid seatId');
    }

    return this.seatAuditService.getBySeat(
      seatId,
      organizationId,
    );
  }

  /* =========================================================
     FLOOR HISTORY (PAGINATED)
  ========================================================= */

  @Get('floor/:floorId')
  @Roles('OWNER', 'ADMIN')
  @Throttle({ default: { limit: 10, ttl: 60 } })
  getFloorHistory(
    @Org() organizationId: string,
    @Param('floorId') floorId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe)
    page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe)
    limit: number,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    if (!floorId) {
      throw new BadRequestException('Invalid floorId');
    }

    // 🔐 Prevent abuse
    if (limit > 100) {
      throw new BadRequestException(
        'Limit cannot exceed 100',
      );
    }

    return this.seatAuditService.getAuditForFloor(
      floorId,
      organizationId,
      page,
      limit,
      from,
      to,
    );
  }

  /* =========================================================
     EXPORT FLOOR AUDIT CSV
  ========================================================= */

  @Get('floor/:floorId/export')
  @Roles('OWNER', 'ADMIN')
  @Throttle({ default: { limit: 3, ttl: 60 } })
  async exportFloorAuditCsv(
    @Org() organizationId: string,
    @Param('floorId') floorId: string,
    @Req() req: Request & { user: any },
    @Res({ passthrough: true }) res: Response,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    if (!floorId) {
      throw new BadRequestException('Invalid floorId');
    }

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

  /* =========================================================
     MANUAL RETENTION CLEANUP (DANGEROUS ENDPOINT)
  ========================================================= */

  @Get('export-now')
  @Roles('OWNER') // 🔐 Only OWNER allowed
  @Throttle({ default: { limit: 1, ttl: 300 } })
  async exportNow(
    @Org() organizationId: string,
  ) {
    // 🔐 Scoped cleanup
    return this.seatAuditRetentionService.cleanupOldAuditLogs(
      organizationId,
    );
  }
}