import { IsOptional, IsString, MaxLength } from "class-validator";

export class AdminUserSearchDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;
}