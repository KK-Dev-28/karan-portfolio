import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class AnalyzeResumeDto {
  @ApiProperty({ example: 'Software engineer with 5 years...', description: 'Resume text or excerpt' })
  @IsString()
  @MinLength(10)
  @MaxLength(50_000)
  text!: string;

  @ApiPropertyOptional({ description: 'Job description for keyword alignment' })
  @IsOptional()
  @IsString()
  @MaxLength(20_000)
  jobDescription?: string;
}
