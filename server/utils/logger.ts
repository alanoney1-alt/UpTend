/**
 * Structured Logging Utility
 *
 * Provides consistent logging across the UpTend backend with:
 * - Log levels (debug, info, warn, error)
 * - Structured output (JSON in production, pretty in development)
 * - Context metadata for better debugging
 * - Integration-ready for external services (Datadog, Sentry, etc.)
 *
 * Usage:
 * ```typescript
 * import { logger } from './utils/logger';
 *
 * logger.info('User logged in', { userId: 123, email: 'user@example.com' });
 * logger.error('Payment failed', { error: err.message, orderId: 456 });
 * logger.warn('Rate limit approaching', { ip: req.ip, count: 95 });
 * ```
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  [key: string]: any;
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  env: string;
}

class Logger {
  private env: string;
  private minLevel: LogLevel;

  constructor() {
    this.env = process.env.NODE_ENV || 'development';
    this.minLevel = this.getMinLevel();
  }

  private getMinLevel(): LogLevel {
    const configuredLevel = process.env.LOG_LEVEL?.toLowerCase();
    if (configuredLevel && ['debug', 'info', 'warn', 'error'].includes(configuredLevel)) {
      return configuredLevel as LogLevel;
    }
    return this.env === 'production' ? 'info' : 'debug';
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    const levelIndex = levels.indexOf(level);
    const minLevelIndex = levels.indexOf(this.minLevel);
    return levelIndex >= minLevelIndex;
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      env: this.env,
    };

    if (this.env === 'production') {
      // JSON format for log aggregation services
      return JSON.stringify(entry);
    } else {
      // Pretty format for development
      const emoji = { debug: '🔍', info: 'ℹ️', warn: '⚠️', error: '❌' }[level];
      const contextStr = context ? `\n${JSON.stringify(context, null, 2)}` : '';
      return `${emoji} [${level.toUpperCase()}] ${message}${contextStr}`;
    }
  }

  /**
   * Debug-level logging - verbose information for development/troubleshooting
   * Not logged in production by default
   */
  debug(message: string, context?: LogContext): void {
    if (!this.shouldLog('debug')) return;
    console.debug(this.formatMessage('debug', message, context));
  }

  /**
   * Info-level logging - general informational messages
   * Examples: user actions, system state changes, successful operations
   */
  info(message: string, context?: LogContext): void {
    if (!this.shouldLog('info')) return;
    console.info(this.formatMessage('info', message, context));
  }

  /**
   * Warning-level logging - potentially harmful situations
   * Examples: deprecated API usage, rate limit warnings, failed retries
   */
  warn(message: string, context?: LogContext): void {
    if (!this.shouldLog('warn')) return;
    console.warn(this.formatMessage('warn', message, context));
  }

  /**
   * Error-level logging - error events
   * Examples: exceptions, failed requests, system errors
   * Always logged regardless of log level
   */
  error(message: string, context?: LogContext): void {
    console.error(this.formatMessage('error', message, context));
  }

  /**
   * HTTP request logging helper
   * Logs incoming HTTP requests with timing
   */
  request(method: string, url: string, statusCode: number, duration: number, context?: LogContext): void {
    const level: LogLevel = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';
    this[level](`${method} ${url} ${statusCode}`, {
      ...context,
      method,
      url,
      statusCode,
      durationMs: duration,
    });
  }

  /**
   * Database query logging helper
   */
  query(sql: string, duration: number, context?: LogContext): void {
    this.debug('Database query executed', {
      ...context,
      sql: sql.substring(0, 200), // Truncate long queries
      durationMs: duration,
    });
  }

  /**
   * External API call logging helper
   */
  externalApi(service: string, endpoint: string, statusCode: number, duration: number, context?: LogContext): void {
    const level: LogLevel = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'debug';
    this[level](`External API: ${service} ${endpoint}`, {
      ...context,
      service,
      endpoint,
      statusCode,
      durationMs: duration,
    });
  }
}

// Singleton instance
export const logger = new Logger();

/**
 * Middleware for Express to log all HTTP requests
 *
 * Usage:
 * ```typescript
 * import { requestLogger } from './utils/logger';
 * app.use(requestLogger);
 * ```
 */
export function requestLogger(req: any, res: any, next: any) {
  const start = Date.now();

  // Log after response is sent
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.request(req.method, req.path, res.statusCode, duration, {
      ip: req.ip,
      userAgent: req.get('user-agent'),
      userId: req.user?.id,
    });
  });

  next();
}

/**
 * Error logging helper
 * Extracts useful information from Error objects
 */
export function logError(error: Error | any, message: string, context?: LogContext): void {
  logger.error(message, {
    ...context,
    error: error.message,
    stack: error.stack,
    name: error.name,
    code: error.code,
  });
}
