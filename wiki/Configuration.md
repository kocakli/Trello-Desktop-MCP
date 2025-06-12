# Configuration Reference

This guide provides comprehensive configuration options and settings for Trello Desktop MCP.

## Basic Configuration

### Claude Desktop Configuration

The primary configuration for Trello Desktop MCP is done through Claude Desktop's MCP configuration file.

#### Configuration File Locations

| Platform | Configuration File Path |
|----------|------------------------|
| **macOS** | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| **Windows** | `%APPDATA%\Claude\claude_desktop_config.json` |
| **Linux** | `~/.config/Claude/claude_desktop_config.json` |

#### Basic Configuration Structure

```json
{
  "mcpServers": {
    "trello": {
      "command": "node",
      "args": ["/absolute/path/to/trello-desktop-mcp/dist/index.js"],
      "env": {
        "TRELLO_API_KEY": "your-api-key-here",
        "TRELLO_TOKEN": "your-token-here"
      }
    }
  }
}
```

## Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `TRELLO_API_KEY` | Your Trello API key from [trello.com/app-key](https://trello.com/app-key) | `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6` |
| `TRELLO_TOKEN` | Your Trello token with read/write permissions | `long-token-string-here` |

### Optional Variables

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `LOG_LEVEL` | Logging verbosity | `info` | `debug`, `info`, `warn`, `error` |
| `REQUEST_TIMEOUT` | API request timeout (ms) | `15000` | `30000` |
| `MAX_RETRY_ATTEMPTS` | Maximum retry attempts for failed requests | `3` | `5` |
| `RETRY_BASE_DELAY` | Base delay for retry backoff (ms) | `1000` | `2000` |

### Advanced Configuration Example

```json
{
  "mcpServers": {
    "trello": {
      "command": "node",
      "args": ["/absolute/path/to/trello-desktop-mcp/dist/index.js"],
      "env": {
        "TRELLO_API_KEY": "your-api-key",
        "TRELLO_TOKEN": "your-token",
        "LOG_LEVEL": "debug",
        "REQUEST_TIMEOUT": "30000",
        "MAX_RETRY_ATTEMPTS": "5",
        "RETRY_BASE_DELAY": "2000"
      }
    }
  }
}
```

## Trello API Credentials Setup

### Step 1: Get API Key

