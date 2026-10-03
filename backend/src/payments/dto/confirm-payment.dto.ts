import { IsIn } from "class-validator";

export class ConfirmPaymentDto {
  @IsIn(["YES", "NO"])
  confirmation!: "YES" | "NO";
}