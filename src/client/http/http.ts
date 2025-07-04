import { calculateBackoff, shouldRetry } from '../config/config';
import {
  ABSOLUTE_MAX_RETRIES,
  ABSOLUTE_MAX_TIMEOUT_MS,
  DEFAULT_RETRY_POLICY,
} from '../config/defaults';
import {
  AbortError,
  HttpError,
  HttpRetryError,
  HttpTimeoutError,
  InterceptorError,
  UnexpectedError,
} from '../errors';
import { buildUrl, convertHeaders, getError, isAbortError, mergeHeaders, sleep } from '../utils';

import type { Config, Options } from './types';

const makeRequest =
  (config: Config) =>
  async (method: string, path?: string, options: Options = {}): Promise<Response> => {
    const {
      params,
      timeout,
      retries,
      omit,
      headers,
      signal: userSignal,
      ...requestOverrides
    } = options;

    const url = buildUrl(config.baseUrl ?? '', path, params, omit);

    const maxTries = Math.min(
      retries ?? config.retryPolicy?.maxTries ?? DEFAULT_RETRY_POLICY.maxTries,
      config.maxAbsoluteRetries ?? ABSOLUTE_MAX_RETRIES,
    );
    const requestTimeout = Math.min(
      timeout ?? config.timeout ?? ABSOLUTE_MAX_TIMEOUT_MS,
      ABSOLUTE_MAX_TIMEOUT_MS,
    );

    let attempt = 0;
    let lastResponse: Response | null = null;
    let lastError: Error | null = null;

    while (attempt < maxTries) {
      const controller = new AbortController();
      let timeoutId: ReturnType<typeof setTimeout> | null = null;
      let abortListener: (() => void) | undefined;
      let isTimeoutAbort = false;

      if (userSignal) {
        if (userSignal.aborted) {
          throw new AbortError('Request was aborted');
        }

        abortListener = () => {
          controller.abort();
        };
        userSignal.addEventListener('abort', abortListener);
      }

      if (requestTimeout) {
        timeoutId = setTimeout(() => {
          isTimeoutAbort = true;
          controller.abort();
        }, requestTimeout);
      }

      try {
        let requestInit: RequestInit = {
          method,
          headers: mergeHeaders(config.baseHeaders, headers ? convertHeaders(headers) : undefined),
          signal: controller.signal,
          ...requestOverrides,
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

        const shouldRetryRequest = shouldRetry(config.retryPolicy, response.status);

        if (attempt >= maxTries - 1 || !shouldRetryRequest) {
          if (!response.ok && !shouldRetryRequest) {
            throw new HttpError(response);
          }
          return response;
        }

        lastResponse = response;
        const delay = calculateBackoff(config.retryPolicy, attempt);
        await sleep(delay * 1000);
        attempt++;
      } catch (err) {
        const error = getError(err);

        if (isAbortError(error)) {
          if (userSignal?.aborted) {
            throw error;
          }
          if (isTimeoutAbort && requestTimeout) {
            throw new HttpTimeoutError(requestTimeout, url, method, attempt + 1);
          }
          throw error;
        }

        if (error instanceof HttpError && attempt >= maxTries - 1) {
          throw error;
        }

        lastError = error;

        if (attempt >= maxTries - 1) {
          if (error instanceof TypeError) {
            throw new HttpRetryError(
              lastResponse?.status ?? null,
              lastResponse?.statusText ?? null,
              lastError?.message ?? null,
              attempt + 1,
              url,
              method,
            );
          }
          throw error;
        }

        if (error instanceof TypeError || (isAbortError(error) && isTimeoutAbort)) {
          const delay = calculateBackoff(config.retryPolicy, attempt);
          await sleep(delay * 1000);
          attempt++;
        } else {
          throw error;
        }
      } finally {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        if (userSignal && abortListener) {
          userSignal.removeEventListener('abort', abortListener);
        }
      }
    }

    throw new UnexpectedError();
  };

export const createHttpClient = (config: Config) => {
  const request = makeRequest(config);

  return {
    request,
    get: (path?: string, options?: Options) => request('GET', path, options),
    post: (path?: string, options?: Options) => request('POST', path, options),
    put: (path?: string, options?: Options) => request('PUT', path, options),
    delete: (path?: string, options?: Options) => request('DELETE', path, options),
    patch: (path?: string, options?: Options) => request('PATCH', path, options),
    head: (path?: string, options?: Omit<Options, 'body'>) => request('HEAD', path, options),
    options: (path?: string, options?: Omit<Options, 'body'>) => request('OPTIONS', path, options),
  };
};
