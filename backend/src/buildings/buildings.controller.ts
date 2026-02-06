import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { BuildingsService } from './buildings.service';
import { Org } from '../common/decorators/org.decorator';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('buildings')
@UseGuards(AuthGuard('jwt'))
export class BuildingsController {
  constructor(private readonly buildingsService: BuildingsService) {}

  // ======================
  // CREATE BUILDING
  // ======================
  @Post()
  @Roles('OWNER', 'ADMIN')
  createBuilding(
    @Org() organizationId: string,
    @Body('name') name: string,
  ) {
    return this.buildingsService.createBuilding(
      organizationId,
      name,
    );
  }

  // ======================
  // GET ALL BUILDINGS
  // ======================
  @Get()
  findAll(@Org() organizationId: string) {
    return this.buildingsService.findAll(organizationId);
  }

  // ======================
  // GET FLOORS FOR BUILDING
  // ======================
  @Get(':buildingId/floors')
  getFloors(
    @Param('buildingId') buildingId: string,
    @Org() organizationId: string,
  ) {
    return this.buildingsService.getFloors(
      buildingId,
      organizationId,
    );
  }
}
