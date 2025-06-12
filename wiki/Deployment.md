# Deployment Guide

This comprehensive guide covers deploying Trello Desktop MCP in various environments, from development to production.

## Deployment Overview

### Deployment Scenarios

| Scenario | Use Case | Complexity | Security Requirements |
|----------|----------|------------|----------------------|
| **Personal Desktop** | Individual productivity | Low | Basic credential security |
| **Team Shared** | Small team collaboration | Medium | Token rotation, access control |
| **Enterprise** | Large organization | High | Full security compliance |
| **CI/CD Integration** | Automated workflows | Medium | Service account management |

### Architecture Considerations

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Claude Desktop│    │   MCP Server    │    │   Trello API    │
│                 │    │                 │    │                 │
│  - Local Config │◄──►│  - Node.js App  │◄──►│  - REST API     │
│  - Credentials  │    │  - TypeScript   │    │  - Rate Limits  │
│  - User Context │    │  - Error Handling│    │  - Authentication│
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Monitoring    │    │   Logging       │    │   Backup        │
│  - Performance  │    │  - Audit Trail  │    │  - Configuration│
│  - Health Check │    │  - Error Logs   │    │  - Credentials  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Environment Preparation

### System Requirements

#### Minimum Requirements
- **Node.js**: 18.0.0 or higher
- **Memory**: 512MB available RAM
- **Storage**: 100MB free disk space
- **Network**: Stable internet connection (HTTPS access to api.trello.com)

#### Recommended Specifications
- **Node.js**: 20.x LTS
- **Memory**: 1GB available RAM
- **Storage**: 1GB free disk space
- **CPU**: 2+ cores for concurrent operations

#### Production Requirements
- **Node.js**: Latest LTS version
- **Memory**: 2GB+ available RAM
- **Storage**: 5GB+ free disk space
- **CPU**: 4+ cores for high throughput
- **Monitoring**: Application performance monitoring
- **Backup**: Automated configuration backup

### Environment Setup

#### Development Environment

```bash
# 1. Install Node.js via Node Version Manager (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 20
nvm use 20

# 2. Clone and setup project
git clone https://github.com/kocakli/trello-desktop-mcp.git
cd trello-desktop-mcp
npm install

# 3. Setup development configuration
cp .env.example .env.development
# Edit .env.development with development credentials

# 4. Build for development
npm run build

# 5. Test configuration
npm run type-check
node dist/index.js --test-config
```

#### Production Environment

```bash
# 1. Production Node.js setup
# Use official Node.js Docker image or system package manager
# Ensure Node.js is installed system-wide

# 2. Create dedicated user (Linux/macOS)
sudo useradd -r -s /bin/false trello-mcp
sudo mkdir -p /opt/trello-desktop-mcp
sudo chown trello-mcp:trello-mcp /opt/trello-desktop-mcp

# 3. Deploy application
sudo -u trello-mcp git clone https://github.com/kocakli/trello-desktop-mcp.git /opt/trello-desktop-mcp
cd /opt/trello-desktop-mcp
sudo -u trello-mcp npm ci --production
sudo -u trello-mcp npm run build

# 4. Setup production configuration
sudo -u trello-mcp cp config/production.json /opt/trello-desktop-mcp/config/
# Configure production credentials securely
```

## Configuration Management

### Environment-Specific Configuration

#### Development Configuration

```json
{
  "mcpServers": {
    "trello-dev": {
      "command": "node",
      "args": ["/path/to/dev/trello-desktop-mcp/dist/index.js"],
      "env": {
        "TRELLO_API_KEY": "dev-api-key",
        "TRELLO_TOKEN": "dev-token",
        "LOG_LEVEL": "debug",
        "REQUEST_TIMEOUT": "10000",
        "MAX_RETRY_ATTEMPTS": "2"
      }
    }
  }
}
```

#### Staging Configuration

