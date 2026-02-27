import { Controller, Get, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Org } from '../common/decorators/org.decorator';
import { Throttle } from '@nestjs/throttler';

@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AnalyticsController {
  constructor(
    private readonly analyticsService: AnalyticsService,
  ) {}

  /* ===================== OVERALL ===================== */

  @Get('seat-utilization')
  @Roles('OWNER', 'ADMIN', 'HR', 'MANAGER')
  @Throttle({ default: { limit: 5, ttl: 60 } })
  getSeatUtilization(@Org() organizationId: string) {
    return this.analyticsService.getSeatUtilization(
      organizationId,
    );
  }

  /* ===================== FLOOR-WISE ===================== */

  @Get('floor-utilization')
  @Roles('OWNER', 'ADMIN', 'HR', 'MANAGER')
  @Throttle({ default: { limit: 5, ttl: 60 } })
  getFloorUtilization(@Org() organizationId: string) {
    return this.analyticsService.getFloorUtilization(
      organizationId,
    );
  }
}