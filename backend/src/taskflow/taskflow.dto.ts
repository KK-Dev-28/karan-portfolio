import {
  IsString, IsOptional, IsIn, IsBoolean, IsInt, IsArray, IsEmail,
  MinLength, MaxLength, Min, IsDateString,
} from 'class-validator';

/* The global pipe runs with forbidNonWhitelisted, so every field the client
   actually sends has to be declared here or the request is rejected outright. */

export class RegisterDto {
  @IsString() @MinLength(1) @MaxLength(80)   name: string;
  @IsEmail()  @MaxLength(160)                email: string;
  @IsString() @MinLength(8) @MaxLength(128)  password: string;
}

export class LoginDto {
  @IsEmail() @MaxLength(160)                 email: string;
  @IsString() @MaxLength(128)                password: string;
}

export class CreateTodoDto {
  @IsString() @MinLength(1) @MaxLength(500)                  text: string;
  /* Two views ship different vocabularies: the Kanban board moves cards
     between todo/in-progress/done, the list view toggles pending/completed. */
  @IsOptional() @IsIn(['todo', 'in-progress', 'done', 'pending', 'completed']) status?: string;
  @IsOptional() @IsIn(['low', 'medium', 'high'])             priority?: string;
  @IsOptional() @IsString() @MaxLength(80)                   category?: string;
  @IsOptional() @IsArray() @IsString({ each: true })         tags?: string[];
  /* The picker clears to an empty string rather than omitting the field. */
  @IsOptional() @IsDateString()                              dueDate?: string;
  @IsOptional() @IsInt() @Min(0)                             actualTime?: number;
  @IsOptional() @IsBoolean()                                 isStarred?: boolean;
  @IsOptional() @IsBoolean()                                 isArchived?: boolean;
}

export class UpdateTodoDto extends CreateTodoDto {
  @IsOptional() @IsString() @MinLength(1) @MaxLength(500)    text: string;
}

export class SubTaskDto {
  @IsString() @MinLength(1) @MaxLength(300)  text: string;
  @IsOptional() @IsBoolean()                 completed?: boolean;
}

export class CommentDto {
  @IsString() @MinLength(1) @MaxLength(2000) text: string;
  @IsOptional() @IsString() @MaxLength(80)   author?: string;
}

export class TimeEntryDto {
  @IsDateString()                            startTime: string;
  @IsDateString()                            endTime: string;
  @IsOptional() @IsInt() @Min(0)             duration?: number;
}
