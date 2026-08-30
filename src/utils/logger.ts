/**
 * Production-ready Logger Utility
 * Suppresses debug and verbose log noise in production builds while preserving warnings and errors.
 */

const isDev = typeof process !== 'undefined' && process.env?.NODE_ENV === 'test'
  ? true
  : Boolean(import.meta.env?.DEV);

export const logger = {
  /**
   * Verbose debug logging — suppressed completely in production builds
   */
  debug: (...args: unknown[]): void => {
    if (isDev) {
      console.debug(...args);
    }
  },

  /**
   * Informational logs — active in DEV, suppressed in PROD
   */
  info: (...args: unknown[]): void => {
    if (isDev) {
      console.info(...args);
    }
  },

  /**
   * General log output — active in DEV, suppressed in PROD
   */
  log: (...args: unknown[]): void => {
    if (isDev) {
      console.log(...args);
    }
  },

  /**
   * Warnings — preserved across all environments
   */
  warn: (...args: unknown[]): void => {
    console.warn(...args);
  },

  /**
   * Errors — preserved across all environments with callstacks
   */
  error: (...args: unknown[]): void => {
    console.error(...args);
  },
};

export default logger;
