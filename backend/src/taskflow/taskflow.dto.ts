import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator';

export class RegisterDto {
  @IsString() @MinLength(1) @MaxLength(80)   name: string;
  @IsEmail()  @MaxLength(160)                email: string;
  @IsString() @MinLength(6) @MaxLength(128)  password: string;
}

export class LoginDto {
  @IsEmail()  @MaxLength(160)                email: string;
  @IsString() @MinLength(1) @MaxLength(128)  password: string;
}

/* Task writes deliberately have no DTO class. The client PUTs back the whole
   Todo object it holds in memory, including keys it derives locally, and the
   app-wide ValidationPipe runs with forbidNonWhitelisted — it executes before
   any controller-level pipe, so a lenient pipe on the route cannot loosen it
   and every such request would 400. Leaving the body untyped makes Nest skip
   validation entirely; TaskflowService.sanitize then copies across an explicit
   allowlist, which also stops a caller reassigning id or userId. */
export type TodoBody = Record<string, unknown>;
