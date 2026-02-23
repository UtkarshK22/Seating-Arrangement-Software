import { IsBoolean, IsNumber, IsOptional, IsString, IsUUID, Max, Min } from "class-validator";

export class CreateSeatDto {
  @IsString()
  seatCode: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  x: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  y: number;

  @IsUUID()
  floorId: string;

  @IsOptional()
  @IsBoolean()
  isLocked?: boolean;
}
