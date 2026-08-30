import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logger } from '../logger';

describe('Logger Utility', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should have all standard logging methods defined', () => {
    expect(typeof logger.debug).toBe('function');
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.log).toBe('function');
    expect(typeof logger.warn).toBe('function');
    expect(typeof logger.error).toBe('function');
  });

  it('should delegate warn to console.warn without throwing', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    logger.warn('Test warning message', { data: 123 });
    expect(warnSpy).toHaveBeenCalledWith('Test warning message', { data: 123 });
  });

  it('should delegate error to console.error without throwing', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    logger.error('Test error message', new Error('Something went wrong'));
    expect(errorSpy).toHaveBeenCalledWith('Test error message', expect.any(Error));
  });

  it('should execute debug, info, and log functions without throwing errors', () => {
    expect(() => {
      logger.debug('Debug payload', 1, 2, 3);
      logger.info('Info payload', { status: 'ok' });
      logger.log('General log payload');
    }).not.toThrow();
  });
});
