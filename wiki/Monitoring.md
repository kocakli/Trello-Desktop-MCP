# Monitoring Guide

This comprehensive guide covers monitoring, alerting, and observability for Trello Desktop MCP in production environments.

## Monitoring Overview

### Monitoring Strategy

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Application   │    │   Infrastructure│    │   Business      │
│   Monitoring    │    │   Monitoring    │    │   Monitoring    │
│                 │    │                 │    │                 │
│ - Response Time │    │ - CPU/Memory    │    │ - Tool Usage    │
│ - Error Rates   │    │ - Network I/O   │    │ - User Activity │
│ - Throughput    │    │ - Disk Usage    │    │ - API Quotas    │
│ - Rate Limits   │    │ - Process Health│    │ - Performance   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   Alerting &    │
                    │   Dashboard     │
                    │                 │
                    │ - Real-time     │
                    │ - Historical    │
                    │ - Predictive    │
                    └─────────────────┘
```

### Key Monitoring Areas

| Area | Metrics | Purpose | Alert Threshold |
|------|---------|---------|-----------------|
| **Performance** | Response time, throughput | User experience | > 5s response |
| **Reliability** | Error rate, uptime | System stability | > 5% error rate |
| **Resources** | CPU, memory, network | Capacity planning | > 80% utilization |
| **Security** | Auth failures, anomalies | Security posture | > 10 failed auths |
| **Business** | Tool usage, API quotas | Business impact | < 100 requests/day |

## Application Monitoring

### Performance Metrics

#### Response Time Monitoring

```typescript
// src/utils/performance-monitor.ts
interface PerformanceMetrics {
  operation: string;
  duration: number;
  timestamp: number;
  success: boolean;
  metadata?: Record<string, any>;
}

class PerformanceMonitor {
  private static metrics: PerformanceMetrics[] = [];
  private static readonly MAX_METRICS = 1000;
  
  static recordOperation(
    operation: string, 
    duration: number, 
    success: boolean,
    metadata?: Record<string, any>
  ): void {
    const metric: PerformanceMetrics = {
      operation,
      duration,
      timestamp: Date.now(),
      success,
      metadata
    };
    
    this.metrics.push(metric);
    
    // Keep only recent metrics
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics.shift();
    }
    
    // Real-time alerting
    if (duration > 5000) { // 5 second threshold
      this.alertSlowOperation(metric);
    }
    
    if (!success) {
      this.alertFailedOperation(metric);
    }
  }
  
  static getMetricsSummary(timeWindow: number = 300000): PerformanceSummary {
    const now = Date.now();
    const recentMetrics = this.metrics.filter(
      m => now - m.timestamp < timeWindow
    );
    
    return {
      totalRequests: recentMetrics.length,
      averageResponseTime: this.calculateAverage(recentMetrics.map(m => m.duration)),
      p95ResponseTime: this.calculatePercentile(recentMetrics.map(m => m.duration), 95),
      errorRate: this.calculateErrorRate(recentMetrics),
      requestsPerMinute: this.calculateRequestsPerMinute(recentMetrics),
      slowestOperations: this.findSlowestOperations(recentMetrics, 5)
    };
  }
  
  private static alertSlowOperation(metric: PerformanceMetrics): void {
    console.warn(`Slow operation detected: ${metric.operation} took ${metric.duration}ms`);
    // Integration with alerting system
    AlertManager.sendAlert({
      type: 'performance',
      severity: 'warning',
      message: `Slow operation: ${metric.operation}`,
      details: metric
    });
  }
}

// Usage in tools
export async function monitoredToolExecution<T>(
  operation: string,
  fn: () => Promise<T>
): Promise<T> {
  const startTime = Date.now();
  
  try {
    const result = await fn();
    const duration = Date.now() - startTime;
    
    PerformanceMonitor.recordOperation(operation, duration, true);
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    
    PerformanceMonitor.recordOperation(operation, duration, false, {
      error: error.message
    });
    throw error;
  }
}
```

#### Error Rate Monitoring

```typescript
// src/utils/error-monitor.ts
interface ErrorMetric {
  timestamp: number;
  operation: string;
  errorType: string;
  errorMessage: string;
  stackTrace?: string;
  userContext?: string;
}

