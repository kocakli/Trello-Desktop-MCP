// Express is optional for health endpoints
type Request = any;
type Response = any;
import { insights } from './appInsights.js';
import { logger } from './logger.js';

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  environment: string;
  uptime: number;
  memory: NodeJS.MemoryUsage;
  nodejs: {
    version: string;
    platform: string;
    arch: string;
  };
  azure: {
    hostname?: string;
    instanceId?: string;
    siteName?: string;
    resourceGroup?: string;
    applicationInsights: boolean;
    customDomain: string;
  };
  services: {
    trello: {
      status: 'available' | 'unavailable';
      endpoint: string;
    };
    mcp: {
      status: 'active' | 'inactive';
      tools: number;
    };
  };
  performance: {
    cpuUsage: NodeJS.CpuUsage;
    memoryUtilization: number;
    avgResponseTime?: number;
  };
}

export class HealthChecker {
  private startTime = Date.now();
  private requestTimes: number[] = [];
  private readonly maxRequestTimes = 100;

  recordRequestTime(duration: number) {
    this.requestTimes.push(duration);
    if (this.requestTimes.length > this.maxRequestTimes) {
      this.requestTimes.shift();
    }
  }

  private getAverageResponseTime(): number | undefined {
    if (this.requestTimes.length === 0) return undefined;
    return this.requestTimes.reduce((sum, time) => sum + time, 0) / this.requestTimes.length;
  }

  private async checkTrelloAPI(): Promise<'available' | 'unavailable'> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch('https://api.trello.com/1/', {
        method: 'HEAD',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      // 404 da OK kabul et - API çalışıyor demektir
      return (response.status >= 200 && response.status < 500) ? 'available' : 'unavailable';
      
    } catch {
      return 'unavailable';
    }
  }

  private getMemoryUtilization(): number {
    const usage = process.memoryUsage();
    const totalMemory = usage.heapTotal + usage.external;
    const usedMemory = usage.heapUsed;
    return Math.round((usedMemory / totalMemory) * 100);
  }

  private determineOverallStatus(healthData: Omit<HealthStatus, 'status'>): 'healthy' | 'degraded' | 'unhealthy' {
    const memoryUtilization = healthData.performance.memoryUtilization;
    const mcpStatus = healthData.services.mcp.status;

    // Unhealthy conditions - Trello API status'unu ignore et
    if (memoryUtilization > 90 || mcpStatus === 'inactive') {
      return 'unhealthy';
    }

    // Degraded conditions
    if (memoryUtilization > 80 || (healthData.performance.avgResponseTime && healthData.performance.avgResponseTime > 1000)) {
      return 'degraded';
    }

    return 'healthy';
  }

  async getHealthStatus(): Promise<HealthStatus> {
    const cpuUsage = process.cpuUsage();
    const memory = process.memoryUsage();
    const uptime = (Date.now() - this.startTime) / 1000;
    const memoryUtilization = this.getMemoryUtilization();
    const avgResponseTime = this.getAverageResponseTime();

    const trelloStatus = await this.checkTrelloAPI();

    const healthData: Omit<HealthStatus, 'status'> = {
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime,
      memory,
      nodejs: {
        version: process.version,
        platform: process.platform,
        arch: process.arch
      },
      azure: {
        ...(process.env.WEBSITE_HOSTNAME && { hostname: process.env.WEBSITE_HOSTNAME }),
        ...(process.env.WEBSITE_INSTANCE_ID && { instanceId: process.env.WEBSITE_INSTANCE_ID }),
        ...(process.env.WEBSITE_SITE_NAME && { siteName: process.env.WEBSITE_SITE_NAME }),
        ...(process.env.WEBSITE_RESOURCE_GROUP && { resourceGroup: process.env.WEBSITE_RESOURCE_GROUP }),
        applicationInsights: !!process.env.APPLICATIONINSIGHTS_CONNECTION_STRING,
        customDomain: 'trello.mcplab.tr'
      },
      services: {
        trello: {
          status: trelloStatus,
          endpoint: 'https://api.trello.com/1/'
        },
        mcp: {
          status: 'active', // Assume active if health check is running
          tools: 7 // Number of MCP tools available
        }
      },
      performance: {
        cpuUsage,
        memoryUtilization,
        ...(avgResponseTime !== undefined && { avgResponseTime })
      }
    };

    const status = this.determineOverallStatus(healthData);

    return {
      status,
      ...healthData
    };
  }

  async handleHealthCheck(req: Request, res: Response) {
    const startTime = Date.now();
    
    try {
      const healthStatus = await this.getHealthStatus();
      const duration = Date.now() - startTime;
      
      this.recordRequestTime(duration);
      
      // Log health check
      logger.info('Health check completed', {
        status: healthStatus.status,
        duration: `${duration}ms`,
        memoryUtilization: healthStatus.performance.memoryUtilization,
        uptime: healthStatus.uptime,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      // Track health check in Application Insights
      insights.trackEvent('HealthCheck', {
        status: healthStatus.status,
        memoryUtilization: healthStatus.performance.memoryUtilization.toString(),
        trelloStatus: healthStatus.services.trello.status,
        environment: healthStatus.environment,
        userAgent: req.get('User-Agent') || 'unknown'
      });

      insights.trackMetric('HealthCheckDuration', duration, {
        status: healthStatus.status
      });

      // Set appropriate HTTP status code
      const statusCode = healthStatus.status === 'healthy' ? 200 : 
                        healthStatus.status === 'degraded' ? 200 : 503;

      res.status(statusCode).json(healthStatus);
      
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      logger.error('Health check failed', {
        error: errorMessage,
        duration: `${duration}ms`,
        ip: req.ip
      });

      insights.trackException(error instanceof Error ? error : new Error(errorMessage), {
        operation: 'HealthCheck',
        duration: duration.toString()
      });

      res.status(503).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Health check failed',
        message: errorMessage
      });
    }
  }
}

export const healthChecker = new HealthChecker();