import pino from "pino";

// Create base logger configured for Cloudflare Workers
// Workers Logs automatically captures console output, but pino gives us
// structured logging, log levels, and child loggers for context
export const logger = pino({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
  // Cloudflare Workers Logs recommends JSON format for better indexing
  formatters: {
    level: (label) => ({ level: label }),
  },
  // Reduce payload size in production
  base: process.env.NODE_ENV === "production" ? {} : { pid: undefined },
});

// Pre-configured child loggers for each API module
export const boardLogger = logger.child({ module: "board-api" });
export const cardLogger = logger.child({ module: "card-api" });

// Type-safe log context helpers
export type LogContext = Record<string, unknown>;

export function createRequestLogger(module: string, fn: string) {
  return logger.child({ module, fn });
}
