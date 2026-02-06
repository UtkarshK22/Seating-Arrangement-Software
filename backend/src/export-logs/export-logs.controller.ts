import {
  Controller,
  Get,
  Post,
  UseGuards,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { ExportLogsService } from './export-logs.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Org } from '../common/decorators/org.decorator';
import { Throttle } from '@nestjs/throttler';

@Controller('exports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ExportLogsController {
  constructor(
    private readonly exportLogsService: ExportLogsService,
  ) {}

  // =========================
  // EXPORT HISTORY
  // =========================
  @Get('history')
  @Roles('OWNER', 'ADMIN')
  @Throttle({ default: { limit: 5, ttl: 60 } })
  async getExportHistory(
    @Org() organizationId: string,
  ) {
    return this.exportLogsService.getExportHistory(
      organizationId,
    );
  }

  // =========================
  // SEAT AUDIT EXPORT
  // =========================
  @Post('seat-audit')
  @Roles('OWNER', 'ADMIN')
  @Throttle({ default: { limit: 5, ttl: 60 } })
  async exportSeatAudit(
    @Org() organizationId: string,
    @Req() req: any,
  ) {
    // ✅ FIXED: Added req.user?.userId (This is what your JWT Strategy returns)
    const userId =
      req.user?.userId ??
      req.user?.sub ??
      req.user?.id;

    if (!userId) {
      throw new ForbiddenException(
        'User not authenticated (ID missing from token)',
      );
    }

    return this.exportLogsService.exportSeatAudit(
      organizationId,
      userId,
    );
  }

  // =========================
  // DOWNLOAD LATEST EXPORT
  // =========================
  @Get('seat-audit/download')
  @Roles('OWNER', 'ADMIN')
  async downloadSeatAudit(
    @Org() organizationId: string,
    @Req() req: any,
  ) {
    // ✅ FIXED: Added req.user?.userId
    const userId =
      req.user?.userId ??
      req.user?.sub ??
      req.user?.id;

    if (!userId) {
      throw new ForbiddenException(
        'User not authenticated',
      );
    }

    return this.exportLogsService.getSeatAuditDownloadUrl(
      organizationId,
      userId,
    );
  }
}