class ErrorMonitor {
  private static errors: ErrorMetric[] = [];
  private static readonly ERROR_RATE_WINDOW = 300000; // 5 minutes
  private static readonly ERROR_RATE_THRESHOLD = 0.05; // 5%
  
  static recordError(
    operation: string,
    error: Error,
    userContext?: string
  ): void {
    const errorMetric: ErrorMetric = {
      timestamp: Date.now(),
      operation,
      errorType: error.constructor.name,
      errorMessage: error.message,
      stackTrace: error.stack,
      userContext
    };
    
    this.errors.push(errorMetric);
    
    // Check error rate
    const errorRate = this.calculateErrorRate();
    if (errorRate > this.ERROR_RATE_THRESHOLD) {
      this.alertHighErrorRate(errorRate);
    }
    
    // Alert on critical errors
    if (this.isCriticalError(error)) {
      this.alertCriticalError(errorMetric);
    }
  }
  
  static calculateErrorRate(): number {
    const now = Date.now();
    const windowStart = now - this.ERROR_RATE_WINDOW;
    
    const recentErrors = this.errors.filter(e => e.timestamp > windowStart);
    const totalOperations = PerformanceMonitor.getTotalOperations(windowStart);
    
    return totalOperations > 0 ? recentErrors.length / totalOperations : 0;
  }
  
  static getErrorSummary(): ErrorSummary {
    const now = Date.now();
    const windowStart = now - this.ERROR_RATE_WINDOW;
    const recentErrors = this.errors.filter(e => e.timestamp > windowStart);
    
    return {
      totalErrors: recentErrors.length,
      errorRate: this.calculateErrorRate(),
      errorsByType: this.groupErrorsByType(recentErrors),
      errorsByOperation: this.groupErrorsByOperation(recentErrors),
      criticalErrors: recentErrors.filter(e => this.isCriticalError(e))
    };
  }
  
  private static isCriticalError(error: Error | ErrorMetric): boolean {
    const criticalPatterns = [
      'ECONNREFUSED',
      'INVALID_CREDENTIALS',
      'RATE_LIMIT_EXCEEDED',
      'INSUFFICIENT_PERMISSIONS'
    ];
    
    const message = error instanceof Error ? error.message : error.errorMessage;
    return criticalPatterns.some(pattern => message.includes(pattern));
  }
}
```

### Resource Monitoring

#### System Resource Tracking

```typescript
// src/utils/resource-monitor.ts
interface ResourceMetrics {
  timestamp: number;
  cpu: {
    usage: number;
    loadAverage: number[];
  };
  memory: {
    used: number;
    free: number;
    total: number;
    heapUsed: number;
    heapTotal: number;
  };
  network: {
    bytesReceived: number;
    bytesSent: number;
    connectionsActive: number;
  };
  process: {
    pid: number;
    uptime: number;
    handles: number;
  };
}

class ResourceMonitor {
  private static metrics: ResourceMetrics[] = [];
  private static monitoringInterval: NodeJS.Timeout | null = null;
  
  static startMonitoring(intervalMs: number = 30000): void {
    if (this.monitoringInterval) return;
    
    this.monitoringInterval = setInterval(() => {
      this.collectMetrics();
    }, intervalMs);
    
    // Initial collection
    this.collectMetrics();
  }
  
