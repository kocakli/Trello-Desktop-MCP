interface LogContext {
  [key: string]: any;
}

enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

class Logger {
  private level: LogLevel;

  constructor() {
    const envLevel = process.env.LOG_LEVEL?.toUpperCase();
    switch (envLevel) {
      case 'DEBUG':
        this.level = LogLevel.DEBUG;
        break;
      case 'INFO':
        this.level = LogLevel.INFO;
        break;
      case 'WARN':
        this.level = LogLevel.WARN;
        break;
      case 'ERROR':
        this.level = LogLevel.ERROR;
        break;
      default:
        this.level = LogLevel.INFO;
    }
  }

  private log(level: LogLevel, message: string, context?: LogContext) {
    if (level < this.level) return;

    // Desktop version: Disable all logging to stdout
    // Only log to stderr if explicitly enabled
    if (process.env.MCP_DESKTOP_MODE === 'true') {
      return; // No logging in desktop mode
    }

    const timestamp = new Date().toISOString();
    const levelName = LogLevel[level];
    
    const logEntry = {
      timestamp,
      level: levelName,
      message,
      ...(context && { context })
    };

    console.log(JSON.stringify(logEntry));
  }

  debug(message: string, context?: LogContext) {
    this.log(LogLevel.DEBUG, message, context);
  }

  info(message: string, context?: LogContext) {
    this.log(LogLevel.INFO, message, context);
  }

  warn(message: string, context?: LogContext) {
    this.log(LogLevel.WARN, message, context);
  }

  error(message: string, context?: LogContext) {
    this.log(LogLevel.ERROR, message, context);
  }

  toolCall(toolName: string, success: boolean, duration: number, context?: LogContext) {
    this.info(`Tool ${toolName} ${success ? 'succeeded' : 'failed'}`, {
      tool: toolName,
      success,
      duration: `${duration}ms`,
      ...context
    });
  }

  apiCall(endpoint: string, method: string, status: number, duration: number, rateLimit?: any) {
    this.debug(`API ${method} ${endpoint}`, {
      method,
      endpoint,
      status,
      duration: `${duration}ms`,
      rateLimit
    });
  }
}

export const logger = new Logger();
export type { LogContext };