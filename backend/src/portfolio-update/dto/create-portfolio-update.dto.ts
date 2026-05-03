import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
} from 'class-validator';

export const PORTFOLIO_UPDATE_KINDS = ['achievement', 'learning', 'milestone', 'note'] as const;

export class CreatePortfolioUpdateDto {
  @ApiProperty({ enum: PORTFOLIO_UPDATE_KINDS, example: 'learning' })
  @IsString()
  @IsIn([...PORTFOLIO_UPDATE_KINDS])
  kind: (typeof PORTFOLIO_UPDATE_KINDS)[number];

  @ApiProperty({ example: 'Shipped v2 analytics dashboard' })
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  title: string;

  @ApiProperty({ example: 'Added weekly cohort charts and export to CSV for stakeholders.' })
  @IsString()
  @MinLength(1)
  @MaxLength(8000)
  body: string;

  @ApiPropertyOptional({ example: 'https://github.com/you/repo' })
  @Transform(({ value }) => (typeof value === 'string' && value.trim() === '' ? undefined : value))
  @IsOptional()
  @IsUrl({ require_protocol: true })
  @MaxLength(500)
  linkUrl?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}
