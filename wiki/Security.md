# Security Guide

This document outlines security considerations, best practices, and implementation details for Trello Desktop MCP.

## Security Architecture Overview

### Security Principles

1. **Defense in Depth**: Multiple layers of security controls
2. **Principle of Least Privilege**: Minimal required permissions
3. **Secure by Default**: Safe default configurations
4. **Data Minimization**: Only process necessary data
5. **Transparency**: Clear security practices and audit trails

### Threat Model

#### Potential Threats

| Threat | Impact | Mitigation |
|--------|--------|------------|
| **Credential Exposure** | High | Secure credential storage, no logging |
| **API Key Compromise** | High | Token rotation, scope limitations |
| **Man-in-the-Middle** | Medium | HTTPS-only communication |
| **Data Injection** | Medium | Input validation, sanitization |
| **Rate Limit Abuse** | Low | Built-in rate limiting, retry logic |
| **Local File Access** | Medium | Sandboxed execution, restricted permissions |

## Credential Security

### Secure Credential Management

#### Storage Best Practices

```json
// ✅ SECURE: Environment variables in Claude Desktop config
{
  "mcpServers": {
    "trello": {
      "command": "node",
      "args": ["/path/to/dist/index.js"],
      "env": {
        "TRELLO_API_KEY": "your-api-key",
        "TRELLO_TOKEN": "your-token"
      }
    }
  }
}

// ❌ INSECURE: Hardcoded credentials
{
  "mcpServers": {
    "trello": {
      "command": "node",
      "args": ["/path/to/dist/index.js", "--api-key", "hardcoded-key"]
    }
  }
}
```

#### Credential Validation

```typescript
// Secure credential validation without logging
function validateCredentials(apiKey: string, token: string): boolean {
  // Validate format without exposing values
  const apiKeyValid = /^[a-f0-9]{32}$/.test(apiKey);
  const tokenValid = /^[a-f0-9]{64,}$/.test(token);
  
  if (!apiKeyValid || !tokenValid) {
    // Generic error message to avoid credential exposure
    throw new Error('Invalid credential format. Please check your API key and token.');
  }
  
  return true;
}

// Never log credentials
function logApiCall(endpoint: string, duration: number) {
  logger.info('API call completed', {
    endpoint: endpoint.replace(/[?&](key|token)=[^&]+/g, '$1=***'),
    duration: `${duration}ms`
  });
}
```

### Token Security

#### Token Permissions

**Required Permissions**:
- ✅ **Read**: Access to view boards, cards, lists, members
- ✅ **Write**: Create, update, and delete content
- ✅ **Account**: Access to user profile information

**Recommended Token Configuration**:
```bash
# When generating tokens via Trello API
# Scope: read,write,account
# Expiration: 30 days (for shared systems) or never (for personal use)
# Name: "Trello Desktop MCP - [Your Name/Organization]"
```

#### Token Rotation

```typescript
// Implement token rotation for production systems
class SecureCredentialManager {
  private static readonly TOKEN_REFRESH_THRESHOLD = 7 * 24 * 60 * 60 * 1000; // 7 days
  
  async validateAndRefreshToken(token: string): Promise<string> {
    try {
      // Check token validity
      const tokenInfo = await this.validateToken(token);
      
      // Refresh if expires soon
      if (this.shouldRefreshToken(tokenInfo)) {
        return await this.refreshToken(token);
      }
      
      return token;
    } catch (error) {
      throw new Error('Token validation failed. Please regenerate your Trello token.');
    }
  }
  
  private shouldRefreshToken(tokenInfo: any): boolean {
    const expiresAt = new Date(tokenInfo.dateExpires);
    const now = new Date();
    return (expiresAt.getTime() - now.getTime()) < SecureCredentialManager.TOKEN_REFRESH_THRESHOLD;
  }
}
```

## Data Security

### Input Validation and Sanitization

#### Comprehensive Input Validation