  static stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }
  
  private static collectMetrics(): void {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    const metric: ResourceMetrics = {
      timestamp: Date.now(),
      cpu: {
        usage: this.calculateCPUUsage(cpuUsage),
        loadAverage: require('os').loadavg()
      },
      memory: {
        used: memUsage.heapUsed,
        free: require('os').freemem(),
        total: require('os').totalmem(),
        heapUsed: memUsage.heapUsed,
        heapTotal: memUsage.heapTotal
      },
      network: {
        bytesReceived: 0, // Would need external library for actual network stats
        bytesSent: 0,
        connectionsActive: 0
      },
      process: {
        pid: process.pid,
        uptime: process.uptime(),
        handles: (process as any)._getActiveHandles().length
      }
    };
    
    this.metrics.push(metric);
    
    // Keep only last hour of metrics
    const oneHourAgo = Date.now() - 3600000;
    this.metrics = this.metrics.filter(m => m.timestamp > oneHourAgo);
    
    // Check thresholds
    this.checkResourceThresholds(metric);
  }
  
  private static checkResourceThresholds(metric: ResourceMetrics): void {
    const memoryUsagePercent = (metric.memory.heapUsed / metric.memory.heapTotal) * 100;
    
    if (memoryUsagePercent > 80) {
      AlertManager.sendAlert({
        type: 'resource',
        severity: 'warning',
        message: `High memory usage: ${memoryUsagePercent.toFixed(1)}%`,
        details: metric
      });
    }
    
    if (metric.cpu.usage > 80) {
      AlertManager.sendAlert({
        type: 'resource',
        severity: 'warning',
        message: `High CPU usage: ${metric.cpu.usage.toFixed(1)}%`,
        details: metric
      });
    }
  }
}
```

## Infrastructure Monitoring

### Health Check Implementation

```typescript
// src/utils/health-monitor.ts
interface HealthCheck {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime: number;
  lastChecked: string;
  details?: any;
  error?: string;
}

interface SystemHealth {
  overall: 'healthy' | 'degraded' | 'unhealthy';
  checks: HealthCheck[];
  timestamp: string;
  uptime: number;
  version: string;
}

class HealthMonitor {
  private static checks: Map<string, () => Promise<HealthCheck>> = new Map();
  
  static registerHealthCheck(
    name: string,
    checkFunction: () => Promise<HealthCheck>
  ): void {
    this.checks.set(name, checkFunction);
  }
  
  static async performHealthCheck(): Promise<SystemHealth> {
    const startTime = Date.now();
    const results: HealthCheck[] = [];
    
    // Run all health checks in parallel
    const checkPromises = Array.from(this.checks.entries()).map(
      async ([name, checkFn]) => {
        try {
          return await Promise.race([
            checkFn(),
            new Promise<HealthCheck>((_, reject) =>
              setTimeout(() => reject(new Error('Health check timeout')), 5000)
            )
          ]);
        } catch (error) {
          return {
            name,
            status: 'unhealthy' as const,
            responseTime: Date.now() - startTime,
            lastChecked: new Date().toISOString(),
            error: error.message
          };
        }
      }
    );
    
    const checkResults = await Promise.all(checkPromises);
    results.push(...checkResults);
    
    // Determine overall health
    const overallStatus = this.calculateOverallHealth(results);
    
    return {
      overall: overallStatus,
      checks: results,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0'
    };
  }
  
  private static calculateOverallHealth(checks: HealthCheck[]): 'healthy' | 'degraded' | 'unhealthy' {
    const unhealthyCount = checks.filter(c => c.status === 'unhealthy').length;
    const degradedCount = checks.filter(c => c.status === 'degraded').length;
    
    if (unhealthyCount > 0) return 'unhealthy';
    if (degradedCount > 0) return 'degraded';
    return 'healthy';
  }
}

// Register standard health checks
HealthMonitor.registerHealthCheck('trello-api', async () => {
  const startTime = Date.now();
  
  try {
    const response = await fetch('https://api.trello.com/1/members/me', {
      headers: {
        'Authorization': `OAuth oauth_consumer_key="${process.env.TRELLO_API_KEY}", oauth_token="${process.env.TRELLO_TOKEN}"`
      },
      timeout: 3000
    });
    
    const responseTime = Date.now() - startTime;
    
    return {
      name: 'trello-api',
      status: response.ok ? 'healthy' : 'degraded',
      responseTime,
      lastChecked: new Date().toISOString(),
      details: {
        statusCode: response.status,
        rateLimitRemaining: response.headers.get('x-rate-limit-api-key-remaining')
      }
    };
  } catch (error) {
    return {
      name: 'trello-api',
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      lastChecked: new Date().toISOString(),
      error: error.message
    };
  }
});