```json
{
  "mcpServers": {
    "trello-staging": {
      "command": "node",
      "args": ["/path/to/staging/trello-desktop-mcp/dist/index.js"],
      "env": {
        "TRELLO_API_KEY": "staging-api-key",
        "TRELLO_TOKEN": "staging-token",
        "LOG_LEVEL": "info",
        "REQUEST_TIMEOUT": "15000",
        "MAX_RETRY_ATTEMPTS": "3",
        "PERFORMANCE_MONITORING": "true"
      }
    }
  }
}
```

#### Production Configuration

```json
{
  "mcpServers": {
    "trello": {
      "command": "node",
      "args": ["/opt/trello-desktop-mcp/dist/index.js"],
      "env": {
        "TRELLO_API_KEY": "production-api-key",
        "TRELLO_TOKEN": "production-token",
        "LOG_LEVEL": "warn",
        "REQUEST_TIMEOUT": "30000",
        "MAX_RETRY_ATTEMPTS": "5",
        "PERFORMANCE_MONITORING": "true",
        "HEALTH_CHECK_ENABLED": "true",
        "TELEMETRY_ENABLED": "true"
      }
    }
  }
}
```

### Credential Management

#### Secure Credential Storage

```bash
# 1. Environment variable approach (recommended)
export TRELLO_API_KEY="$(cat /secure/path/to/api-key)"
export TRELLO_TOKEN="$(cat /secure/path/to/token)"

# 2. Secure configuration file
# Store credentials in restricted access file
sudo mkdir -p /etc/trello-mcp
sudo chmod 700 /etc/trello-mcp
echo "TRELLO_API_KEY=your-key" | sudo tee /etc/trello-mcp/credentials
echo "TRELLO_TOKEN=your-token" | sudo tee -a /etc/trello-mcp/credentials
sudo chmod 600 /etc/trello-mcp/credentials
sudo chown trello-mcp:trello-mcp /etc/trello-mcp/credentials

# 3. Load in Claude Desktop config
source /etc/trello-mcp/credentials
```

#### Credential Rotation

```bash
#!/bin/bash
# credential-rotation.sh - Automated credential rotation

# 1. Generate new token
NEW_TOKEN=$(curl -s "https://trello.com/1/authorize?..." | extract_token)

# 2. Test new token
if test_token "$NEW_TOKEN"; then
    # 3. Update configuration
    update_claude_config "$NEW_TOKEN"
    
    # 4. Restart Claude Desktop
    restart_claude_desktop
    
    # 5. Verify functionality
    if test_functionality; then
        # 6. Archive old token
        archive_old_token "$OLD_TOKEN"
        echo "Token rotation successful"
    else
        # 7. Rollback on failure
        rollback_token "$OLD_TOKEN"
        echo "Token rotation failed, rolled back"
    fi
else
    echo "New token validation failed"
fi
```

## Container Deployment

### Docker Configuration

#### Dockerfile

```dockerfile
# Production Dockerfile
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY src/ ./src/

# Build application
RUN npm run build

# Production stage
FROM node:20-alpine AS production

# Create app user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S trello-mcp -u 1001

# Set working directory
WORKDIR /app

# Copy built application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

# Change ownership
RUN chown -R trello-mcp:nodejs /app

# Switch to non-root user
USER trello-mcp

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "console.log('Health check passed')" || exit 1

# Expose port (if needed for monitoring)
EXPOSE 3000

# Start application
CMD ["node", "dist/index.js"]
```

#### Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  trello-mcp:
    build: .
    container_name: trello-desktop-mcp
    restart: unless-stopped
    
    environment:
      - NODE_ENV=production
      - LOG_LEVEL=info
      - REQUEST_TIMEOUT=30000
      - MAX_RETRY_ATTEMPTS=5
    
    env_file:
      - .env.production
    
    volumes:
      - ./logs:/app/logs
      - ./config:/app/config:ro
    
    networks:
      - trello-network
    
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
    
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '0.5'
        reservations:
          memory: 256M
          cpus: '0.25'

  # Monitoring (optional)
  prometheus:
    image: prom/prometheus:latest
    container_name: prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
    networks:
      - trello-network

