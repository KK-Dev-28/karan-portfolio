import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateContactDto {
  @ApiProperty()         @IsNotEmpty() @IsString() @MaxLength(100)  name: string;
  @ApiProperty()         @IsEmail()                                  email: string;
  @ApiPropertyOptional() @IsOptional() @IsString()                  phone?: string;
  @ApiProperty()         @IsNotEmpty() @IsString() @MaxLength(200)  subject: string;
  @ApiProperty()         @IsNotEmpty() @IsString() @MaxLength(3000) message: string;
}
