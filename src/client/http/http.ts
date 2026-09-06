import { calculateBackoff, shouldRetry } from '../config/config';
import { ABSOLUTE_MAX_RETRIES, ABSOLUTE_MAX_TIMEOUT_MS } from '../config/defaults';
import {
  AbortError,
  HttpError,
  HttpRetryError,
  HttpTimeoutError,
  InterceptorError,
  UnexpectedError,
} from '../errors';
import { buildUrl, convertHeaders, getError, isAbortError, mergeHeaders, sleep } from '../utils';

import type { HttpConfig, HttpOptions } from './types';

const makeRequest =
  (config: HttpConfig) =>
  async (method: string, path?: string, options: HttpOptions = {}): Promise<Response> => {
    const url = buildUrl(config.baseUrl ?? '', path, options.params, options.omit);
    const timeout = Math.min(options.timeout ?? config.timeout ?? 0, ABSOLUTE_MAX_TIMEOUT_MS);
    const retries = options.retries ?? config.retryPolicy?.maxTries ?? 0;
    const maxAttempts = Math.min(retries + 1, ABSOLUTE_MAX_RETRIES + 1);

    config.logger?.debug('Initiating request', { method, url, timeout, retries, maxAttempts });

    if (options.signal?.aborted) {
      config.logger?.debug('Request aborted before starting', { method, url });
      throw new AbortError();
    }

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const attemptStart = Date.now();
      const isLastAttempt = attempt === maxAttempts - 1;

      config.logger?.debug('Starting attempt', {
        method,
        url,
        attempt: attempt + 1,
        maxAttempts,
        isLastAttempt,
      });

      const controller = new AbortController();
      let timeoutId: ReturnType<typeof setTimeout> | null = null;

      const onAbort = () => {
        config.logger?.debug('External abort signal received', {
          method,
          url,
          attempt: attempt + 1,
        });
        controller.abort();
      };
      options.signal?.addEventListener('abort', onAbort);

      if (timeout > 0) {
        timeoutId = setTimeout(() => {
          config.logger?.debug('Timeout reached, aborting request', {
            method,
            url,
            attempt: attempt + 1,
            timeout,
          });
          controller.abort();
        }, timeout);
      }

      try {
        let requestInit: RequestInit = {
          method,
          headers: mergeHeaders(
            config.baseHeaders,
            options.headers ? convertHeaders(options.headers) : undefined,
          ),
          signal: controller.signal,
          body: options.body,
          redirect: 'follow',
        };

        if (config.requestInterceptor) {
          config.logger?.debug('Applying request interceptor', {
            method,
            url,
            attempt: attempt + 1,
          });
          try {
            requestInit = await config.requestInterceptor(requestInit);
          } catch (err) {
            config.logger?.debug('Request interceptor failed', {
              method,
              url,
              attempt: attempt + 1,
              error: getError(err).message,
            });
            throw new InterceptorError('request', getError(err), url, method, attempt + 1);
          }
        }

        config.logger?.debug('Making HTTP request', {
          method,
          url,
          attempt: attempt + 1,
          maxAttempts,
          timeout,
        });
        let response = await fetch(url, requestInit);
        if (config.responseInterceptor) {
          config.logger?.debug('Applying response interceptor', {
            method,
            url,
            attempt: attempt + 1,
            status: response.status,
          });
          try {
            response = await config.responseInterceptor(response);
          } catch (err) {
            config.logger?.debug('Response interceptor failed', {
              method,
              url,
              attempt: attempt + 1,
              status: response.status,
              error: getError(err).message,
            });
            throw new InterceptorError('response', getError(err), url, method, attempt + 1);
          }
        }

        if (response.ok) {
          const duration = Date.now() - attemptStart;
          config.logger?.debug('HTTP request successful', {
            method,
            url,
            status: response.status,
            attempt: attempt + 1,
            duration,
          });
          return response;
        }

        if (!shouldRetry(config.retryPolicy, response.status) || isLastAttempt) {
          config.logger?.debug('HTTP request failed, not retrying', {
            method,
            url,
            status: response.status,
            attempt: attempt + 1,
            isLastAttempt,
            shouldRetry: shouldRetry(config.retryPolicy, response.status),
          });
          throw new HttpError(response);
        }

        const backoff = calculateBackoff(config.retryPolicy, attempt) * 1000;
        config.logger?.debug('HTTP request failed, retrying', {
          method,
          url,
          status: response.status,
          attempt: attempt + 1,
          backoff,
        });
        await sleep(backoff);
      } catch (err) {
        const error = getError(err);
        if (isAbortError(error)) {
          config.logger?.debug('Request timed out', { method, url, attempt: attempt + 1, timeout });
          throw new HttpTimeoutError(timeout, url, method, attempt + 1);
        }

        const isRetryable = error instanceof TypeError || error instanceof HttpTimeoutError;

        if (isLastAttempt) {
          if (isRetryable) {
            config.logger?.debug('Request failed after all retries', {
              method,
              url,
              attempt: attempt + 1,
              maxAttempts,
              error: error.message,
            });
            throw new HttpRetryError(undefined, undefined, error.message, maxAttempts, url, method);
          }
          config.logger?.debug('Request failed with non-retryable error', {
            method,
            url,
            attempt: attempt + 1,
            error: error.message,
          });
          throw error;
        }

        if (!isRetryable) {
          config.logger?.debug('Request failed with non-retryable error', {
            method,
            url,
            attempt: attempt + 1,
            error: error.message,
          });
          throw error;
        }

        const backoff = calculateBackoff(config.retryPolicy, attempt) * 1000;
        config.logger?.debug('Request failed with retryable error, retrying', {
          method,
          url,
          attempt: attempt + 1,
          error: error.message,
          backoff,
        });
        await sleep(backoff);
      } finally {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        options.signal?.removeEventListener('abort', onAbort);
      }
    }
    config.logger?.error('Unexpected: All attempts completed without return or throw', {
      method,
      url,
      maxAttempts,
    });
    throw new UnexpectedError();
  };

export const createHttpClient = (config: HttpConfig) => {
  const request = makeRequest(config);

  return {
    request,
    get: (path?: string, options?: HttpOptions) => request('GET', path, options),
    post: (path?: string, options?: HttpOptions) => request('POST', path, options),
    put: (path?: string, options?: HttpOptions) => request('PUT', path, options),
    patch: (path?: string, options?: HttpOptions) => request('PATCH', path, options),
    delete: (path?: string, options?: HttpOptions) => request('DELETE', path, options),
    head: (path?: string, options?: Omit<HttpOptions, 'body'>) => request('HEAD', path, options),
    options: (path?: string, options?: Omit<HttpOptions, 'body'>) =>
      request('OPTIONS', path, options),
  };
};
