import { Controller, Get, Res, UseGuards } from "@nestjs/common";
import { Response } from "express";
import { AuditExportService } from "./audit-export.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { Org } from "../common/decorators/org.decorator";

@Controller("exports")
@UseGuards(JwtAuthGuard, RolesGuard)
export class AuditExportController {
  constructor(private readonly exporter: AuditExportService) {}

  @Get("seat-audit")
  @Roles("OWNER", "ADMIN")
  async exportSeatAudit(
    @Org() organizationId: string,
    @Res() res: Response,
  ) {
    const csv = await this.exporter.exportSeatAuditCSV(organizationId);

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=seat-audit.csv",
    );

    res.send(csv);
  }
}
