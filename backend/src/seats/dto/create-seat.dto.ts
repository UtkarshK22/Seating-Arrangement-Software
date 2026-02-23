import { IsBoolean, IsNumber, IsOptional, IsString, IsUUID, Max, Min } from "class-validator";

export class CreateSeatDto {
  @IsString()
  seatCode: string;

  @IsNumber()
  @Min(0)
  @Max(1)
  x: number;

  @IsNumber()
  @Min(0)
  @Max(1)
  y: number;

  @IsOptional()
  @IsBoolean()
  isLocked?: boolean;
}
