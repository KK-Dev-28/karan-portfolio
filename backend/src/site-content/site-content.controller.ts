import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import { SiteContentService } from './site-content.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('site-content')
export class SiteContentController {
  constructor(private readonly svc: SiteContentService) {}

  @Get()
  getAll() {
    return this.svc.getAll();
  }

  @Get(':section')
  getSection(@Param('section') section: string) {
    return this.svc.getSection(section);
  }

  @Put(':section')
  @UseGuards(JwtAuthGuard)
  update(@Param('section') section: string, @Body() body: { data: any }) {
    return this.svc.updateSection(section, body.data);
  }
}