HealthMonitor.registerHealthCheck('memory', async () => {
  const memUsage = process.memoryUsage();
  const heapUsedPercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
  
  let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
  if (heapUsedPercent > 90) status = 'unhealthy';
  else if (heapUsedPercent > 75) status = 'degraded';
  
  return {
    name: 'memory',
    status,
    responseTime: 0,
    lastChecked: new Date().toISOString(),
    details: {
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
      heapUsedPercent: Math.round(heapUsedPercent)
    }
  };
});
```

## Alerting System

### Alert Manager

```typescript
// src/utils/alert-manager.ts
interface Alert {
  type: 'performance' | 'error' | 'resource' | 'security' | 'business';
  severity: 'info' | 'warning' | 'critical';
  message: string;
  details?: any;
  timestamp?: string;
  source?: string;
}

interface AlertRule {
  name: string;
  condition: (metric: any) => boolean;
  alert: Omit<Alert, 'timestamp'>;
  cooldown: number; // Minimum time between alerts (ms)
  enabled: boolean;
}

class AlertManager {
  private static rules: Map<string, AlertRule> = new Map();
  private static lastAlertTimes: Map<string, number> = new Map();
  private static webhooks: string[] = [];
  
  static addWebhook(url: string): void {
    this.webhooks.push(url);
  }
  
  static registerAlertRule(rule: AlertRule): void {
    this.rules.set(rule.name, rule);
  }
  
  static async sendAlert(alert: Alert): Promise<void> {
    const fullAlert: Alert = {
      ...alert,
      timestamp: new Date().toISOString(),
      source: 'trello-desktop-mcp'
    };
    
    // Log alert locally
    console.warn('ALERT:', JSON.stringify(fullAlert, null, 2));
    
    // Send to external systems
    await Promise.all([
      this.sendToWebhooks(fullAlert),
      this.logToFile(fullAlert),
      this.sendToSlack(fullAlert), // If configured
      this.sendToEmail(fullAlert)  // If configured
    ]);
  }
  
  static checkAlertRules(metrics: any): void {
    for (const [name, rule] of this.rules) {
      if (!rule.enabled) continue;
      
      const lastAlertTime = this.lastAlertTimes.get(name) || 0;
      const now = Date.now();
      
      // Check cooldown
      if (now - lastAlertTime < rule.cooldown) continue;
      
      // Check condition
      if (rule.condition(metrics)) {
        this.sendAlert(rule.alert);
        this.lastAlertTimes.set(name, now);
      }
    }
  }
  
  private static async sendToWebhooks(alert: Alert): Promise<void> {
    const promises = this.webhooks.map(async (webhook) => {
      try {
        await fetch(webhook, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(alert)
        });
      } catch (error) {
        console.error('Failed to send webhook alert:', error);
      }
    });
    
    await Promise.allSettled(promises);
  }
  
  private static async logToFile(alert: Alert): Promise<void> {
    const logLine = `${alert.timestamp} [${alert.severity.toUpperCase()}] ${alert.type}: ${alert.message}\n`;
    
    try {
      const fs = require('fs').promises;
      await fs.appendFile('/var/log/trello-mcp/alerts.log', logLine);
    } catch (error) {
      console.error('Failed to log alert to file:', error);
    }
  }
}

// Register common alert rules
AlertManager.registerAlertRule({
  name: 'high-error-rate',
  condition: (metrics) => metrics.errorRate > 0.05, // 5%
  alert: {
    type: 'error',
    severity: 'warning',
    message: 'High error rate detected'
  },
  cooldown: 300000, // 5 minutes
  enabled: true
});

