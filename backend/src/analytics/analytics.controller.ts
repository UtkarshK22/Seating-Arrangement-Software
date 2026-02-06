import { Controller, Get, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Org } from '../common/decorators/org.decorator';
import { Throttle } from "@nestjs/throttler";

@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  /* ===================== OVERALL ===================== */

  @Get('seat-utilization')
  @Roles('OWNER', 'ADMIN', 'HR')
  @Throttle({default: {limit: 5,ttl: 60,},})
  getSeatUtilization(@Org() organizationId: string) {
    console.log('🔥 analytics/seat-utilization hit', organizationId);
    return this.analyticsService.getSeatUtilization(organizationId);
  }

  /* ===================== FLOOR-WISE (NEW) ===================== */

  @Get('floor-utilization')
  @Roles('OWNER', 'ADMIN', 'HR')
  getFloorUtilization(@Org() organizationId: string) {
    console.log('🔥 analytics/floor-utilization hit', organizationId);
    return this.analyticsService.getFloorUtilization(organizationId);
  }
}