```typescript
import { z } from 'zod';
import DOMPurify from 'dompurify';

// Secure validation schemas
const secureCardSchema = z.object({
  name: z.string()
    .min(1, 'Card name is required')
    .max(16384, 'Card name too long')
    .refine(val => !/<script/i.test(val), 'Script tags not allowed'),
  
  desc: z.string()
    .max(16384, 'Description too long')
    .optional()
    .transform(val => val ? DOMPurify.sanitize(val) : val),
  
  idList: z.string()
    .regex(/^[a-f0-9]{24}$/, 'Invalid list ID format'),
  
  due: z.string()
    .datetime({ message: 'Invalid date format' })
    .optional()
    .refine(val => {
      if (!val) return true;
      const date = new Date(val);
      const now = new Date();
      const maxFuture = new Date(now.getTime() + (10 * 365 * 24 * 60 * 60 * 1000)); // 10 years
      return date > now && date < maxFuture;
    }, 'Date must be in reasonable future range')
});

// SQL injection prevention (even though we don't use SQL)
const sanitizeSearchQuery = (query: string): string => {
  return query
    .replace(/['"`;\\]/g, '') // Remove potential injection characters
    .trim()
    .substring(0, 1000); // Limit length
};
```

#### Output Sanitization

```typescript
// Sanitize data before returning to user
function sanitizeOutput(data: any): any {
  if (typeof data === 'string') {
    // Remove potentially dangerous content
    return data
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+="[^"]*"/gi, '');
  }
  
  if (Array.isArray(data)) {
    return data.map(sanitizeOutput);
  }
  
  if (data && typeof data === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(data)) {
      // Skip sensitive fields
      if (!['password', 'secret', 'token', 'key'].includes(key.toLowerCase())) {
        sanitized[key] = sanitizeOutput(value);
      }
    }
    return sanitized;
  }
  
  return data;
}
```

### Data Privacy

#### Personal Information Handling

```typescript
// PII detection and handling
const PII_PATTERNS = [
  /\b\d{3}-\d{2}-\d{4}\b/g,           // SSN
  /\b\d{16}\b/g,                       // Credit card
  /\b[\w._%+-]+@[\w.-]+\.[A-Z]{2,}\b/gi, // Email
  /\b\d{3}-\d{3}-\d{4}\b/g            // Phone
];

function detectAndRedactPII(text: string): string {
  let redacted = text;
  
  PII_PATTERNS.forEach(pattern => {
    redacted = redacted.replace(pattern, '[REDACTED]');
  });
  
  return redacted;
}

// Data minimization in logging
function createSecureLogEntry(operation: string, data: any) {
  const logData = {
    operation,
    timestamp: new Date().toISOString(),
    // Only include necessary identifiers
    resourceId: data.id,
    resourceType: data.type,
    // Never log sensitive content
    success: true
  };
  
  // Detect and warn about PII
  if (data.content && containsPII(data.content)) {
    logData.warning = 'PII detected in content';
  }
  
  return logData;
}
```

#### Data Retention

```typescript
// Minimize data retention
class DataRetentionManager {
  private static readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private static readonly LOG_RETENTION = 30 * 24 * 60 * 60 * 1000; // 30 days
  
  // No persistent caching of user data
  static shouldCache(dataType: string): boolean {
    const cacheable = ['board-metadata', 'list-structure'];
    return cacheable.includes(dataType);
  }
  
  // Automatic log cleanup
  static cleanupLogs() {
    const cutoff = Date.now() - DataRetentionManager.LOG_RETENTION;
    // Remove logs older than retention period
  }
}
```

## Network Security

### HTTPS Enforcement

```typescript
class SecureHTTPClient {
  private baseURL = 'https://api.trello.com/1'; // Always HTTPS
  
  private async makeSecureRequest(endpoint: string, options: RequestOptions) {
    // Enforce HTTPS
    if (!endpoint.startsWith('https://')) {
      throw new Error('Only HTTPS endpoints are allowed');
    }
    
    // Secure headers
    const secureHeaders = {
      'Content-Type': 'application/json',
      'User-Agent': 'TrelloMCPServer/1.0.0',
      'Accept': 'application/json',
      // Security headers
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    };
    
    // Certificate validation (default in Node.js)
    const response = await fetch(endpoint, {
      ...options,
      headers: { ...secureHeaders, ...options.headers }
    });
    
    return response;
  }
}
```

### Request Security

```typescript
// Secure request building
function buildSecureURL(endpoint: string, params: Record<string, string>): string {
  const url = new URL(`https://api.trello.com/1${endpoint}`);
  
  // Validate endpoint
  if (!endpoint.startsWith('/')) {
    throw new Error('Invalid endpoint format');
  }
  
  // Add parameters securely
  Object.entries(params).forEach(([key, value]) => {
    // Validate parameter names and values
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(key)) {
      throw new Error(`Invalid parameter name: ${key}`);
    }
    
    if (value && typeof value === 'string') {
      url.searchParams.set(key, encodeURIComponent(value));
    }
  });
  
  return url.toString();
}
```

## Error Handling Security

### Secure Error Messages

```typescript
// Security-aware error handling
class SecureErrorHandler {
  static formatError(error: unknown, context: string): TrelloError {
    // Categorize errors safely
    if (error instanceof Response) {
      return this.handleHTTPError(error);
    }
    
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return {
        message: 'Network connectivity issue. Please check your internet connection.',
        error: 'NETWORK_ERROR',
        code: 'NETWORK_ERROR'
      };
    }
    
