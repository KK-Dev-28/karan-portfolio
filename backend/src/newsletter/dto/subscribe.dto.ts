import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

export class SubscribeNewsletterDto {
  @IsEmail()
  @MaxLength(320)
  email: string;

  @ApiPropertyOptional({ example: 'footer' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  source?: string;
}
