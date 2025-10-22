/**
 * Server-side structured logging utility
 * Provides consistent logging across the application with log levels
 */

type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

interface LogContext {
  [key: string]: unknown;
}

class Logger {
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
  }

  private log(level: LogLevel, message: string, context?: LogContext) {
    const timestamp = new Date().toISOString();
    const logData = {
      timestamp,
      level,
      message,
      ...(context && { context }),
    };

    // In development, use console for readability
    if (this.isDevelopment) {
      const prefix = `[${level}]`;
      switch (level) {
        case 'ERROR':
          console.error(prefix, message, context || '');
          break;
        case 'WARN':
          console.warn(prefix, message, context || '');
          break;
        case 'DEBUG':
          console.log(prefix, message, context || '');
          break;
        default:
          console.log(prefix, message, context || '');
      }
    } else {
      // In production, use structured JSON logging
      // Skip DEBUG logs in production
      if (level !== 'DEBUG') {
        console.log(JSON.stringify(logData));
      }
    }
  }

  debug(message: string, context?: LogContext) {
    this.log('DEBUG', message, context);
  }

  info(message: string, context?: LogContext) {
    this.log('INFO', message, context);
  }

  warn(message: string, context?: LogContext) {
    this.log('WARN', message, context);
  }

  error(message: string, context?: LogContext) {
    this.log('ERROR', message, context);
  }
}

export const logger = new Logger();
