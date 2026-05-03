import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { PortfolioUpdateService } from './portfolio-update.service';
import { CreatePortfolioUpdateDto } from './dto/create-portfolio-update.dto';
import { UpdatePortfolioUpdateDto } from './dto/update-portfolio-update.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  CreatePortfolioUpdateCommand,
  PatchPortfolioUpdateCommand,
  RemovePortfolioUpdateCommand,
} from './commands/portfolio.commands';
import { ListPublishedPortfolioUpdatesQuery } from './queries/portfolio.queries';

@ApiTags('Portfolio updates')
@Controller('updates')
export class PortfolioUpdateController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly svc: PortfolioUpdateService,
  ) {}

  @Get()
  @Throttle({ default: { ttl: 60_000, limit: 120 } })
  @ApiOperation({ summary: 'Published journal entries (public)' })
  published() {
    return this.queryBus.execute(new ListPublishedPortfolioUpdatesQuery());
  }

  @Get('admin')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'All entries including drafts (admin)' })
  adminList() {
    return this.svc.findAllForAdmin();
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create entry (admin)' })
  create(@Body() dto: CreatePortfolioUpdateDto) {
    return this.commandBus.execute(new CreatePortfolioUpdateCommand(dto));
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Edit entry (admin)' })
  patch(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdatePortfolioUpdateDto) {
    return this.commandBus.execute(new PatchPortfolioUpdateCommand(id, dto));
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete entry (admin)' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.commandBus.execute(new RemovePortfolioUpdateCommand(id));
  }
}
