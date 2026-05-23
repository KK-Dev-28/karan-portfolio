import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateOrderDto {
  @IsNotEmpty() @IsString() serviceType: string;
  @IsNotEmpty() @IsString() @MaxLength(100) customerName: string;
  @IsEmail() customerEmail: string;
  @IsOptional() @IsString() @MaxLength(20) customerPhone?: string;
  @IsNotEmpty() requirements: any;
}
