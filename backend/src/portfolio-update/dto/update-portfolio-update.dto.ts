import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { PORTFOLIO_UPDATE_KINDS } from './create-portfolio-update.dto';

export class UpdatePortfolioUpdateDto {
  @ApiPropertyOptional({ enum: PORTFOLIO_UPDATE_KINDS })
  @IsOptional()
  @IsString()
  @IsIn([...PORTFOLIO_UPDATE_KINDS])
  kind?: (typeof PORTFOLIO_UPDATE_KINDS)[number];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(8000)
  body?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  linkUrl?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}
