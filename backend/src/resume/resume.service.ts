import { Injectable, ServiceUnavailableException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AnalyzeResumeDto } from './dto/analyze-resume.dto';

@Injectable()
export class ResumeService {
  private readonly log = new Logger(ResumeService.name);

  constructor(
    private readonly cfg: ConfigService,
    private readonly http: HttpService,
  ) {}

  private baseUrl(): string | null {
    const u = this.cfg.get<string>('RESUME_SERVICE_URL')?.trim();
    return u || null;
  }

  async analyze(dto: AnalyzeResumeDto) {
    const base = this.baseUrl();
    if (!base) {
      throw new ServiceUnavailableException(
        'Resume analysis is not configured. Set RESUME_SERVICE_URL to your Python FastAPI service (see services/resume-analyzer).',
      );
    }
    const url = `${base.replace(/\/$/, '')}/analyze`;
    try {
      const { data } = await firstValueFrom(
        this.http.post<Record<string, unknown>>(url, {
          text: dto.text,
          job_description: dto.jobDescription ?? null,
        }),
      );
      return data;
    } catch (e: unknown) {
      const err = e as { code?: string; message?: string; response?: { status?: number } };
      this.log.warn(`Resume service error: ${err?.message ?? e}`);
      throw new ServiceUnavailableException(
        'Could not reach the resume analysis service. Is it running and reachable from the API?',
      );
    }
  }
}
