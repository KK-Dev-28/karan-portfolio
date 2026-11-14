import { Type } from 'class-transformer';
import {
  ArrayMaxSize, IsArray, IsEmail, IsIn, IsInt, IsOptional, IsString, IsUrl, Length, Matches, MaxLength, Min, Max, ValidateNested,
} from 'class-validator';
import { CLIENT_PERMISSIONS, FEATURE_STATUSES, REQUEST_STATUSES } from './portfolio-request.entity';

class LinkDto {
  @IsString() @Length(1, 40) label: string;
  @IsUrl({ require_protocol: true }) @MaxLength(300) url: string;
}
class ProjectDto {
  @IsString() @Length(1, 80) name: string;
  @IsString() @MaxLength(600) summary: string;
  @IsOptional() @IsString() @MaxLength(300) url?: string;
}

export class RequestDto {
  @IsString() @Length(2, 80) name: string;
  @IsOptional() @IsString() @MaxLength(30) phone?: string;
  @IsOptional() @IsString() @MaxLength(80) profession?: string;
  @IsOptional() @IsString() @MaxLength(160) headline?: string;
  @IsOptional() @IsString() @MaxLength(4000) about?: string;
  @IsOptional() @IsArray() @ArrayMaxSize(10) @ValidateNested({ each: true }) @Type(() => LinkDto) links?: LinkDto[];
  @IsOptional() @IsArray() @ArrayMaxSize(40) @IsString({ each: true }) @MaxLength(40, { each: true }) skills?: string[];
  @IsOptional() @IsArray() @ArrayMaxSize(12) @ValidateNested({ each: true }) @Type(() => ProjectDto) projects?: ProjectDto[];
  @IsArray() @ArrayMaxSize(30) @IsString({ each: true }) @MaxLength(40, { each: true }) modules: string[];
  @IsOptional() @IsString() @MaxLength(40) style?: string;
  @IsOptional() @IsString() @MaxLength(120) domain?: string;
  @IsOptional() @IsString() @MaxLength(2000) notes?: string;
}

/** Statuses the admin may set directly. "paid" is only reachable through a payment confirmation. */
export const ADMIN_SETTABLE = REQUEST_STATUSES.filter(s => s !== 'paid');

export class AdminUpdateDto {
  @IsOptional() @IsIn(ADMIN_SETTABLE as unknown as string[]) status?: string;
  @IsOptional() @IsArray() @ArrayMaxSize(30) @IsString({ each: true }) approvedModules?: string[];
  @IsOptional() @IsInt() @Min(0) @Max(10_000_000) quoteAmount?: number;
  @IsOptional() @IsString() @MaxLength(2000) quoteNote?: string;
  @IsOptional() @IsString() @MaxLength(300) liveUrl?: string;
  @IsOptional() @IsString() @MaxLength(4000) adminNotes?: string;
  /** Dashboard features this client may use. Only ids from CLIENT_PERMISSIONS are kept. */
  @IsOptional() @IsArray() @ArrayMaxSize(20) @IsIn(CLIENT_PERMISSIONS as unknown as string[], { each: true }) permissions?: string[];
  /** Email the client about this change (quote sent, site live, …). */
  @IsOptional() notify?: boolean;
}

/** A client asking, from their dashboard, for something new to be built. */
export class FeatureRequestDto {
  @IsString() @Length(4, 120) title: string;
  @IsOptional() @IsString() @MaxLength(2000) details?: string;
  @IsOptional() @IsString() @MaxLength(40) moduleId?: string;
}

/** The admin's answer to a feature request. */
export class FeatureDecisionDto {
  @IsIn(FEATURE_STATUSES as unknown as string[]) status: string;
  @IsOptional() @IsInt() @Min(0) @Max(10_000_000) price?: number;
  @IsOptional() @IsString() @MaxLength(2000) adminNote?: string;
  @IsOptional() notify?: boolean;
}

export class MarkPaidDto {
  /** UPI/bank reference for a payment confirmed outside Razorpay. */
  @IsString() @Length(4, 120) reference: string;
}

const STRONG = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{10,128}$/;
export class SetupDto {
  @IsString() @Length(32, 128) token: string;
  @Matches(STRONG, { message: 'Use at least 10 characters with upper and lower case letters and a number.' }) password: string;
}
export class LoginDto {
  @IsEmail() @MaxLength(320) email: string;
  @IsString() @Length(1, 128) password: string;
}
export class OtpDto {
  @IsEmail() @MaxLength(320) email: string;
  @IsString() @Length(6, 6) code: string;
}
export class ForgotDto {
  @IsEmail() @MaxLength(320) email: string;
}
