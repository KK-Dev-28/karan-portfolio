import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { LayoutService } from './layout.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GenerateLayoutDto, SaveLayoutDto } from './layout.dto';

@Controller('layouts')
export class LayoutController {
  constructor(private readonly svc: LayoutService) {}

  /* Public: every visitor needs these to render a generated layout they picked. */
  @Get()
  list() { return this.svc.list(); }

  /* Admin only — generation spends API credit, and publishing changes what
     every visitor can select. */
  @Post('generate')
  @UseGuards(JwtAuthGuard)
  generate(@Body() dto: GenerateLayoutDto) { return this.svc.generate(dto.brief); }

  @Post()
  @UseGuards(JwtAuthGuard)
  save(@Body() dto: SaveLayoutDto) { return this.svc.save(dto); }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string) { return this.svc.remove(id); }
}
