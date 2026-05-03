import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, MaxLength } from 'class-validator';

export class CreateInsightsCheckoutDto {
  @ApiProperty({ example: 'analyst@company.com' })
  @IsEmail()
  @MaxLength(320)
  email: string;
}