networks:
  trello-network:
    driver: bridge
```

### Kubernetes Deployment

#### Deployment Configuration

```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: trello-desktop-mcp
  namespace: productivity-tools
  labels:
    app: trello-mcp
    version: v1.0.0
spec:
  replicas: 3
  selector:
    matchLabels:
      app: trello-mcp
  template:
    metadata:
      labels:
        app: trello-mcp
    spec:
      serviceAccountName: trello-mcp
      containers:
      - name: trello-mcp
        image: trello-desktop-mcp:1.0.0
        ports:
        - containerPort: 3000
        
        env:
        - name: NODE_ENV
          value: "production"
        - name: LOG_LEVEL
          value: "info"
        - name: TRELLO_API_KEY
          valueFrom:
            secretKeyRef:
              name: trello-credentials
              key: api-key
        - name: TRELLO_TOKEN
          valueFrom:
            secretKeyRef:
              name: trello-credentials
              key: token
        
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 30
        
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5

---
apiVersion: v1
kind: Service
metadata:
  name: trello-mcp-service
  namespace: productivity-tools
spec:
  selector:
    app: trello-mcp
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
  type: ClusterIP
```

#### Secrets Management

```yaml
# k8s/secrets.yaml
apiVersion: v1
kind: Secret
metadata:
  name: trello-credentials
  namespace: productivity-tools
type: Opaque
data:
  api-key: <base64-encoded-api-key>
  token: <base64-encoded-token>

---
apiVersion: v1
kind: ServiceAccount
metadata:
  name: trello-mcp
  namespace: productivity-tools
```

## Monitoring and Observability

### Health Monitoring

#### Health Check Implementation

```typescript
// src/utils/health.ts
interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  uptime: number;
  dependencies: DependencyHealth[];
  performance: PerformanceMetrics;
}

export class HealthMonitor {
  static async checkHealth(): Promise<HealthStatus> {
    const startTime = Date.now();
    
    try {
      // Check Trello API connectivity
      const trelloHealth = await this.checkTrelloAPI();
      
      // Check system resources
      const systemHealth = await this.checkSystemResources();
      
      // Check performance metrics
      const performance = await this.getPerformanceMetrics();
      
      const status = this.calculateOverallHealth([trelloHealth, systemHealth]);
      
      return {
        status,
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
        uptime: process.uptime(),
        dependencies: [trelloHealth, systemHealth],
        performance
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
        uptime: process.uptime(),
        dependencies: [],
        performance: this.getEmptyMetrics()
      };
    }
  }
  
  private static async checkTrelloAPI(): Promise<DependencyHealth> {
    const startTime = Date.now();
    
    try {
      const response = await fetch('https://api.trello.com/1/members/me', {
        method: 'GET',
        headers: {
          'Authorization': `OAuth oauth_consumer_key="${process.env.TRELLO_API_KEY}", oauth_token="${process.env.TRELLO_TOKEN}"`
        },
        timeout: 5000
      });
      
      const responseTime = Date.now() - startTime;
      
      return {
        name: 'Trello API',
        status: response.ok ? 'healthy' : 'degraded',
        responseTime,
        lastChecked: new Date().toISOString(),
        metadata: {
          statusCode: response.status,
          rateLimitRemaining: response.headers.get('x-rate-limit-api-key-remaining')
        }
      };
    } catch (error) {
      return {
        name: 'Trello API',
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        lastChecked: new Date().toISOString(),
        error: error.message
      };
    }
  }
}

