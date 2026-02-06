import { IsBoolean, IsNumber, IsOptional, IsString, IsUUID } from "class-validator";

export class CreateSeatDto {
  @IsString()
  seatCode: string;

  @IsNumber()
  x: number;

  @IsNumber()
  y: number;

  @IsUUID()
  floorId: string;

  @IsOptional()
  @IsBoolean()
  isLocked?: boolean;
}
