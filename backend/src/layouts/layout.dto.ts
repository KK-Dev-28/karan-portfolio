import { IsString, IsOptional, MaxLength, IsObject } from 'class-validator';

export class GenerateLayoutDto {
  /** Optional steer, e.g. "a dense dashboard feel". */
  @IsOptional() @IsString() @MaxLength(300) brief?: string;
}

export class SaveLayoutDto {
  @IsString() @MaxLength(40)                 id: string;
  @IsString() @MaxLength(48)                 label: string;
  @IsOptional() @IsString() @MaxLength(220)  blurb?: string;
  /* Shape is checked in the service against the token whitelist; declaring it
     loosely here keeps one source of truth for those rules. */
  @IsObject()                                tokens: Record<string, string>;
}