    // Generic error for unknown issues (avoid information disclosure)
    return {
      message: 'An unexpected error occurred. Please try again.',
      error: 'UNKNOWN_ERROR',
      code: 'UNKNOWN_ERROR'
    };
  }
  
  private static handleHTTPError(response: Response): TrelloError {
    // Provide helpful but not revealing error messages
    switch (response.status) {
      case 401:
        return {
          message: 'Authentication failed. Please check your API credentials in Claude Desktop settings.',
          error: 'AUTHENTICATION_ERROR',
          code: 'INVALID_CREDENTIALS',
          status: 401
        };
      
      case 403:
        return {
          message: 'Access denied. Your token may need additional permissions.',
          error: 'AUTHORIZATION_ERROR', 
          code: 'INSUFFICIENT_PERMISSIONS',
          status: 403
        };
      
      case 404:
        return {
          message: 'Resource not found. It may have been deleted or you may not have access.',
          error: 'NOT_FOUND',
          code: 'NOT_FOUND',
          status: 404
        };
      
      default:
        return {
          message: 'API request failed. Please try again.',
          error: `HTTP_${response.status}`,
          code: 'API_ERROR',
          status: response.status
        };
    }
  }
}

// Never expose sensitive information in errors
function logError(error: any, context: string) {
  const safeError = {
    context,
    message: error.message,
    status: error.status,
    timestamp: new Date().toISOString()
    // Never log sensitive data like tokens or API keys
  };
  
  logger.error('Operation failed', safeError);
}
```

## Access Control

### Permission Validation

```typescript
// Validate user permissions before operations
class PermissionValidator {
  static async validateBoardAccess(client: TrelloClient, boardId: string): Promise<boolean> {
    try {
      // Check if user can access the board
      const board = await client.getBoard(boardId);
      return !!board.data;
    } catch (error) {
      if (error.status === 403 || error.status === 404) {
        return false;
      }
      throw error;
    }
  }
  
  static async validateCardOperation(
    client: TrelloClient, 
    cardId: string, 
    operation: 'read' | 'write'
  ): Promise<boolean> {
    try {
      const card = await client.getCard(cardId);
      
      if (operation === 'write') {
        // Check if user can write to the board
        return await this.validateBoardAccess(client, card.data.idBoard);
      }
      
      return true;
    } catch (error) {
      return false;
    }
  }
}
```

### Rate Limiting Security

```typescript
// Prevent abuse through rate limiting
class SecurityRateLimiter {
  private static readonly REQUEST_WINDOW = 60 * 1000; // 1 minute
  private static readonly MAX_REQUESTS_PER_WINDOW = 100;
  private static requestCounts = new Map<string, { count: number; window: number }>();
  
  static checkRateLimit(userId: string): boolean {
    const now = Date.now();
    const window = Math.floor(now / this.REQUEST_WINDOW);
    const key = `${userId}:${window}`;
    
    const current = this.requestCounts.get(key) || { count: 0, window };
    
    if (current.count >= this.MAX_REQUESTS_PER_WINDOW) {
      throw new Error('Rate limit exceeded. Please wait before making additional requests.');
    }
    
    this.requestCounts.set(key, { count: current.count + 1, window });
    
    // Clean up old entries
    this.cleanupOldEntries(window);
    
    return true;
  }
  
  private static cleanupOldEntries(currentWindow: number) {
    for (const [key, data] of this.requestCounts.entries()) {
      if (data.window < currentWindow - 5) { // Keep 5 windows
        this.requestCounts.delete(key);
      }
    }
  }
}
```

## Audit and Monitoring

### Security Logging

```typescript
// Security event logging
interface SecurityEvent {
  type: 'authentication' | 'authorization' | 'data_access' | 'error';
  timestamp: string;
  userId?: string;
  resource?: string;
  action: string;
  success: boolean;
  metadata?: Record<string, any>;
}

