import { IsEmail, IsInt, IsNotEmpty, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class CreateReviewDto {
  @IsNotEmpty() @IsString() @MaxLength(100) name: string;
  @IsEmail() email: string;
  @IsOptional() @IsString() @MaxLength(100) company?: string;
  @IsOptional() @IsString() @MaxLength(100) role?: string;
  @IsInt() @Min(1) @Max(5) rating: number;
  @IsNotEmpty() @IsString() @MaxLength(200) title: string;
  @IsNotEmpty() @IsString() @MaxLength(2000) body: string;
}
