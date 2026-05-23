import { IsEmail, IsString, MinLength, MaxLength, Length } from 'class-validator';
import { Transform } from 'class-transformer';

export class FreeIdeasDto {
  @IsEmail()
  @Transform(({ value }) => value?.toLowerCase().trim())
  email: string;

  @IsString() @MinLength(3) @MaxLength(200)
  topic: string;
}

export class SendCodeDto {
  @IsEmail()
  @Transform(({ value }) => value?.toLowerCase().trim())
  email: string;
}

export class VerifyCodeDto {
  @IsEmail()
  @Transform(({ value }) => value?.toLowerCase().trim())
  email: string;

  @IsString() @Length(6, 6)
  code: string;
}
