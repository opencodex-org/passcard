import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";

export class AdminUserActionDto {
  @IsIn(["SUSPEND", "UNSUSPEND", "DISABLE"])
  action!: "SUSPEND" | "UNSUSPEND" | "DISABLE";

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  reason?: string;
}
