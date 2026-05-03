import { CommandHandler, ICommandHandler, IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PortfolioUpdateService } from '../portfolio-update.service';
import {
  CreatePortfolioUpdateCommand,
  PatchPortfolioUpdateCommand,
  RemovePortfolioUpdateCommand,
} from '../commands/portfolio.commands';
import { ListPublishedPortfolioUpdatesQuery } from '../queries/portfolio.queries';

@CommandHandler(CreatePortfolioUpdateCommand)
export class CreatePortfolioUpdateHandler
  implements ICommandHandler<CreatePortfolioUpdateCommand>
{
  constructor(private readonly svc: PortfolioUpdateService) {}

  execute(command: CreatePortfolioUpdateCommand) {
    return this.svc.create(command.dto);
  }
}

@CommandHandler(PatchPortfolioUpdateCommand)
export class PatchPortfolioUpdateHandler implements ICommandHandler<PatchPortfolioUpdateCommand> {
  constructor(private readonly svc: PortfolioUpdateService) {}

  execute(command: PatchPortfolioUpdateCommand) {
    return this.svc.update(command.id, command.dto);
  }
}

@CommandHandler(RemovePortfolioUpdateCommand)
export class RemovePortfolioUpdateHandler
  implements ICommandHandler<RemovePortfolioUpdateCommand>
{
  constructor(private readonly svc: PortfolioUpdateService) {}

  execute(command: RemovePortfolioUpdateCommand) {
    return this.svc.remove(command.id);
  }
}

@QueryHandler(ListPublishedPortfolioUpdatesQuery)
export class ListPublishedPortfolioUpdatesHandler
  implements IQueryHandler<ListPublishedPortfolioUpdatesQuery>
{
  constructor(private readonly svc: PortfolioUpdateService) {}

  execute(_query: ListPublishedPortfolioUpdatesQuery) {
    return this.svc.findPublished();
  }
}
