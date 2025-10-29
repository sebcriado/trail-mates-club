/**
 * Safe logger that only logs in development mode
 * Prevents information leakage in production
 */

export const logger = {
  error: (message: string, error?: unknown) => {
    if (import.meta.env.DEV) {
      console.error(message, error);
    }
    // In production, you could send to a logging service like Sentry
    // Example: Sentry.captureException(error);
  },

  warn: (message: string, data?: unknown) => {
    if (import.meta.env.DEV) {
      console.warn(message, data);
    }
  },

  info: (message: string, data?: unknown) => {
    if (import.meta.env.DEV) {
      console.info(message, data);
    }
  },

  debug: (message: string, data?: unknown) => {
    if (import.meta.env.DEV) {
      console.debug(message, data);
    }
  },
};
