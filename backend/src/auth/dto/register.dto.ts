import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
  MinLength,
} from "class-validator";

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsEmail()
  email!: string;

  @Matches(/^05\d{8}$/, {
    message: "رقم الجوال يجب أن يكون 10 أرقام ويبدأ بـ 05",
  })
  phone!: string;

  @IsString()
  @MinLength(8)
  password!: string;
}