// Health check endpoint (if running as HTTP server)
export function setupHealthEndpoints(app: any) {
  app.get('/health', async (req, res) => {
    const health = await HealthMonitor.checkHealth();
    const statusCode = health.status === 'healthy' ? 200 : 
                      health.status === 'degraded' ? 200 : 503;
    
    res.status(statusCode).json(health);
  });
  
  app.get('/ready', async (req, res) => {
    const health = await HealthMonitor.checkHealth();
    const ready = health.status !== 'unhealthy';
    
    res.status(ready ? 200 : 503).json({ ready });
  });
}
```

### Logging Configuration

#### Production Logging

```typescript
// src/utils/production-logger.ts
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: {
    service: 'trello-desktop-mcp',
    version: process.env.npm_package_version
  },
  transports: [
    // File transport for persistent logs
    new winston.transports.File({
      filename: '/var/log/trello-mcp/error.log',
      level: 'error',
      maxsize: 10485760, // 10MB
      maxFiles: 5
    }),
    
    new winston.transports.File({
      filename: '/var/log/trello-mcp/combined.log',
      maxsize: 10485760,
      maxFiles: 10
    }),
    
    // Console transport for development
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

// Structured logging for security events
export function logSecurityEvent(event: SecurityEvent) {
  logger.warn('Security event', {
    type: 'security',
    event: event.type,
    action: event.action,
    success: event.success,
    timestamp: event.timestamp,
    metadata: event.metadata
  });
}

// Performance logging
export function logPerformanceMetric(metric: PerformanceMetric) {
  logger.info('Performance metric', {
    type: 'performance',
    operation: metric.operation,
    duration: metric.duration,
    success: metric.success,
    timestamp: new Date().toISOString()
  });
}
```

### Metrics Collection

#### Prometheus Integration

```typescript
// src/utils/metrics.ts
import client from 'prom-client';

// Create custom metrics
const httpRequestDuration = new client.Histogram({
  name: 'trello_mcp_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'endpoint', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5, 10]
});

const trelloApiCallsTotal = new client.Counter({
  name: 'trello_api_calls_total',
  help: 'Total number of Trello API calls',
  labelNames: ['endpoint', 'status']
});

const rateLimitRemaining = new client.Gauge({
  name: 'trello_rate_limit_remaining',
  help: 'Remaining Trello API rate limit'
});

const activeConnections = new client.Gauge({
  name: 'trello_mcp_active_connections',
  help: 'Number of active MCP connections'
});

// Register default metrics
client.register.setDefaultLabels({
  app: 'trello-desktop-mcp',
  version: process.env.npm_package_version || '1.0.0'
});

// Collect default metrics
client.collectDefaultMetrics();

export class MetricsCollector {
  static recordAPICall(endpoint: string, status: string, duration: number) {
    trelloApiCallsTotal.inc({ endpoint, status });
    httpRequestDuration.observe({ 
      method: 'GET', 
      endpoint, 
      status_code: status 
    }, duration / 1000);
  }
  
  static updateRateLimitRemaining(remaining: number) {
    rateLimitRemaining.set(remaining);
  }
  
  static updateActiveConnections(count: number) {
    activeConnections.set(count);
  }
  
  static getMetrics(): string {
    return client.register.metrics();
  }
}
```

## Backup and Recovery

### Configuration Backup

```bash
#!/bin/bash
# backup-config.sh - Backup configuration and secrets

BACKUP_DIR="/backup/trello-mcp/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

# Backup Claude Desktop configuration (sanitized)
cp ~/.claude/claude_desktop_config.json "$BACKUP_DIR/claude_config_backup.json"

# Remove credentials from backup
jq 'del(.mcpServers.trello.env.TRELLO_API_KEY, .mcpServers.trello.env.TRELLO_TOKEN)' \
   "$BACKUP_DIR/claude_config_backup.json" > "$BACKUP_DIR/claude_config_sanitized.json"

# Backup application configuration
cp /opt/trello-desktop-mcp/config/* "$BACKUP_DIR/"

# Backup logs (last 7 days)
find /var/log/trello-mcp -name "*.log" -mtime -7 -exec cp {} "$BACKUP_DIR/" \;

# Create backup manifest
cat > "$BACKUP_DIR/manifest.json" << EOF
{
  "backup_time": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "version": "$(cat /opt/trello-desktop-mcp/package.json | jq -r .version)",
  "environment": "${NODE_ENV:-development}",
  "files": $(ls -la "$BACKUP_DIR" | jq -R . | jq -s .)
}
EOF

echo "Backup completed: $BACKUP_DIR"
```

### Disaster Recovery

#### Recovery Procedure

```bash
#!/bin/bash
# disaster-recovery.sh - Disaster recovery procedure

RECOVERY_PLAN="
1. Stop all services
2. Restore configuration from backup
3. Validate configuration
4. Restart services
5. Verify functionality
"

echo "Starting disaster recovery process..."

# 1. Stop services
systemctl stop claude-desktop
docker-compose down  # If using Docker

# 2. Restore configuration
BACKUP_PATH="$1"
if [ -z "$BACKUP_PATH" ]; then
    echo "Usage: $0 <backup_path>"
    exit 1
fi

# Restore Claude Desktop configuration
cp "$BACKUP_PATH/claude_config_backup.json" ~/.claude/claude_desktop_config.json

# Restore application configuration
cp "$BACKUP_PATH"/*.json /opt/trello-desktop-mcp/config/

# 3. Validate configuration
if ! validate_configuration; then
    echo "Configuration validation failed"
    exit 1
fi

# 4. Restart services
systemctl start claude-desktop
docker-compose up -d  # If using Docker

# 5. Verify functionality
sleep 10
if ! test_functionality; then
    echo "Functionality test failed"
    exit 1
fi

echo "Disaster recovery completed successfully"
```

## Scaling and High Availability

### Load Balancing

```yaml
# Load balancer configuration for multiple instances
apiVersion: v1
kind: ConfigMap
metadata:
  name: nginx-config
data:
  nginx.conf: |
    upstream trello_mcp {
        least_conn;
        server trello-mcp-1:3000 max_fails=3 fail_timeout=30s;
        server trello-mcp-2:3000 max_fails=3 fail_timeout=30s;
        server trello-mcp-3:3000 max_fails=3 fail_timeout=30s;
    }
    
    server {
        listen 80;
        
        location /health {
            proxy_pass http://trello_mcp;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }
        
        location / {
            proxy_pass http://trello_mcp;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_connect_timeout 5s;
            proxy_send_timeout 30s;
            proxy_read_timeout 30s;
        }
    }
```

### Auto-scaling

```yaml
# Horizontal Pod Autoscaler
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: trello-mcp-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: trello-desktop-mcp
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Percent
        value: 10
        periodSeconds: 60
    scaleUp:
      stabilizationWindowSeconds: 60
      policies:
      - type: Percent
        value: 50
        periodSeconds: 30
```

## Security Hardening

### Production Security Checklist

- [ ] **Credentials**: Stored in secure secret management system
- [ ] **Access Control**: Principle of least privilege applied
- [ ] **Network Security**: TLS encryption for all communications
- [ ] **Container Security**: Non-root user, minimal base image
- [ ] **Monitoring**: Security event logging and alerting
- [ ] **Updates**: Regular security updates and patches
- [ ] **Backup**: Encrypted backups with access controls
- [ ] **Incident Response**: Security incident response procedures

### Security Configuration

```yaml
# Security-hardened Pod Security Policy
apiVersion: policy/v1beta1
kind: PodSecurityPolicy
metadata:
  name: trello-mcp-psp
spec:
  privileged: false
  allowPrivilegeEscalation: false
  requiredDropCapabilities:
    - ALL
  volumes:
    - 'configMap'
    - 'emptyDir'
    - 'projected'
    - 'secret'
    - 'downwardAPI'
    - 'persistentVolumeClaim'
  runAsUser:
    rule: 'MustRunAsNonRoot'
  seLinux:
    rule: 'RunAsAny'
  fsGroup:
    rule: 'RunAsAny'
```

---

**Next Steps**:
- Review [Security](Security) for comprehensive security guidelines
- Check [Monitoring](Monitoring) for operational monitoring setup
- Explore [Performance](Performance) for optimization strategies