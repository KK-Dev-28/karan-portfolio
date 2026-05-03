import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { AuthService } from './auth.service';

export class LoginDto {
  @ApiProperty({ example: 'Karan@Admin2025' })
  @IsNotEmpty() @IsString() password: string;
}

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private svc: AuthService) {}
  @Post('login')
  @ApiOperation({ summary: 'Admin login — returns JWT' })
  login(@Body() dto: LoginDto) { return this.svc.login(dto.password); }
}
