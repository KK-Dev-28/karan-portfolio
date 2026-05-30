import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export const CHECKOUT_TIERS = ['starter', 'standard', 'enterprise'] as const;
export type CheckoutTier = (typeof CHECKOUT_TIERS)[number];

export class CreateCheckoutDto {
  @ApiProperty({ enum: CHECKOUT_TIERS, example: 'standard' })
  @IsString()
  @IsIn([...CHECKOUT_TIERS])
  tier: CheckoutTier;

  @ApiPropertyOptional({ example: 'client@company.com' })
  @IsOptional()
  @IsEmail()
  @MaxLength(320)
  customerEmail?: string;

  @ApiPropertyOptional({ example: 'Rahul Sharma' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  customerName?: string;

  @ApiPropertyOptional({ example: '+91 98765 43210' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  customerPhone?: string;
}
