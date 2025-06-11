// Types
export interface LogContext {
  [key: string]: unknown;
}

interface LogEntry {
  timestamp: string;
  level: 'info' | 'error' | 'warn' | 'debug';
  message: string;
  context?: LogContext;
}

// Log levels
const LOG_LEVELS = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
} as const;

// Current log level (can be set via environment variable)
const CURRENT_LOG_LEVEL = (process.env.LOG_LEVEL || 'info') as keyof typeof LOG_LEVELS;

// Helper to check if we should log at this level
function shouldLog(level: keyof typeof LOG_LEVELS): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[CURRENT_LOG_LEVEL];
}

// Main logging function
function log(level: keyof typeof LOG_LEVELS, message: string, context?: LogContext) {
  if (!shouldLog(level)) return;

  const logEntry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...(context && { context }),
  };

  // In development, pretty print for readability
  if (process.env.NODE_ENV === 'development') {
    console[level](JSON.stringify(logEntry, null, 2));
  } else {
    // In production, use single line for better log aggregation
    console[level](JSON.stringify(logEntry));
  }
}

// Exported logging functions
export const logger = {
  debug: (message: string, context?: LogContext) => log('debug', message, context),
  info: (message: string, context?: LogContext) => log('info', message, context),
  warn: (message: string, context?: LogContext) => log('warn', message, context),
  error: (message: string, context?: LogContext) => log('error', message, context),
};

// Request context logger
export function createRequestLogger(requestId: string) {
  return {
    debug: (message: string, context?: LogContext) => 
      logger.debug(message, { requestId, ...context }),
    info: (message: string, context?: LogContext) => 
      logger.info(message, { requestId, ...context }),
    warn: (message: string, context?: LogContext) => 
      logger.warn(message, { requestId, ...context }),
    error: (message: string, context?: LogContext) => 
      logger.error(message, { requestId, ...context }),
  };
} 