AlertManager.registerAlertRule({
  name: 'slow-response-time',
  condition: (metrics) => metrics.averageResponseTime > 5000, // 5 seconds
  alert: {
    type: 'performance',
    severity: 'warning',
    message: 'Slow response times detected'
  },
  cooldown: 600000, // 10 minutes
  enabled: true
});
```

## Dashboards and Visualization

### Metrics Dashboard

```typescript
// src/utils/dashboard.ts
interface DashboardData {
  performance: {
    averageResponseTime: number;
    p95ResponseTime: number;
    requestsPerMinute: number;
    errorRate: number;
  };
  resources: {
    memoryUsage: number;
    cpuUsage: number;
    uptime: number;
  };
  business: {
    dailyActiveUsers: number;
    toolUsageStats: Record<string, number>;
    apiQuotaUsage: number;
  };
  health: {
    overallStatus: string;
    unhealthyServices: number;
    lastIncident: string;
  };
}

class DashboardGenerator {
  static async generateDashboard(): Promise<string> {
    const data = await this.collectDashboardData();
    
    return `# Trello Desktop MCP Dashboard

## 📊 Performance Metrics
- **Average Response Time**: ${data.performance.averageResponseTime}ms
- **95th Percentile**: ${data.performance.p95ResponseTime}ms
- **Requests/Minute**: ${data.performance.requestsPerMinute}
- **Error Rate**: ${(data.performance.errorRate * 100).toFixed(2)}%

## 💾 Resource Usage
- **Memory**: ${data.resources.memoryUsage}MB
- **CPU**: ${data.resources.cpuUsage.toFixed(1)}%
- **Uptime**: ${Math.floor(data.resources.uptime / 3600)}h ${Math.floor((data.resources.uptime % 3600) / 60)}m

## 👥 Business Metrics
- **Daily Active Users**: ${data.business.dailyActiveUsers}
- **API Quota Used**: ${data.business.apiQuotaUsage}%
- **Most Used Tool**: ${this.getMostUsedTool(data.business.toolUsageStats)}

## 🏥 System Health
- **Overall Status**: ${this.getStatusEmoji(data.health.overallStatus)} ${data.health.overallStatus}
- **Unhealthy Services**: ${data.health.unhealthyServices}
- **Last Incident**: ${data.health.lastIncident}

## 📈 Trends
${await this.generateTrendData()}

*Last Updated: ${new Date().toISOString()}*
`;
  }
  
  private static async collectDashboardData(): Promise<DashboardData> {
    const [performance, resources, health] = await Promise.all([
      PerformanceMonitor.getMetricsSummary(),
      ResourceMonitor.getCurrentMetrics(),
      HealthMonitor.performHealthCheck()
    ]);
    
    return {
      performance: {
        averageResponseTime: performance.averageResponseTime,
        p95ResponseTime: performance.p95ResponseTime,
        requestsPerMinute: performance.requestsPerMinute,
        errorRate: performance.errorRate
      },
      resources: {
        memoryUsage: Math.round(resources.memory.heapUsed / 1024 / 1024),
        cpuUsage: resources.cpu.usage,
        uptime: resources.process.uptime
      },
      business: {
        dailyActiveUsers: await this.getDailyActiveUsers(),
        toolUsageStats: await this.getToolUsageStats(),
        apiQuotaUsage: await this.getAPIQuotaUsage()
      },
      health: {
        overallStatus: health.overall,
        unhealthyServices: health.checks.filter(c => c.status === 'unhealthy').length,
        lastIncident: await this.getLastIncident()
      }
    };
  }
  
  private static getStatusEmoji(status: string): string {
    switch (status) {
      case 'healthy': return '🟢';
      case 'degraded': return '🟡';
      case 'unhealthy': return '🔴';
      default: return '⚫';
    }
  }
}
```

### Prometheus Integration

```typescript
// src/utils/prometheus-metrics.ts
import client from 'prom-client';

// Register custom metrics
const httpRequestDuration = new client.Histogram({
  name: 'trello_mcp_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5, 10, 30]
});

