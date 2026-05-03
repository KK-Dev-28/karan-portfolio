import { CreatePortfolioUpdateDto } from '../dto/create-portfolio-update.dto';
import { UpdatePortfolioUpdateDto } from '../dto/update-portfolio-update.dto';

export class CreatePortfolioUpdateCommand {
  constructor(public readonly dto: CreatePortfolioUpdateDto) {}
}

export class PatchPortfolioUpdateCommand {
  constructor(
    public readonly id: number,
    public readonly dto: UpdatePortfolioUpdateDto,
  ) {}
}

export class RemovePortfolioUpdateCommand {
  constructor(public readonly id: number) {}
}
