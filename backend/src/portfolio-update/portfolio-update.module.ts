import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PortfolioUpdate } from './portfolio-update.entity';
import { PortfolioUpdateService } from './portfolio-update.service';
import { PortfolioUpdateController } from './portfolio-update.controller';

@Module({
  imports: [TypeOrmModule.forFeature([PortfolioUpdate])],
  controllers: [PortfolioUpdateController],
  providers: [PortfolioUpdateService],
  exports: [PortfolioUpdateService],
})
export class PortfolioUpdateModule {}