const trelloAPICallsTotal = new client.Counter({
  name: 'trello_mcp_api_calls_total',
  help: 'Total number of Trello API calls',
  labelNames: ['endpoint', 'status', 'tool']
});

const toolExecutionDuration = new client.Histogram({
  name: 'trello_mcp_tool_execution_duration_seconds',
  help: 'Duration of tool executions',
  labelNames: ['tool_name', 'success'],
  buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60]
});

const rateLimitRemaining = new client.Gauge({
  name: 'trello_mcp_rate_limit_remaining',
  help: 'Remaining Trello API rate limit'
});

const activeUsers = new client.Gauge({
  name: 'trello_mcp_active_users',
  help: 'Number of active users'
});

const errorRate = new client.Gauge({
  name: 'trello_mcp_error_rate',
  help: 'Current error rate'
});

// Collect default metrics
client.collectDefaultMetrics({
  prefix: 'trello_mcp_',
  timeout: 5000,
  gcDurationBuckets: [0.001, 0.01, 0.1, 1, 2, 5]
});

export class PrometheusMetrics {
  static recordAPICall(endpoint: string, status: string, duration: number, tool: string): void {
    trelloAPICallsTotal.inc({ endpoint, status, tool });
    httpRequestDuration.observe({ method: 'GET', route: endpoint, status_code: status }, duration / 1000);
  }
  
  static recordToolExecution(toolName: string, duration: number, success: boolean): void {
    toolExecutionDuration.observe({ tool_name: toolName, success: success.toString() }, duration / 1000);
  }
  
  static updateRateLimit(remaining: number): void {
    rateLimitRemaining.set(remaining);
  }
  
  static updateActiveUsers(count: number): void {
    activeUsers.set(count);
  }
  
  static updateErrorRate(rate: number): void {
    errorRate.set(rate);
  }
  
  static getMetrics(): string {
    return client.register.metrics();
  }
}

// Metrics collection endpoint
export function setupMetricsEndpoint(app: any): void {
  app.get('/metrics', (req, res) => {
    res.set('Content-Type', client.register.contentType);
    res.end(PrometheusMetrics.getMetrics());
  });
}
```

## Log Management

### Structured Logging

```typescript
// src/utils/structured-logger.ts
import winston from 'winston';

interface LogContext {
  operation?: string;
  userId?: string;
  traceId?: string;
  duration?: number;
  metadata?: Record<string, any>;
}

class StructuredLogger {
  private logger: winston.Logger;
  
  constructor() {
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json(),
        winston.format.metadata({ fillExcept: ['message', 'level', 'timestamp'] })
      ),
      defaultMeta: {
        service: 'trello-desktop-mcp',
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development'
      },
      transports: [
        // Error log
        new winston.transports.File({
          filename: '/var/log/trello-mcp/error.log',
          level: 'error',
          maxsize: 10485760, // 10MB
          maxFiles: 5,
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json()
          )
        }),
        
        // Combined log
        new winston.transports.File({
          filename: '/var/log/trello-mcp/combined.log',
          maxsize: 10485760,
          maxFiles: 10,
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json()
          )
        }),
        
        // Console (development only)
        ...(process.env.NODE_ENV !== 'production' ? [
          new winston.transports.Console({
            format: winston.format.combine(
              winston.format.colorize(),
              winston.format.simple()
            )
          })
        ] : [])
      ]
    });
  }
  
  logToolExecution(toolName: string, duration: number, success: boolean, context?: LogContext): void {
    this.logger.info('Tool execution', {
      type: 'tool_execution',
      toolName,
      duration,
      success,
      ...context
    });
  }
  
  logAPICall(endpoint: string, duration: number, status: number, context?: LogContext): void {
    this.logger.info('API call', {
      type: 'api_call',
      endpoint,
      duration,
      status,
      ...context
    });
  }
  
  logSecurityEvent(event: string, severity: 'low' | 'medium' | 'high', context?: LogContext): void {
    this.logger.warn('Security event', {
      type: 'security_event',
      event,
      severity,
      ...context
    });
  }
  
  logBusinessMetric(metric: string, value: number, context?: LogContext): void {
    this.logger.info('Business metric', {
      type: 'business_metric',
      metric,
      value,
      ...context
    });
  }
}

