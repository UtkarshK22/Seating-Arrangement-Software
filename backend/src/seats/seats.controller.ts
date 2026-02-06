import {
  Controller,
  Post,
  Body,
  Get,
  Req,
  UseGuards,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { SeatsService } from "./seats.service";
import { CreateSeatDto } from "./dto/create-seat.dto";

@UseGuards(AuthGuard("jwt"))
@Controller("seats")
export class SeatsController {
  constructor(private readonly seatsService: SeatsService) {}

  // ---------- CREATE SEAT (already working) ----------
  @Post()
  createSeat(@Body() body: CreateSeatDto) {
    return this.seatsService.create(body);
  }

  // ---------- STEP 2: SHOW MY SEAT ON LOAD ----------
  @Get("me")
  getMySeat(@Req() req: { user: { id: string } }) {
    return this.seatsService.getMyActiveSeat(req.user.id);
  }
}
