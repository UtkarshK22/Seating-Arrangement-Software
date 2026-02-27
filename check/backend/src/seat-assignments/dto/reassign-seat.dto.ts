import { IsUUID, IsOptional, IsBoolean } from 'class-validator';

export class ReassignSeatDto {
  @IsUUID()
  userId: string;

  @IsUUID()
  targetSeatId: string;

  @IsOptional()
  @IsBoolean()
  force?: boolean;
}
