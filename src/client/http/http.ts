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

    if (options.signal?.aborted) {
      throw new AbortError();
    }

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const isLastAttempt = attempt === maxAttempts - 1;

      const controller = new AbortController();
      let timeoutId: ReturnType<typeof setTimeout> | null = null;

      const onAbort = () => {
        controller.abort();
      };
      options.signal?.addEventListener('abort', onAbort);

      if (timeout > 0) {
        timeoutId = setTimeout(() => controller.abort(), timeout);
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
        };

        if (config.requestInterceptor) {
          try {
            requestInit = await config.requestInterceptor(requestInit);
          } catch (err) {
            throw new InterceptorError('request', getError(err), url, method, attempt + 1);
          }
        }

        let response = await fetch(url, requestInit);

        if (config.responseInterceptor) {
          try {
            response = await config.responseInterceptor(response);
          } catch (err) {
            throw new InterceptorError('response', getError(err), url, method, attempt + 1);
          }
        }

        if (response.ok) {
          return response;
        }

        if (!shouldRetry(config.retryPolicy, response.status) || isLastAttempt) {
          throw new HttpError(response);
        }

        await sleep(calculateBackoff(config.retryPolicy, attempt) * 1000);
      } catch (err) {
        const error = getError(err);

        if (isAbortError(error)) {
          if (options.signal?.aborted) {
            throw new AbortError();
          }
          throw new HttpTimeoutError(timeout, url, method, attempt + 1);
        }

        if (isLastAttempt) {
          if (error instanceof HttpError || error instanceof InterceptorError) {
            throw error;
          }
          throw new HttpRetryError(undefined, undefined, error.message, maxAttempts, url, method);
        }

        const isRetryable = error instanceof TypeError || error instanceof HttpTimeoutError;

        if (!isRetryable) {
          throw error;
        }

        await sleep(calculateBackoff(config.retryPolicy, attempt) * 1000);
      } finally {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        options.signal?.removeEventListener('abort', onAbort);
      }
    }

    throw new UnexpectedError();
  };

export const createHttpClient = (config: HttpConfig) => {
  const request = makeRequest(config);

  return {
    request,
    get: (path?: string, options?: HttpOptions) => request('GET', path, options),
    post: (path?: string, options?: HttpOptions) => request('POST', path, options),
    put: (path?: string, options?: HttpOptions) => request('PUT', path, options),
    delete: (path?: string, options?: HttpOptions) => request('DELETE', path, options),
    patch: (path?: string, options?: HttpOptions) => request('PATCH', path, options),
    head: (path?: string, options?: Omit<HttpOptions, 'body'>) => request('HEAD', path, options),
    options: (path?: string, options?: Omit<HttpOptions, 'body'>) =>
      request('OPTIONS', path, options),
  };
};
