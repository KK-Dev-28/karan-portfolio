import { IsNotEmpty } from 'class-validator';

export class UpdateSectionDto {
  @IsNotEmpty()
  data: any;
}
