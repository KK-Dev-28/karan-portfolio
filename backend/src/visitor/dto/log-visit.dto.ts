// ── dto/log-visit.dto.ts ──────────────────────────────────────────────────
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class LogVisitDto {
  @ApiPropertyOptional() @IsOptional() @IsString() page?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() referrer?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(500) userAgent?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() sessionId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() country?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() city?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() region?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() flag?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(60) visitorName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(60) timezone?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(20) language?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(20) screen?: string;
  /** Must be true — the server ignores visits without explicit consent. */
  @ApiPropertyOptional() @IsOptional() @IsBoolean() consent?: boolean;
}
