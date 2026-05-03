import { Query } from '@nestjs/cqrs';
import { PortfolioUpdate } from '../portfolio-update.entity';

export class ListPublishedPortfolioUpdatesQuery extends Query<PortfolioUpdate[]> {}
