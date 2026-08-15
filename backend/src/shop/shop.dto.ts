import { IsString, IsUUID, IsInt, IsOptional, Min, Max, MinLength, MaxLength } from 'class-validator';

export class AddToCartDto {
  @IsUUID()                                 productId: string;
  @IsString() @MinLength(8) @MaxLength(64)  sessionId: string;

  /* Bounded rather than open-ended: an unbounded quantity is the easy way to
     overflow a total or drain the demo's stock in one request. */
  @IsOptional() @IsInt() @Min(1) @Max(99)   quantity?: number;
}

export class UpdateCartDto {
  @IsString() @MinLength(8) @MaxLength(64)  sessionId: string;
  @IsInt() @Min(0) @Max(99)                 quantity: number;   // 0 removes the line
}

export class CheckoutDto {
  @IsString() @MinLength(8) @MaxLength(64)  sessionId: string;
  @IsOptional() @IsString() @MaxLength(80)  customerName?: string;
}
