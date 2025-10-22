/**
 * Client-side structured logging utility
 * Provides consistent logging across the application with log levels
 */

type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

interface LogContext {
  [key: string]: unknown;
}

class Logger {
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = import.meta.env.DEV;
  }

  private log(level: LogLevel, message: string, context?: LogContext) {
    // Only log in development or for errors/warnings
    if (!this.isDevelopment && level === 'DEBUG') {
      return;
    }

    const timestamp = new Date().toISOString();
    const prefix = `[${level}] ${timestamp}`;

    switch (level) {
      case 'ERROR':
        console.error(prefix, message, context || '');
        break;
      case 'WARN':
        console.warn(prefix, message, context || '');
        break;
      default:
        if (this.isDevelopment) {
          console.log(prefix, message, context || '');
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
