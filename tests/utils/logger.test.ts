import { logger } from '../../src/utils/logger';
import { jest } from '@jest/globals';

describe('Logger', () => {
  let consoleLogSpy: jest.SpyInstance;
  let originalLogLevel: string | undefined;
  let originalDesktopMode: string | undefined;

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    originalLogLevel = process.env.LOG_LEVEL;
    originalDesktopMode = process.env.MCP_DESKTOP_MODE;
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    process.env.LOG_LEVEL = originalLogLevel;
    process.env.MCP_DESKTOP_MODE = originalDesktopMode;
  });

  it('should log INFO level by default', () => {
    delete process.env.LOG_LEVEL;
    delete process.env.MCP_DESKTOP_MODE;
    const newLogger = new (logger as any).constructor(); // Re-instantiate to pick up env changes
    newLogger.info('Test message');
    expect(consoleLogSpy).toHaveBeenCalledTimes(1);
    const logEntry = JSON.parse(consoleLogSpy.mock.calls[0][0]);
    expect(logEntry.level).toBe('INFO');
    expect(logEntry.message).toBe('Test message');
  });

  it('should log DEBUG level when LOG_LEVEL is DEBUG', () => {
    process.env.LOG_LEVEL = 'DEBUG';
    delete process.env.MCP_DESKTOP_MODE;
    const newLogger = new (logger as any).constructor();
    newLogger.debug('Debug message');
    expect(consoleLogSpy).toHaveBeenCalledTimes(1);
    const logEntry = JSON.parse(consoleLogSpy.mock.calls[0][0]);
    expect(logEntry.level).toBe('DEBUG');
    expect(logEntry.message).toBe('Debug message');
  });

  it('should not log DEBUG level when LOG_LEVEL is INFO', () => {
    process.env.LOG_LEVEL = 'INFO';
    delete process.env.MCP_DESKTOP_MODE;
    const newLogger = new (logger as any).constructor();
    newLogger.debug('Debug message');
    expect(consoleLogSpy).not.toHaveBeenCalled();
  });

  it('should log WARN level when LOG_LEVEL is WARN', () => {
    process.env.LOG_LEVEL = 'WARN';
    delete process.env.MCP_DESKTOP_MODE;
    const newLogger = new (logger as any).constructor();
    newLogger.warn('Warning message');
    expect(consoleLogSpy).toHaveBeenCalledTimes(1);
    const logEntry = JSON.parse(consoleLogSpy.mock.calls[0][0]);
    expect(logEntry.level).toBe('WARN');
    expect(logEntry.message).toBe('Warning message');
  });

  it('should log ERROR level when LOG_LEVEL is ERROR', () => {
    process.env.LOG_LEVEL = 'ERROR';
    delete process.env.MCP_DESKTOP_MODE;
    const newLogger = new (logger as any).constructor();
    newLogger.error('Error message');
    expect(consoleLogSpy).toHaveBeenCalledTimes(1);
    const logEntry = JSON.parse(consoleLogSpy.mock.calls[0][0]);
    expect(logEntry.level).toBe('ERROR');
    expect(logEntry.message).toBe('Error message');
  });

  it('should include context in the log entry', () => {
    delete process.env.LOG_LEVEL;
    delete process.env.MCP_DESKTOP_MODE;
    const newLogger = new (logger as any).constructor();
    const context: LogContext = { userId: '123', transactionId: 'abc' };
    newLogger.info('Message with context', context);
    expect(consoleLogSpy).toHaveBeenCalledTimes(1);
    const logEntry = JSON.parse(consoleLogSpy.mock.calls[0][0]);
    expect(logEntry.message).toBe('Message with context');
    expect(logEntry.context).toEqual(context);
  });

  it('should not log anything when MCP_DESKTOP_MODE is true', () => {
    process.env.LOG_LEVEL = 'DEBUG'; // Set to DEBUG to ensure all levels would normally log
    process.env.MCP_DESKTOP_MODE = 'true';
    const newLogger = new (logger as any).constructor();
    newLogger.debug('Debug message');
    newLogger.info('Info message');
    newLogger.warn('Warn message');
    newLogger.error('Error message');
    expect(consoleLogSpy).not.toHaveBeenCalled();
  });

  it('should log toolCall correctly', () => {
    delete process.env.LOG_LEVEL;
    delete process.env.MCP_DESKTOP_MODE;
    const newLogger = new (logger as any).constructor();
    newLogger.toolCall('myTool', true, 150, { someData: 'value' });
    expect(consoleLogSpy).toHaveBeenCalledTimes(1);
    const logEntry = JSON.parse(consoleLogSpy.mock.calls[0][0]);
    expect(logEntry.level).toBe('INFO');
    expect(logEntry.message).toBe('Tool myTool succeeded');
    expect(logEntry.context).toEqual({
      tool: 'myTool',
      success: true,
      duration: '150ms',
      someData: 'value',
    });
  });

  it('should log apiCall correctly', () => {
    process.env.LOG_LEVEL = 'DEBUG'; // apiCall logs at DEBUG level
    delete process.env.MCP_DESKTOP_MODE;
    const newLogger = new (logger as any).constructor();
    newLogger.apiCall('/api/v1/data', 'GET', 200, 250, { limit: 100 });
    expect(consoleLogSpy).toHaveBeenCalledTimes(1);
    const logEntry = JSON.parse(consoleLogSpy.mock.calls[0][0]);
    expect(logEntry.level).toBe('DEBUG');
    expect(logEntry.message).toBe('API GET /api/v1/data');
    expect(logEntry.context).toEqual({
      method: 'GET',
      endpoint: '/api/v1/data',
      status: 200,
      duration: '250ms',
      rateLimit: { limit: 100 },
    });
  });
});
