import { AbortError, HttpParamSerializationError, InvalidURLError } from './errors';

export const filterParams = <T extends Record<string, unknown>>(
  params: T,
  omit?: readonly string[],
): Partial<T> => {
  const uniqueOmit = new Set(omit);

  return Object.fromEntries(
    Object.entries(params).filter(
      ([key, value]) => value !== null && value !== undefined && !uniqueOmit.has(key),
    ),
  ) as Partial<T>;
};

export const appendSearchParams = (url: URL, params: Record<string, unknown>): void => {
  for (const [key, value] of Object.entries(params)) {
    if (Array.isArray(value)) {
      for (const v of value) {
        url.searchParams.append(key, String(v));
      }
      continue;
    }

    if (value instanceof Date) {
      url.searchParams.append(key, value.toISOString());
      continue;
    }

    if (typeof value === 'object') {
      try {
        url.searchParams.append(key, JSON.stringify(value));
      } catch (err) {
        throw new HttpParamSerializationError(key, value, getError(err));
      }
      continue;
    }

    url.searchParams.append(key, String(value));
  }
};

export const buildUrl = (
  baseUrl: string,
  path?: string,
  params?: Record<string, unknown>,
  omit?: readonly string[],
): string => {
  try {
    const url = new URL(path ?? '', baseUrl);

    if (params) {
      appendSearchParams(url, filterParams(params, omit));
    }

    return url.toString();
  } catch (err) {
    if (err instanceof HttpParamSerializationError) {
      throw err;
    }
    throw new InvalidURLError(baseUrl, path);
  }
};

export const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const mergeHeaders = (
  base?: Record<string, string>,
  override?: Record<string, string>,
): Headers => {
  const result = new Headers();

  if (base) {
    for (const [k, v] of Object.entries(base)) {
      if (v?.trim()) {
        result.set(k.toLowerCase(), v.trim());
      }
    }
  }

  if (override) {
    for (const [k, v] of Object.entries(override)) {
      if (v?.trim()) {
        result.set(k.toLowerCase(), v.trim());
      }
    }
  }

  return result;
};

export const convertHeaders = (
  headers: ConstructorParameters<typeof Headers>[0],
): Record<string, string> => {
  if (headers instanceof Headers) {
    return Object.fromEntries(headers.entries());
  }

  if (Array.isArray(headers)) {
    return Object.fromEntries(headers);
  }

  if (typeof headers === 'object' && headers !== null) {
    const result: Record<string, string> = {};

    for (const [key, value] of Object.entries(headers)) {
      result[key] = Array.isArray(value) ? value.join(', ') : String(value);
    }

    return result;
  }

  return {};
};

export const isAbortError = (error: unknown): boolean =>
  error instanceof AbortError ||
  (error instanceof Error && error.name === 'AbortError') ||
  (error instanceof Error && error.message.includes('aborted'));

export const getError = (error: unknown): Error =>
  error instanceof Error ? error : new Error(String(error));
