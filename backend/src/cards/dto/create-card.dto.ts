import {
  IsHexColor,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  IsUrl,
  MaxLength,
} from "class-validator";

export class CreateCardDto {
  @IsUUID()
  cardLevelId!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  cardName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsHexColor()
  designColor?: string;

  @IsOptional()
  @IsUrl({ protocols: ["https"], require_protocol: true })
  @MaxLength(2048)
  imageUrl?: string;
}
