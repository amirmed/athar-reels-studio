export const TEXT_API = 'https://api.alquran.cloud/v1';
export const AUDIO_BASE = 'https://everyayah.com/data';
export const QURAN_COM_API = 'https://api.quran.com/api/v4';

/**
 * Sleep helper that respects caller's AbortSignal to immediately cancel backoff delays
 */
export function abortableSleep(ms: number, signal?: AbortSignal | null): Promise<void> {
  if (signal?.aborted) {
    return Promise.reject(
      signal.reason || new DOMException('The operation was aborted', 'AbortError')
    );
  }
  return new Promise((resolve, reject) => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const onAbort = () => {
      if (timer !== undefined) clearTimeout(timer);
      reject(signal?.reason || new DOMException('The operation was aborted', 'AbortError'));
    };

    timer = setTimeout(() => {
      if (signal) signal.removeEventListener('abort', onAbort);
      resolve();
    }, ms);

    if (signal) {
      signal.addEventListener('abort', onAbort, { once: true });
    }
  });
}

/**
 * Resilient fetch with exponential backoff for HTTP 429 and transient 5xx errors.
 * Each attempt receives a dedicated, independent AbortController and timeout window.
 * External caller signals are monitored across all attempts and sleep delays without cross-attempt pollution.
 */
export async function fetchWithRetry(
  url: string,
  init?: RequestInit,
  retries = 2,
  timeoutMs = 8000
): Promise<Response> {
  if (init?.signal?.aborted) {
    throw init.signal.reason || new DOMException('The operation was aborted', 'AbortError');
  }

  let attempt = 0;
  while (attempt <= retries) {
    if (init?.signal?.aborted) {
      throw init.signal.reason || new DOMException('The operation was aborted', 'AbortError');
    }

    const attemptController = new AbortController();
    let timerId: ReturnType<typeof setTimeout> | undefined = setTimeout(() => {
      attemptController.abort(new DOMException('Request timed out', 'TimeoutError'));
    }, timeoutMs);

    const onCallerAbort = () => {
      attemptController.abort(
        init?.signal?.reason || new DOMException('The operation was aborted', 'AbortError')
      );
    };

    if (init?.signal) {
      init.signal.addEventListener('abort', onCallerAbort, { once: true });
    }

    try {
      const response = await fetch(url, { ...init, signal: attemptController.signal });

      if (!response.ok) {
        if ((response.status === 429 || response.status === 503) && attempt < retries) {
          const retryAfter = response.headers.get('Retry-After');
          const delay = retryAfter ? parseInt(retryAfter, 10) * 1000 : Math.pow(2, attempt) * 1000;
          if (timerId !== undefined) {
            clearTimeout(timerId);
            timerId = undefined;
          }
          if (init?.signal) {
            init.signal.removeEventListener('abort', onCallerAbort);
          }
          await abortableSleep(delay, init?.signal);
          attempt++;
          continue;
        }
      }
      return response;
    } catch (err: unknown) {
      // If the caller explicitly aborted, never retry; rethrow immediately
      if (init?.signal?.aborted) {
        throw err;
      }
      const isAbort =
        (err as Error)?.name === 'AbortError' || (err as Error)?.name === 'TimeoutError';
      const isNetwork =
        (err as Error)?.message?.includes('fetch') || (err as Error)?.message?.includes('network');
      if (attempt < retries && (isAbort || isNetwork)) {
        if (timerId !== undefined) {
          clearTimeout(timerId);
          timerId = undefined;
        }
        if (init?.signal) {
          init.signal.removeEventListener('abort', onCallerAbort);
        }
        await abortableSleep(Math.pow(2, attempt) * 800, init?.signal);
        attempt++;
        continue;
      }
      throw err;
    } finally {
      if (timerId !== undefined) {
        clearTimeout(timerId);
        timerId = undefined;
      }
      if (init?.signal) {
        init.signal.removeEventListener('abort', onCallerAbort);
      }
    }
  }
  throw new Error(`Failed to fetch ${url} after ${retries} retries`);
}
