import { calculateBackoff, shouldRetry } from '../../config/config';
import { ABSOLUTE_MAX_RETRIES, ABSOLUTE_MAX_TIMEOUT_MS } from '../../config/defaults';
import {
  AbortError,
  HttpError,
  HttpRetryError,
  HttpTimeoutError,
  InterceptorError,
} from '../../errors';
import { buildUrl, convertHeaders, getError, isAbortError, mergeHeaders, sleep } from '../../utils';
import { createHttpClient } from '../http';
import type { HttpConfig } from '../types';

jest.mock('../../config/config');
jest.mock('../../config/defaults');
jest.mock('../../utils');

const mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>;
global.fetch = mockFetch;

const mockSetTimeout = jest.fn() as unknown as jest.MockedFunction<typeof setTimeout>;
const mockClearTimeout = jest.fn() as unknown as jest.MockedFunction<typeof clearTimeout>;
global.setTimeout = mockSetTimeout;
global.clearTimeout = mockClearTimeout;

const mockAbort = jest.fn();
const mockAddEventListener = jest.fn();
const mockRemoveEventListener = jest.fn();
const mockSignal = {
  aborted: false,
  addEventListener: mockAddEventListener,
  removeEventListener: mockRemoveEventListener,
} as unknown as AbortSignal;
global.AbortController = jest.fn().mockImplementation(() => ({
  signal: mockSignal,
  abort: mockAbort,
}));

const mockCalculateBackoff = calculateBackoff as jest.MockedFunction<typeof calculateBackoff>;
const mockShouldRetry = shouldRetry as jest.MockedFunction<typeof shouldRetry>;
const mockBuildUrl = buildUrl as jest.MockedFunction<typeof buildUrl>;
const mockConvertHeaders = convertHeaders as jest.MockedFunction<typeof convertHeaders>;
const mockGetError = getError as jest.MockedFunction<typeof getError>;
const mockIsAbortError = isAbortError as jest.MockedFunction<typeof isAbortError>;
const mockMergeHeaders = mergeHeaders as jest.MockedFunction<typeof mergeHeaders>;
const mockSleep = sleep as jest.MockedFunction<typeof sleep>;