1. Visit [https://trello.com/app-key](https://trello.com/app-key)
2. Copy your **API Key** (32-character string)
3. Save this as your `TRELLO_API_KEY`

### Step 2: Generate Token

1. On the same page, click the **Token** link next to "To read a user's private information and to update, create and delete a user's boards and organizations."
2. Authorize the application with these settings:
   - **Application Name**: Trello Desktop MCP
   - **Scope**: Read and Write
   - **Expiration**: Never (recommended for personal use)
3. Copy the generated token (64+ character string)
4. Save this as your `TRELLO_TOKEN`

### Token Permissions

Your token should have these permissions:
- ✅ **Read**: Access to view boards, cards, lists, members
- ✅ **Write**: Ability to create, update, and delete content
- ✅ **Account**: Access to user profile information

### Security Considerations

- **Never commit credentials to version control**
- **Store credentials only in Claude Desktop config**
- **Regenerate tokens if they may have been exposed**
- **Use tokens with minimal required permissions**
- **Consider token expiration for shared systems**

## Server Configuration Options

### Retry Configuration

The MCP server includes robust retry logic with configurable parameters:

```typescript
interface RetryConfig {
  maxRetries: number;      // Maximum retry attempts (default: 3)
  baseDelay: number;       // Base delay in ms (default: 1000)
  maxDelay: number;        // Maximum delay in ms (default: 10000)
}
```

**Environment Variable Mapping**:
- `MAX_RETRY_ATTEMPTS` → `maxRetries`
- `RETRY_BASE_DELAY` → `baseDelay`
- `RETRY_MAX_DELAY` → `maxDelay`

### Request Timeout Configuration

Control API request timeouts:

```json
{
  "env": {
    "REQUEST_TIMEOUT": "30000"  // 30 seconds
  }
}
```

**Timeout Recommendations**:
- **Fast networks**: 15000ms (15 seconds)
- **Slow networks**: 30000ms (30 seconds)
- **Mobile/cellular**: 45000ms (45 seconds)

### Logging Configuration

Configure logging verbosity:

```json
{
  "env": {
    "LOG_LEVEL": "info"
  }
}
```

**Log Levels**:
- `error`: Only errors and critical issues
- `warn`: Warnings and errors
- `info`: General information, warnings, and errors (default)
- `debug`: Detailed debugging information

**Log Output Locations**:
- **macOS**: `~/Library/Logs/Claude/mcp-server-trello.log`
- **Windows**: `%APPDATA%\Claude\Logs\mcp-server-trello.log`
- **Linux**: `~/.config/Claude/Logs/mcp-server-trello.log`

## Multiple Configuration Profiles

### Development vs Production

You can maintain different configurations for different environments:

#### Development Configuration
```json
{
  "mcpServers": {
    "trello-dev": {
      "command": "node",
      "args": ["/dev/path/to/trello-desktop-mcp/dist/index.js"],
      "env": {
        "TRELLO_API_KEY": "dev-api-key",
        "TRELLO_TOKEN": "dev-token",
        "LOG_LEVEL": "debug",
        "REQUEST_TIMEOUT": "10000"
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
      "args": ["/prod/path/to/trello-desktop-mcp/dist/index.js"],
      "env": {
        "TRELLO_API_KEY": "prod-api-key",
        "TRELLO_TOKEN": "prod-token",
        "LOG_LEVEL": "warn",
        "REQUEST_TIMEOUT": "30000",
        "MAX_RETRY_ATTEMPTS": "5"
      }
    }
  }
}
```

### Team vs Personal Configuration

#### Personal Use
```json
{
  "mcpServers": {
    "trello": {
      "command": "node",
      "args": ["/path/to/dist/index.js"],
      "env": {
        "TRELLO_API_KEY": "personal-key",
        "TRELLO_TOKEN": "personal-token-never-expires",
        "LOG_LEVEL": "info"
      }
    }
  }
}
```

#### Team Use
```json
{
  "mcpServers": {
    "trello": {
      "command": "node", 
      "args": ["/shared/path/to/dist/index.js"],
      "env": {
        "TRELLO_API_KEY": "team-service-key",
        "TRELLO_TOKEN": "team-token-30-days",
        "LOG_LEVEL": "warn",
        "MAX_RETRY_ATTEMPTS": "5",
        "REQUEST_TIMEOUT": "45000"
      }
    }
  }
}
```

## Configuration Validation

### Automatic Validation

The MCP server automatically validates configuration on startup:

1. **Credential Validation**: Tests API key and token
2. **Network Connectivity**: Verifies Trello API access
3. **Permission Validation**: Confirms required permissions

### Manual Validation

Test your configuration manually:

```bash
# Test basic API access
curl "https://api.trello.com/1/members/me?key=YOUR_KEY&token=YOUR_TOKEN"

# Expected response: Your user profile information
```

### Configuration Troubleshooting

| Issue | Symptom | Solution |
|-------|---------|----------|
| **Invalid JSON** | Claude Desktop fails to start | Validate JSON syntax |
| **Wrong path** | Tools not available | Use absolute path to `dist/index.js` |
| **Invalid credentials** | Authentication errors | Regenerate API key/token |
| **Permission denied** | 403 errors | Check token permissions |
| **Network issues** | Timeout errors | Increase `REQUEST_TIMEOUT` |

## Advanced Configuration

### Custom API Client Settings

For advanced users, you can modify the Trello API client behavior:

```typescript
// In your custom build
const client = new TrelloClient(credentials, {
  baseURL: 'https://api.trello.com/1',
  timeout: 30000,
  retryConfig: {
    maxRetries: 5,
    baseDelay: 2000,
    maxDelay: 30000
  }
});
```

### Performance Tuning

#### High-Volume Usage
```json
{
  "env": {
    "REQUEST_TIMEOUT": "60000",
    "MAX_RETRY_ATTEMPTS": "5",
    "RETRY_BASE_DELAY": "2000",
    "LOG_LEVEL": "warn"
  }
}
```

#### Low-Latency Requirements
```json
{
  "env": {
    "REQUEST_TIMEOUT": "5000",
    "MAX_RETRY_ATTEMPTS": "1",
    "RETRY_BASE_DELAY": "500",
    "LOG_LEVEL": "error"
  }
}
```

#### Mobile/Unreliable Networks
```json
{
  "env": {
    "REQUEST_TIMEOUT": "45000",
    "MAX_RETRY_ATTEMPTS": "7",
    "RETRY_BASE_DELAY": "3000",
    "RETRY_MAX_DELAY": "60000"
  }
}
```

## Configuration Management Best Practices

### 1. Security Best Practices

```json
// ✅ Good: Environment variables
{
  "env": {
    "TRELLO_API_KEY": "key-from-secure-source",
    "TRELLO_TOKEN": "token-from-secure-source"
  }
}

// ❌ Bad: Hardcoded credentials
{
  "env": {
    "TRELLO_API_KEY": "hardcoded-key-in-config",
    "TRELLO_TOKEN": "hardcoded-token-in-config"
  }
}
```

### 2. Configuration Documentation

```json
{
  "mcpServers": {
    "trello": {
      "command": "node",
      "args": ["/path/to/dist/index.js"],
      "env": {
        "TRELLO_API_KEY": "your-key",
        "TRELLO_TOKEN": "your-token",
        "_COMMENT_LOG_LEVEL": "Set to debug for development, info for production",
        "LOG_LEVEL": "info",
        "_COMMENT_TIMEOUT": "Increase for slow networks or large operations", 
        "REQUEST_TIMEOUT": "30000"
      }
    }
  }
}
```

### 3. Configuration Backup

```bash
# Backup configuration before changes
cp ~/Library/Application\ Support/Claude/claude_desktop_config.json \
   ~/Library/Application\ Support/Claude/claude_desktop_config.json.backup

# Version control (without credentials)
git add claude_desktop_config.template.json
```

### 4. Environment-Specific Configuration

```bash
# Development
export CLAUDE_CONFIG_ENV=development

# Production  
export CLAUDE_CONFIG_ENV=production

# Load environment-specific config
```

## Monitoring and Health Checks

### Health Check Configuration

```json
{
  "env": {
    "HEALTH_CHECK_ENABLED": "true",
    "HEALTH_CHECK_INTERVAL": "300000"  // 5 minutes
  }
}
```

### Telemetry Configuration

```json
{
  "env": {
    "TELEMETRY_ENABLED": "true",
    "APPLICATION_INSIGHTS_KEY": "your-insights-key"
  }
}
```

---

**Next Steps**: 
- Review [Installation Guide](Installation-Guide) for setup instructions
- Check [Troubleshooting](Troubleshooting) for configuration issues
- Explore [Security](Security) for advanced security configurations