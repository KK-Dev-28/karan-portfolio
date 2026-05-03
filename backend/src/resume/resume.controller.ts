import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { ResumeService } from './resume.service';
import { AnalyzeResumeDto } from './dto/analyze-resume.dto';

@ApiTags('Resume')
@Controller('resume')
export class ResumeController {
  constructor(private readonly resume: ResumeService) {}

  @Post('analyze')
  @Throttle({ default: { ttl: 60_000, limit: 20 } })
  @ApiOperation({
    summary: 'Heuristic resume review (proxies to Python service)',
    description:
      'Requires RESUME_SERVICE_URL. Run `services/resume-analyzer` locally on port 8010 or deploy alongside the API.',
  })
  analyze(@Body() dto: AnalyzeResumeDto) {
    return this.resume.analyze(dto);
  }
}