class SecurityLogger {
  static logSecurityEvent(event: Omit<SecurityEvent, 'timestamp'>) {
    const securityEvent: SecurityEvent = {
      ...event,
      timestamp: new Date().toISOString()
    };
    
    // Log to security audit trail
    logger.info('Security event', securityEvent);
    
    // Alert on security failures
    if (!event.success && ['authentication', 'authorization'].includes(event.type)) {
      this.alertSecurityFailure(securityEvent);
    }
  }
  
  private static alertSecurityFailure(event: SecurityEvent) {
    // Implementation would depend on monitoring setup
    console.warn('Security failure detected:', event);
  }
}

// Usage in tools
export async function handleSecureTool(args: unknown) {
  try {
    SecurityLogger.logSecurityEvent({
      type: 'data_access',
      action: 'tool_execution',
      resource: 'trello_api',
      success: true
    });
    
    // Tool implementation
    
  } catch (error) {
    SecurityLogger.logSecurityEvent({
      type: 'error',
      action: 'tool_execution',
      success: false,
      metadata: { error: error.message }
    });
    
    throw error;
  }
}
```

## Configuration Security

### Secure Configuration Validation

```typescript
// Validate security configuration
class ConfigurationValidator {
  static validateMCPConfig(config: any): void {
    // Check for insecure configurations
    if (config.args?.some((arg: string) => arg.includes('api-key') || arg.includes('token'))) {
      throw new Error('Credentials must not be passed as command arguments');
    }
    
    if (!config.env?.TRELLO_API_KEY || !config.env?.TRELLO_TOKEN) {
      throw new Error('Required credentials missing from environment variables');
    }
    
    // Validate file permissions
    const scriptPath = config.args?.[0];
    if (scriptPath && !this.validateFilePath(scriptPath)) {
      throw new Error('Script path appears insecure');
    }
  }
  
  private static validateFilePath(path: string): boolean {
    // Ensure path is absolute and doesn't contain traversal
    return path.startsWith('/') && !path.includes('../') && !path.includes('..\\');
  }
}
```

## Security Checklist

### Deployment Security

- [ ] **Credentials**: Stored securely in environment variables
- [ ] **HTTPS**: All API communication uses HTTPS
- [ ] **Input Validation**: All inputs validated and sanitized
- [ ] **Error Handling**: No sensitive information in error messages
- [ ] **Logging**: Security events logged, credentials never logged
- [ ] **Permissions**: Minimal required token permissions
- [ ] **Rate Limiting**: Built-in rate limit handling
- [ ] **File Access**: Restricted to necessary files only

### Operational Security

- [ ] **Token Rotation**: Regular token rotation schedule
- [ ] **Access Review**: Regular review of board access permissions
- [ ] **Audit Logs**: Security event monitoring in place
- [ ] **Incident Response**: Security incident response plan
- [ ] **Updates**: Regular security updates and patches
- [ ] **Backup**: Secure backup of configuration (without credentials)

### Development Security

- [ ] **Code Review**: Security-focused code reviews
- [ ] **Dependency Scanning**: Regular dependency vulnerability scans
- [ ] **Static Analysis**: Security-focused static code analysis
- [ ] **Penetration Testing**: Regular security testing
- [ ] **Documentation**: Security practices documented and followed

## Incident Response

### Security Incident Response Plan

1. **Detection**: Identify security incident through monitoring
2. **Assessment**: Evaluate scope and impact
3. **Containment**: Isolate affected systems
4. **Remediation**: Fix vulnerabilities and restore security
5. **Recovery**: Restore normal operations
6. **Lessons Learned**: Document and improve security practices

### Common Security Incidents

| Incident Type | Response Steps |
|---------------|----------------|
| **Credential Compromise** | 1. Revoke compromised tokens<br>2. Generate new credentials<br>3. Update configurations<br>4. Monitor for abuse |
| **Unauthorized Access** | 1. Review access logs<br>2. Revoke suspicious sessions<br>3. Strengthen authentication<br>4. Notify affected users |
| **Data Exposure** | 1. Identify exposed data<br>2. Remove from public access<br>3. Notify affected parties<br>4. Implement additional controls |

---

**Next Steps**:
- Review [Configuration](Configuration) for secure setup options
- Check [Best Practices](Best-Practices) for security-conscious usage
- Explore [Troubleshooting](Troubleshooting) for security-related issues