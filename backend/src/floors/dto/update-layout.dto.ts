import { IsUUID, IsNumber, Min, Max } from 'class-validator';

export class UpdateSeatPositionDto {
  @IsUUID()
  id: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  x: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  y: number;
}