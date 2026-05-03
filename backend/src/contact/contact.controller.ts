import { Controller, Post, Get, Patch, Param, Body, Req, UseGuards, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Request } from 'express';
import { ContactService } from './contact.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Contact')
@Controller('contact')
export class ContactController {
  constructor(private svc: ContactService) {}

  @Post()
  @ApiOperation({ summary: 'Submit contact form (public)' })
  create(@Body() dto: CreateContactDto, @Req() req: Request) {
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || '0.0.0.0';
    return this.svc.create(dto, ip);
  }

  @Get()
  @UseGuards(JwtAuthGuard) @ApiBearerAuth()
  @ApiOperation({ summary: 'List all messages (admin)' })
  findAll() { return this.svc.findAll(); }

  @Patch(':id/read')
  @UseGuards(JwtAuthGuard) @ApiBearerAuth()
  markRead(@Param('id', ParseIntPipe) id: number) { return this.svc.markRead(id); }

  @Get('unread-count')
  @UseGuards(JwtAuthGuard) @ApiBearerAuth()
  unread() { return this.svc.unreadCount(); }
}
