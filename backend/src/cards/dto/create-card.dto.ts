import {
IsIn,
IsOptional,
IsString,
Matches,
MaxLength,
} from "class-validator";

export class CreateCardDto {
@IsString()
@MaxLength(80)
cardName!: string;

@IsString()
@MaxLength(100)
cardLevelId!: string;

@IsOptional()
@IsString()
@MaxLength(500)
description?: string;

@IsOptional()
@Matches(/^#[0-9A-Fa-f]{6}$/)
designColor?: string;

@IsOptional()
@IsString()
@MaxLength(2048)
imageUrl?: string;

@IsOptional()
@IsString()
@Matches(/^[A-Z]{2}$/)
countryCode?: string;

@IsOptional()
@IsIn(["VIRTUAL", "PHYSICAL"])
cardType?: "VIRTUAL" | "PHYSICAL";
}
