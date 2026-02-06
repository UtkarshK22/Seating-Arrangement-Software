import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { FloorsService } from './floors.service';
import { Org } from '../common/decorators/org.decorator';
import { Roles } from '../auth/decorators/roles.decorator';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

@Controller('floors')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FloorsController {
  constructor(
    private readonly floorsService: FloorsService,
  ) {}

  // =========================
  // CREATE FLOOR (OWNER / ADMIN)
  // =========================
  @Post()
  @Roles('OWNER', 'ADMIN')
  createFloor(
    @Org() organizationId: string,
    @Body('buildingId') buildingId: string,
    @Body('name') name: string,
    @Body('imageUrl') imageUrl: string,
    @Body('width') width: number,
    @Body('height') height: number,
  ) {
    return this.floorsService.createFloor(
      organizationId,
      buildingId,
      name,
      imageUrl,
      width,
      height,
    );
  }

  // =========================
  // GET SEATS OF A FLOOR
  // (Everyone in org can view)
  // =========================
  @Get(':floorId/seats')
  @Roles('OWNER', 'ADMIN', 'EMPLOYEE')
  getSeats(
    @Org() organizationId: string,
    @Param('floorId') floorId: string,
  ) {
    return this.floorsService.getSeats(
      organizationId,
      floorId,
    );
  }

  // =========================
  // GET UI-READY FLOOR MAP
  // (Everyone in org can view)
  // =========================
  @Get(':floorId/map')
  @Roles('OWNER', 'ADMIN', 'EMPLOYEE')
  getFloorMap(
    @Org() organizationId: string,
    @Param('floorId') floorId: string,
  ) {
    return this.floorsService.getFloorMap(
      organizationId,
      floorId,
    );
  }
}