describe(createHttpClient.name, () => {
  let mockResponse: Response;
  let config: HttpConfig;

  beforeEach(() => {
    jest.clearAllMocks();

    mockBuildUrl.mockReturnValue('https://api.example.com/test');
    mockConvertHeaders.mockReturnValue({});
    mockMergeHeaders.mockReturnValue(new Headers());
    mockGetError.mockImplementation((err) => (err instanceof Error ? err : new Error(String(err))));
    mockIsAbortError.mockReturnValue(false);
    mockSleep.mockResolvedValue(undefined);
    mockCalculateBackoff.mockReturnValue(1);
    mockShouldRetry.mockReturnValue(false);
    mockSetTimeout.mockReturnValue(123 as unknown as ReturnType<typeof setTimeout>);

    mockResponse = {
      ok: true,
      status: 200,
      statusText: 'OK',
    } as Response;
    mockFetch.mockResolvedValue(mockResponse);

    config = { baseUrl: 'https://api.example.com' };
  });

  describe('client creation', () => {
    it('should contain all methods', () => {
      const client = createHttpClient(config);

      expect(client).toHaveProperty('request');
      expect(client).toHaveProperty('get');
      expect(client).toHaveProperty('post');
      expect(client).toHaveProperty('put');
      expect(client).toHaveProperty('delete');
      expect(client).toHaveProperty('patch');
      expect(client).toHaveProperty('head');
      expect(client).toHaveProperty('options');
    });
  });

  describe('URL building', () => {
    it('should handle empty baseUrl', async () => {
      const client = createHttpClient({});

      await client.get('/users');

      expect(mockBuildUrl).toHaveBeenCalledWith('', '/users', undefined, undefined);
    });

    it('should build URL correctly', async () => {
      const client = createHttpClient(config);

      await client.get('/users');

      expect(mockBuildUrl).toHaveBeenCalledWith(
        'https://api.example.com',
        '/users',
        undefined,
        undefined,
      );
    });

    it.each([
      { path: '/users', params: { page: 1 }, omit: ['secret'] },
      { path: undefined, params: undefined, omit: undefined },
      { path: '', params: {}, omit: [] },
    ])('should handle different URL parameters: path=$path', async ({ path, params, omit }) => {
      const client = createHttpClient(config);

      await client.get(path, { params, omit });

      expect(mockBuildUrl).toHaveBeenCalledWith('https://api.example.com', path, params, omit);
    });
  });

  describe('HTTP methods', () => {
    it.each([
      { method: 'get', expectedMethod: 'GET' },
      { method: 'post', expectedMethod: 'POST' },
      { method: 'put', expectedMethod: 'PUT' },
      { method: 'delete', expectedMethod: 'DELETE' },
      { method: 'patch', expectedMethod: 'PATCH' },
      { method: 'head', expectedMethod: 'HEAD' },
      { method: 'options', expectedMethod: 'OPTIONS' },
    ] as const)(
      'should make $expectedMethod request via $method method',
      async ({ method, expectedMethod }) => {
        const client = createHttpClient(config);

        await client[method]('/test');

        expect(mockFetch).toHaveBeenCalledWith('https://api.example.com/test', {
          method: expectedMethod,
          headers: new Headers(),
          signal: mockSignal,
          body: undefined,
          redirect: 'follow',
        });
      },
    );

    it('should include body in POST request', async () => {
      const client = createHttpClient(config);
      const body = JSON.stringify({ name: 'name' });

      await client.post('/test', { body });

      expect(mockFetch).toHaveBeenCalledWith('https://api.example.com/test', {
        method: 'POST',
        headers: new Headers(),
        signal: mockSignal,
        body,
        redirect: 'follow',
      });
    });
  });

  describe('headers handling', () => {
    it('should handle requests without headers', async () => {
      const client = createHttpClient(config);

      await client.get('/test');

      expect(mockConvertHeaders).not.toHaveBeenCalled();
      expect(mockMergeHeaders).toHaveBeenCalledWith(undefined, undefined);
    });

    it('should merge base headers with request headers', async () => {
      const baseHeaders = { 'Content-Type': 'application/json' };
      const requestHeaders = { Authorization: 'Bearer token' };
      const convertedHeaders = { authorization: 'Bearer token' };
      const mergedHeaders = new Headers({ ...baseHeaders, ...convertedHeaders });
      mockConvertHeaders.mockReturnValue(convertedHeaders);
      mockMergeHeaders.mockReturnValue(mergedHeaders);
      const client = createHttpClient({
        baseUrl: 'https://api.example.com',
        baseHeaders,
      });

      await client.get('/test', { headers: requestHeaders });

      expect(mockConvertHeaders).toHaveBeenCalledWith(requestHeaders);
      expect(mockMergeHeaders).toHaveBeenCalledWith(baseHeaders, convertedHeaders);
    });
  });

  describe('timeout handling', () => {
    it.each([
      { optionTimeout: 5000, configTimeout: undefined, expected: 5000 },
      { optionTimeout: undefined, configTimeout: 3000, expected: 3000 },
      { optionTimeout: undefined, configTimeout: undefined, expected: 0 },
      { optionTimeout: 500000, configTimeout: undefined, expected: ABSOLUTE_MAX_TIMEOUT_MS },
      { optionTimeout: 1000, configTimeout: 2000, expected: 1000 },
    ])(
      'should set timeout correctly: option=$optionTimeout, config=$configTimeout',
      async ({ optionTimeout, configTimeout, expected }) => {
        const clientConfig = {
          baseUrl: 'https://api.example.com',
          ...(configTimeout && { timeout: configTimeout }),
        };
        const client = createHttpClient(clientConfig);

        await client.get('/users', { timeout: optionTimeout });

        if (expected > 0) {
          expect(mockSetTimeout).toHaveBeenCalledWith(expect.any(Function), expected);
          return;
        }
        expect(mockSetTimeout).not.toHaveBeenCalled();
      },
    );

    it('should clear timeout after request', async () => {
      const client = createHttpClient(config);

      await client.get('/test', { timeout: 5000 });

      expect(mockClearTimeout).toHaveBeenCalledWith(123);
    });
  });

  describe('abort signal handling', () => {
    it('should throw AbortError if signal is already aborted', async () => {
      const client = createHttpClient(config);
      const abortedSignal = { aborted: true } as AbortSignal;

      await expect(client.get('/test', { signal: abortedSignal })).rejects.toThrow(AbortError);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should add and remove abort event listener', async () => {
      const client = createHttpClient(config);

      await client.get('/test', { signal: mockSignal });

      expect(mockAddEventListener).toHaveBeenCalledWith('abort', expect.any(Function));
      expect(mockRemoveEventListener).toHaveBeenCalledWith('abort', expect.any(Function));
    });

    it('should call controller.abort when onAbort is triggered', async () => {
      const client = createHttpClient(config);
      mockAddEventListener.mockImplementation((event, callback) => {
        if (event === 'abort') {
          (callback as () => void)();
        }
      });

      await client.get('/test', { signal: mockSignal });

      expect(mockAbort).toHaveBeenCalled();
    });
  });

  describe('request interceptor', () => {
    it('should apply request interceptor', async () => {
      const interceptor = jest.fn().mockResolvedValue({
        method: 'GET',
        headers: { 'X-Custom-Header': 'value' },
        signal: expect.any(Object),
        body: undefined,
      });
      const client = createHttpClient({
        baseUrl: 'https://api.example.com',
        requestInterceptor: interceptor,
      });

      await client.get('/test');

      expect(interceptor).toHaveBeenCalledWith({
        method: 'GET',
        headers: new Headers(),
        signal: mockSignal,
        body: undefined,
        redirect: 'follow',
      });
    });

    it('should throw InterceptorError when request interceptor fails', async () => {
      const error = new Error('Interceptor failed');
      const interceptor = jest.fn().mockRejectedValue(error);
      const client = createHttpClient({
        baseUrl: 'https://api.example.com',
        requestInterceptor: interceptor,
      });

      await expect(client.get('/test')).rejects.toThrow(InterceptorError);
    });
  });

  describe('response interceptor', () => {
    it('should apply response interceptor', async () => {
      const modifiedResponse = { ...mockResponse, status: 201 };
      const interceptor = jest.fn().mockResolvedValue(modifiedResponse);
      const client = createHttpClient({
        baseUrl: 'https://api.example.com',
        responseInterceptor: interceptor,
      });

      const response = await client.get('/test');

      expect(interceptor).toHaveBeenCalledWith(mockResponse);
      expect(response).toBe(modifiedResponse);
    });

    it('should throw InterceptorError when response interceptor fails', async () => {
      const error = new Error('Interceptor failed');
      const interceptor = jest.fn().mockRejectedValue(error);
      const client = createHttpClient({
        baseUrl: 'https://api.example.com',
        responseInterceptor: interceptor,
      });

      await expect(client.get('/test')).rejects.toThrow(InterceptorError);
    });
  });

  describe('successful responses', () => {
    it.each([
      { status: 200, ok: true },
      { status: 201, ok: true },
      { status: 204, ok: true },
      { status: 299, ok: true },
    ])('should return response for successful status $status', async ({ status, ok }) => {
      const client = createHttpClient(config);
      const successResponse = { ...mockResponse, status, ok };
      mockFetch.mockResolvedValue(successResponse);

      const response = await client.get('/test');

      expect(response).toBe(successResponse);
    });
  });

  describe('error responses', () => {
    it('should throw HttpError for non-ok responses when not retrying', async () => {
      const client = createHttpClient(config);
      const errorResponse = {
        ok: false,
        status: 404,
        statusText: 'Not Found',
      } as Response;
      mockFetch.mockResolvedValue(errorResponse);
      mockShouldRetry.mockReturnValue(false);

      await expect(client.get('/test')).rejects.toThrow(HttpError);
    });

    it.each([
      { error: 'TypeError', errorClass: TypeError, expectWrapped: true },
      { error: 'Custom Error', errorClass: Error, expectWrapped: false },
    ])('should handle fetch errors: $error', async ({ errorClass, expectWrapped }) => {
      const client = createHttpClient(config);
      const fetchError = new errorClass('Network error');
      mockFetch.mockRejectedValue(fetchError);
      mockGetError.mockReturnValue(fetchError);
      mockIsAbortError.mockReturnValue(false);

      if (expectWrapped) {
        await expect(client.get('/test')).rejects.toThrow(HttpRetryError);
        return;
      }
      await expect(client.get('/test')).rejects.toThrow(fetchError);
    });
  });

  describe('abort and timeout errors', () => {
    it('should throw AbortError when signal is aborted', async () => {
      const client = createHttpClient(config);
      const abortError = new Error('Aborted');
      const abortedSignal = { aborted: true } as AbortSignal;
      mockFetch.mockRejectedValue(abortError);
      mockGetError.mockReturnValue(abortError);
      mockIsAbortError.mockReturnValue(true);

      await expect(client.get('/test', { signal: abortedSignal })).rejects.toThrow(AbortError);
    });

    it('should throw HttpTimeoutError when request times out', async () => {
      const client = createHttpClient(config);
      const timeoutError = new Error('Timeout');
      mockFetch.mockRejectedValue(timeoutError);
      mockGetError.mockReturnValue(timeoutError);
      mockIsAbortError.mockReturnValue(true);

      await expect(client.get('/test', { timeout: 1000, signal: mockSignal })).rejects.toThrow(
        HttpTimeoutError,
      );
    });
  });

  describe('retry logic', () => {
    beforeEach(() => {
      mockShouldRetry.mockReturnValue(true);
      mockCalculateBackoff.mockReturnValue(0.1);
    });

    it('should retry on retryable HTTP errors', async () => {
      const client = createHttpClient({
        baseUrl: 'https://api.example.com',
        retryPolicy: { maxTries: 1 },
      });
      const errorResponse = { ok: false, status: 500 } as Response;
      const successResponse = { ok: true, status: 200 } as Response;
      mockFetch.mockResolvedValueOnce(errorResponse).mockResolvedValueOnce(successResponse);

      const response = await client.get('/test');

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(mockSleep).toHaveBeenCalledWith(100);
      expect(response).toBe(successResponse);
    });

    it('should retry on network errors', async () => {
      const client = createHttpClient({
        baseUrl: 'https://api.example.com',
        retryPolicy: { maxTries: 1 },
      });
      const networkError = new TypeError('Network error');
      const successResponse = { ok: true, status: 200 } as Response;
      mockFetch.mockRejectedValueOnce(networkError).mockResolvedValueOnce(successResponse);
      mockGetError.mockReturnValue(networkError);

      const response = await client.get('/test');

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(mockSleep).toHaveBeenCalledWith(100);
      expect(response).toBe(successResponse);
    });

    it.each([
      { maxTries: 0, expectedAttempts: 1 },
      { maxTries: 1, expectedAttempts: 2 },
      { maxTries: 3, expectedAttempts: 4 },
      { maxTries: 50, expectedAttempts: ABSOLUTE_MAX_RETRIES + 1 },
    ])(
      'should respect retry limits: maxTries=$maxTries',
      async ({ maxTries, expectedAttempts }) => {
        const client = createHttpClient({
          baseUrl: 'https://api.example.com',
          retryPolicy: { maxTries },
        });
        const networkError = new TypeError('Network error');
        mockFetch.mockRejectedValue(networkError);
        mockGetError.mockReturnValue(networkError);

        await expect(client.get('/test')).rejects.toThrow(HttpRetryError);
        expect(mockFetch).toHaveBeenCalledTimes(expectedAttempts);
      },
    );

    it('should not retry non-retryable errors', async () => {
      const client = createHttpClient({
        baseUrl: 'https://api.example.com',
        retryPolicy: { maxTries: 3 },
      });
      const customError = new Error('Custom error');
      mockFetch.mockRejectedValue(customError);
      mockGetError.mockReturnValue(customError);

      await expect(client.get('/test')).rejects.toThrow(customError);
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockSleep).not.toHaveBeenCalled();
    });

    it('should not retry when shouldRetry returns false', async () => {
      const client = createHttpClient({
        baseUrl: 'https://api.example.com',
        retryPolicy: { maxTries: 3 },
      });
      const errorResponse = { ok: false, status: 400 } as Response;
      mockFetch.mockResolvedValue(errorResponse);
      mockShouldRetry.mockReturnValue(false);

      await expect(client.get('/test')).rejects.toThrow(HttpError);
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockSleep).not.toHaveBeenCalled();
    });

    it('should calculate backoff for each retry attempt', async () => {
      const retryPolicy = { maxTries: 2 };
      const client = createHttpClient({
        baseUrl: 'https://api.example.com',
        retryPolicy,
      });
      const networkError = new TypeError('Network error');
      mockFetch.mockRejectedValue(networkError);
      mockGetError.mockReturnValue(networkError);
      mockCalculateBackoff.mockReturnValueOnce(0.1).mockReturnValueOnce(0.2);

      await expect(client.get('/test')).rejects.toThrow(HttpRetryError);
      expect(mockCalculateBackoff).toHaveBeenCalledTimes(2);
      expect(mockCalculateBackoff).toHaveBeenNthCalledWith(1, retryPolicy, 0);
      expect(mockCalculateBackoff).toHaveBeenNthCalledWith(2, retryPolicy, 1);
      expect(mockSleep).toHaveBeenNthCalledWith(1, 100);
      expect(mockSleep).toHaveBeenNthCalledWith(2, 200);
    });

    it('should throw HttpRetryError when all retries are exhausted', async () => {
      const client = createHttpClient({
        baseUrl: 'https://api.example.com',
        retryPolicy: { maxTries: 2 },
      });
      const networkError = new TypeError('Network error');
      mockFetch.mockRejectedValue(networkError);
      mockGetError.mockReturnValue(networkError);

      await expect(client.get('/test')).rejects.toThrow(HttpRetryError);
    });
  });

  describe('retry with options.retries', () => {
    it('should use options.retries over config.retryPolicy.maxTries', async () => {
      const client = createHttpClient({
        baseUrl: 'https://api.example.com',
        retryPolicy: { maxTries: 5 },
      });
      const networkError = new TypeError('Network error');
      mockFetch.mockRejectedValue(networkError);
      mockGetError.mockReturnValue(networkError);

      await expect(client.get('/test', { retries: 1 })).rejects.toThrow(HttpRetryError);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  it('should handle request with all options set', async () => {
    const requestInterceptor = jest.fn().mockImplementation((req) => ({
      ...req,
      headers: { ...req.headers, 'X-Request-ID': '123' },
    }));
    const responseInterceptor = jest.fn().mockImplementation((res) => res);
    const client = createHttpClient({
      baseUrl: 'https://api.example.com',
      baseHeaders: { 'Content-Type': 'application/json' },
      timeout: 10000,
      retryPolicy: { maxTries: 2 },
      requestInterceptor,
      responseInterceptor,
    });
    const abortController = new AbortController();

    await client.post('/users', {
      headers: { Authorization: 'Bearer token' },
      body: JSON.stringify({ name: 'John' }),
      timeout: 5000,
      retries: 1,
      params: { validate: true },
      omit: ['password'],
      signal: abortController.signal,
    });

    expect(mockBuildUrl).toHaveBeenCalledWith(
      'https://api.example.com',
      '/users',
      { validate: true },
      ['password'],
    );
    expect(mockConvertHeaders).toHaveBeenCalled();
    expect(mockMergeHeaders).toHaveBeenCalled();
    expect(requestInterceptor).toHaveBeenCalled();
    expect(responseInterceptor).toHaveBeenCalled();
    expect(mockSetTimeout).toHaveBeenCalledWith(expect.any(Function), 5000);
  });
});
