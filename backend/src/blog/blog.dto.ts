import { IsEmail, IsString, MinLength, MaxLength, Matches, IsBoolean, IsOptional, IsArray, IsUrl, IsIn } from 'class-validator';
import { Transform } from 'class-transformer';

export class BlogCheckoutDto {
  @IsString() @MinLength(2) @MaxLength(100) name: string;
  @IsEmail() @Transform(({ value }) => value?.toLowerCase().trim()) email: string;
}

export class BlogVerifyDto {
  @IsString() razorpayOrderId: string;
  @IsString() razorpayPaymentId: string;
  @IsString() razorpaySignature: string;
  @IsString() @MinLength(2) @MaxLength(100) name: string;
  @IsEmail() @Transform(({ value }) => value?.toLowerCase().trim()) email: string;
}

export class BlogRegisterDto {
  @IsString() @MinLength(10) registrationToken: string;
  @IsEmail() @Transform(({ value }) => value?.toLowerCase().trim()) email: string;
  @IsString() @MinLength(3) @MaxLength(30)
  @Matches(/^[a-z0-9_-]+$/, { message: 'Username may only contain lowercase letters, numbers, underscores and hyphens.' })
  username: string;
  @IsString() @MinLength(2) @MaxLength(80) name: string;
  @IsString() @MinLength(8, { message: 'Password must be at least 8 characters.' }) @MaxLength(128) password: string;
}

export class BlogLoginDto {
  @IsEmail() @Transform(({ value }) => value?.toLowerCase().trim()) email: string;
  @IsString() @MinLength(1) password: string;
}

export class BlogUpdateProfileDto {
  @IsOptional() @IsString() @MinLength(2) @MaxLength(80)  name?: string;
  @IsOptional() @IsString() @MaxLength(500)               bio?: string;
  @IsOptional() @IsUrl()                                  avatar?: string;
  @IsOptional() @IsUrl()                                  website?: string;
  @IsOptional() @IsString() @MaxLength(50)                twitter?: string;
  @IsOptional() @IsUrl()                                  linkedin?: string;
  @IsOptional() @IsString() @MaxLength(50)                github?: string;
  @IsOptional() @IsBoolean()                              showBio?: boolean;
  @IsOptional() @IsBoolean()                              showSocials?: boolean;
  @IsOptional() @IsBoolean()                              showPostCount?: boolean;
  @IsOptional() @IsBoolean()                              publicProfile?: boolean;
  @IsOptional() @IsString() @MinLength(1)                 currentPassword?: string;
  @IsOptional() @IsString() @MinLength(8) @MaxLength(128) newPassword?: string;
}

export class BlogCreatePostDto {
  @IsString() @MinLength(3) @MaxLength(200)  title: string;
  @IsString() @MinLength(10) @MaxLength(50000) body: string;
  @IsOptional() @IsString() @MaxLength(300)  excerpt?: string;
  @IsOptional() @IsString() @MaxLength(500)  coverImage?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) @MaxLength(30, { each: true }) tags?: string[];
  @IsOptional() @IsBoolean()                 published?: boolean;
}

export class BlogUpdatePostDto {
  @IsOptional() @IsString() @MinLength(3) @MaxLength(200)    title?: string;
  @IsOptional() @IsString() @MinLength(10) @MaxLength(50000) body?: string;
  @IsOptional() @IsString() @MaxLength(300)                  excerpt?: string;
  @IsOptional() @IsString() @MaxLength(500)                  coverImage?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) @MaxLength(30, { each: true }) tags?: string[];
  @IsOptional() @IsBoolean()                                 published?: boolean;
}

export class BlogAiGenerateDto {
  @IsString() @MinLength(5) @MaxLength(500) prompt: string;
  @IsOptional() @IsIn(['professional','casual','technical','motivational','humorous']) tone?: string;
  @IsOptional() @IsIn(['short','medium','long']) length?: string;
}
