import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOperation({ summary: 'Service health status (public)' })
  health() {
    return {
      ok: true,
      service: 'karan-portfolio-backend',
      timestamp: new Date().toISOString(),
    };
  }
}
