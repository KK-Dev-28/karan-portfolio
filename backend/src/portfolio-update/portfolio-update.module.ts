import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PortfolioUpdate } from './portfolio-update.entity';
import { PortfolioUpdateService } from './portfolio-update.service';
import { PortfolioUpdateController } from './portfolio-update.controller';
import {
  CreatePortfolioUpdateHandler,
  ListPublishedPortfolioUpdatesHandler,
  PatchPortfolioUpdateHandler,
  RemovePortfolioUpdateHandler,
} from './handlers/portfolio.cqrs-handlers';

@Module({
  imports: [TypeOrmModule.forFeature([PortfolioUpdate])],
  controllers: [PortfolioUpdateController],
  providers: [
    PortfolioUpdateService,
    CreatePortfolioUpdateHandler,
    PatchPortfolioUpdateHandler,
    RemovePortfolioUpdateHandler,
    ListPublishedPortfolioUpdatesHandler,
  ],
  exports: [PortfolioUpdateService],
})
export class PortfolioUpdateModule {}
