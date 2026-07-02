import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

interface HealthStatus {
  status: 'ok' | 'degraded' | 'critical';
  timestamp: string;
  services: {
    database: {
      status: 'ok' | 'error';
      latency?: number;
      error?: string;
    };
    cache: {
      status: 'ok' | 'error' | 'unconfigured';
      error?: string;
    };
  };
  uptime: number;
}

const startTime = Date.now();

export async function GET(_req: NextRequest): Promise<NextResponse<HealthStatus>> {
  const healthStatus: HealthStatus = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      database: { status: 'ok' },
      cache: { status: 'unconfigured' },
    },
    uptime: Date.now() - startTime,
  };

  try {
    // Check database connectivity
    const dbStartTime = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const dbLatency = Date.now() - dbStartTime;

    healthStatus.services.database = {
      status: 'ok',
      latency: dbLatency,
    };

    if (dbLatency > 1000) {
      healthStatus.status = 'degraded';
    }
  } catch (error) {
    healthStatus.services.database = {
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown database error',
    };
    healthStatus.status = 'critical';
  }

  // Check Redis/cache if configured
  if (process.env.UPSTASH_REDIS_REST_URL) {
    try {
      const response = await fetch(`${process.env.UPSTASH_REDIS_REST_URL}/ping`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`,
        },
      });

      if (response.ok) {
        healthStatus.services.cache.status = 'ok';
      } else {
        healthStatus.services.cache.status = 'error';
        healthStatus.services.cache.error = `HTTP ${response.status}`;
        if (healthStatus.status !== 'critical') {
          healthStatus.status = 'degraded';
        }
      }
    } catch (error) {
      healthStatus.services.cache.status = 'error';
      healthStatus.services.cache.error = error instanceof Error ? error.message : 'Connection failed';
      if (healthStatus.status !== 'critical') {
        healthStatus.status = 'degraded';
      }
    }
  }

  const statusCode = healthStatus.status === 'critical' ? 503 : 200;
  return NextResponse.json(healthStatus, { status: statusCode });
}
