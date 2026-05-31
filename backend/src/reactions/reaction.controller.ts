import { Controller, Get, Post, Delete, Body, Param, Req, ParseIntPipe, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Request } from 'express';
import { ReactionService } from './reaction.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('reactions')
export class ReactionController {
  constructor(private readonly svc: ReactionService) {}

  @Get('counts')
  getCounts() { return this.svc.getAllCounts(); }

  @Get(':section')
  getSection(@Param('section') section: string, @Req() req: Request) {
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ?? req.ip ?? '';
    return this.svc.getSectionReactions(section, ip);
  }

  @Post('like')
  @Throttle({ default: { ttl: 60_000, limit: 20 } })
  toggleLike(@Body() body: { section: string }, @Req() req: Request) {
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ?? req.ip ?? '';
    return this.svc.toggleLike(body.section, ip);
  }

  @Post('comment')
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  addComment(@Body() body: { section: string; content: string; name?: string }, @Req() req: Request) {
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ?? req.ip ?? '';
    return this.svc.addComment(body.section, ip, body.content, body.name);
  }

  @Get('admin/all')
  @UseGuards(JwtAuthGuard)
  adminAll() { return this.svc.getAllAdmin(); }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id', ParseIntPipe) id: number) { return this.svc.removeReaction(id); }
}
