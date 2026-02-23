import {
  Controller,
  Post,
  Body,
  Get,
  Req,
  UseGuards,
  Param,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { SeatsService } from "./seats.service";
import { CreateSeatDto } from "./dto/create-seat.dto";
import { Org } from "../common/decorators/org.decorator";
import { Roles } from "../auth/decorators/roles.decorator";

@UseGuards(AuthGuard("jwt"))
@Controller("seats")
export class SeatsController {
  constructor(private readonly seatsService: SeatsService) {}

  // ---------- CREATE SEAT (already working) ----------
  // @Post()
  // createSeat(@Body() body: CreateSeatDto) {
  //   return this.seatsService.create(body);
  // }
  @Post(':floorId')
  @Roles('OWNER', 'ADMIN')
  async createSeat(
    @Param('floorId') floorId: string,
    @Body() dto: CreateSeatDto,
    @Org() organizationId: string,
) {
  return this.seatsService.createSeat(
    floorId,
    organizationId,
    dto,
  );
}

  // ---------- STEP 2: SHOW MY SEAT ON LOAD ----------
  @Get("me")
  getMySeat(@Req() req: { user: { id: string } }) {
    return this.seatsService.getMyActiveSeat(req.user.id);
  }
}