export const structuredLogger = new StructuredLogger();
```

## Monitoring Best Practices

### 1. Monitoring Levels

#### Application Level
- **Response Times**: Track API and tool execution times
- **Error Rates**: Monitor failure rates by operation type
- **Throughput**: Measure requests per second/minute
- **User Experience**: Track user-facing performance metrics

#### Infrastructure Level
- **Resource Usage**: CPU, memory, disk, network
- **System Health**: Process status, connectivity
- **Dependencies**: External service availability
- **Capacity**: Current vs. maximum utilization

#### Business Level
- **Usage Patterns**: Tool popularity, user activity
- **API Quotas**: Trello API usage vs. limits
- **Performance Impact**: Business process efficiency
- **User Satisfaction**: Implicit satisfaction metrics

### 2. Alert Strategy

#### Alert Hierarchy
1. **Critical**: Service down, data loss, security breach
2. **Warning**: Performance degradation, high error rates
3. **Info**: Capacity planning, trend notifications

#### Alert Fatigue Prevention
- **Meaningful Thresholds**: Set realistic alert levels
- **Contextual Alerts**: Include relevant context and remediation steps
- **Alert Grouping**: Bundle related alerts to reduce noise
- **Progressive Escalation**: Escalate unresolved alerts

### 3. Dashboard Design

#### Key Principles
- **At-a-Glance Status**: Overall health visible immediately
- **Drill-Down Capability**: Ability to investigate details
- **Time-Based Views**: Multiple time horizons (real-time, daily, weekly)
- **Actionable Information**: Include remediation guidance

#### Dashboard Hierarchy
1. **Executive Dashboard**: High-level business metrics
2. **Operational Dashboard**: System health and performance
3. **Technical Dashboard**: Detailed metrics for troubleshooting

## Integration Examples

### Grafana Dashboard

```json
{
  "dashboard": {
    "title": "Trello Desktop MCP Monitoring",
    "panels": [
      {
        "title": "Request Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(trello_mcp_api_calls_total[5m])",
            "legendFormat": "{{tool}} - {{status}}"
          }
        ]
      },
      {
        "title": "Response Time",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(trello_mcp_tool_execution_duration_seconds_bucket[5m]))",
            "legendFormat": "95th percentile"
          }
        ]
      },
      {
        "title": "Error Rate",
        "type": "singlestat",
        "targets": [
          {
            "expr": "trello_mcp_error_rate",
            "legendFormat": "Error Rate"
          }
        ],
        "thresholds": "5,10"
      }
    ]
  }
}
```

### Slack Integration

```typescript
// src/utils/slack-integration.ts
class SlackIntegration {
  private static webhookURL = process.env.SLACK_WEBHOOK_URL;
  
  static async sendAlert(alert: Alert): Promise<void> {
    if (!this.webhookURL) return;
    
    const color = alert.severity === 'critical' ? 'danger' :
                  alert.severity === 'warning' ? 'warning' : 'good';
    
    const payload = {
      text: `🚨 Trello MCP Alert`,
      attachments: [
        {
          color,
          title: alert.message,
          fields: [
            {
              title: 'Type',
              value: alert.type,
              short: true
            },
            {
              title: 'Severity',
              value: alert.severity,
              short: true
            },
            {
              title: 'Time',
              value: alert.timestamp,
              short: false
            }
          ]
        }
      ]
    };
    
    try {
      await fetch(this.webhookURL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (error) {
      console.error('Failed to send Slack alert:', error);
    }
  }
}
```

---

**Next Steps**:
- Review [Performance](Performance) for optimization strategies
- Check [Security](Security) for security monitoring
- Explore [Deployment](Deployment) for production monitoring setup