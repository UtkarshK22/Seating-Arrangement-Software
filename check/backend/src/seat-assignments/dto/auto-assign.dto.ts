import { IsArray, IsOptional, IsBoolean, IsString } from "class-validator";

export class AutoAssignDto {
  @IsArray()
  @IsString({ each: true })
  seatIds: string[];

  @IsArray()
  @IsString({ each: true })
  userIds: string[];

  @IsOptional()
  @IsBoolean()
  strict?: boolean; // if true -> atomic
}