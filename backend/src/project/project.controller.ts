import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, OnModuleInit, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ProjectService } from './project.service';
import { Project } from './project.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Projects')
@Controller('projects')
export class ProjectController implements OnModuleInit {
  constructor(private svc: ProjectService) {}

  async onModuleInit() { await this.svc.seed(); }  // auto-seed on startup

  @Get()           @ApiOperation({ summary: 'All projects (public)' })
  findAll()        { return this.svc.findAll(); }

  @Get('featured') @ApiOperation({ summary: 'Featured projects (public)' })
  featured()       { return this.svc.findFeatured(); }

  @Post()
  @UseGuards(JwtAuthGuard) @ApiBearerAuth()
  create(@Body() body: Partial<Project>) { return this.svc.create(body); }

  @Put(':id')
  @UseGuards(JwtAuthGuard) @ApiBearerAuth()
  update(@Param('id', ParseIntPipe) id: number, @Body() body: Partial<Project>) { return this.svc.update(id, body); }

  @Delete(':id')
  @UseGuards(JwtAuthGuard) @ApiBearerAuth()
  remove(@Param('id', ParseIntPipe) id: number) { return this.svc.remove(id); }
}
