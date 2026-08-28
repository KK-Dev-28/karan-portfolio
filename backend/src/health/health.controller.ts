import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { DataSource } from 'typeorm';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private dataSource: DataSource) {}

  @Get()
  @ApiOperation({ summary: 'Service health status & detailed diagnostics (public)' })
  async health() {
    const startDb = Date.now();
    let dbStatus = 'healthy';
    let dbLatencyMs = 0;

    try {
      if (this.dataSource.isInitialized) {
        await this.dataSource.query('SELECT 1');
        dbLatencyMs = Date.now() - startDb;
      } else {
        dbStatus = 'uninitialized';
      }
    } catch (err: any) {
      dbStatus = 'degraded';
      dbLatencyMs = Date.now() - startDb;
    }

    const mem = process.memoryUsage();

    return {
      ok: dbStatus === 'healthy',
      service: 'karan-portfolio-backend',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      environment: process.env.NODE_ENV || 'development',
      nodeVersion: process.version,
      database: {
        status: dbStatus,
        latencyMs: dbLatencyMs,
        driver: 'postgres',
      },
      memory: {
        rssMb: Math.round((mem.rss / 1024 / 1024) * 100) / 100,
        heapTotalMb: Math.round((mem.heapTotal / 1024 / 1024) * 100) / 100,
        heapUsedMb: Math.round((mem.heapUsed / 1024 / 1024) * 100) / 100,
      },
    };
  }
}
