import { AbortError, HttpParamSerializationError, InvalidURLError } from '../errors';
import {
  appendSearchParams,
  buildUrl,
  convertHeaders,
  filterParams,
  getError,
  isAbortError,
  mergeHeaders,
  sleep,
} from '../utils';

describe(filterParams.name, () => {
  describe('when basic filtering is done', () => {
    it('should handle empty params', () => {
      const result = filterParams({});

      expect(result).toStrictEqual({});
    });

    it('should handle all null/undefined values', () => {
      const input = { a: null, b: undefined, c: null, d: undefined };

      const result = filterParams(input);

      expect(result).toStrictEqual({});
    });

    it('should remove null values', () => {
      const input = { a: 1, b: null, c: 'test' };

      const result = filterParams(input);

      expect(result).toStrictEqual({ a: 1, c: 'test' });
    });

    it('should remove undefined values', () => {
      const input = { a: 1, b: undefined, c: 'test' };

      const result = filterParams(input);

      expect(result).toStrictEqual({ a: 1, c: 'test' });
    });

    it('should remove null and undefined values', () => {
      const input = { a: 1, b: null, c: undefined, d: 'test' };

      const result = filterParams(input);

      expect(result).toStrictEqual({ a: 1, d: 'test' });
    });

    it('should preserve falsy values that are not null or undefined', () => {
      const input = { a: 0, b: false, c: '', d: null, e: undefined };

      const result = filterParams(input);

      expect(result).toStrictEqual({ a: 0, b: false, c: '' });
    });
  });

  describe('when omitting fields', () => {
    it('should handle undefined omit array', () => {
      const input = { a: 1, b: null, c: 3 };

      const result = filterParams(input, undefined);

      expect(result).toStrictEqual({ a: 1, c: 3 });
    });

    it('should handle empty omit array', () => {
      const input = { a: 1, b: null, c: 3 };

      const result = filterParams(input, []);

      expect(result).toStrictEqual({ a: 1, c: 3 });
    });

    it('should handle omit keys that do not exist in params', () => {
      const input = { a: 1, b: 2 };

      const result = filterParams(input, ['c', 'd']);

      expect(result).toStrictEqual({ a: 1, b: 2 });
    });

    it('should handle duplicate keys in omit array', () => {
      const input = { a: 1, b: 2, c: 3 };

      const result = filterParams(input, ['b', 'b', 'c']);

      expect(result).toStrictEqual({ a: 1 });
    });

    it('should omit specified keys', () => {
      const input = { a: 1, b: 2, c: 3, d: 4 };

      const result = filterParams(input, ['b', 'd']);

      expect(result).toStrictEqual({ a: 1, c: 3 });
    });

    it('should omit specified keys and filter null/undefined values', () => {
      const input = { a: 1, b: null, c: 3, d: undefined, e: 5 };

      const result = filterParams(input, ['c', 'e']);

      expect(result).toStrictEqual({ a: 1 });
    });

    it('should omit all keys', () => {
      const input = { a: 1, b: 2, c: 3, d: 4 };

      const result = filterParams(input, ['a', 'b', 'c', 'd']);

      expect(result).toStrictEqual({});
    });

    it('should omit non-primitive keys', () => {
      const input = {
        user: { id: 1, name: 'John' },
        settings: null,
        permissions: ['read', 'write'],
        metadata: undefined,
        active: true,
      };

      const result = filterParams(input, ['permissions']);

      expect(result).toStrictEqual({
        user: { id: 1, name: 'John' },
        active: true,
      });
    });

    it('should omit all non-primitive keys', () => {
      const input = {
        user: { id: 1, name: 'John' },
        settings: null,
        permissions: ['read', 'write'],
        metadata: undefined,
      };

      const result = filterParams(input, ['user', 'permissions']);

      expect(result).toStrictEqual({});
    });
  });
});

describe(appendSearchParams.name, () => {
  let url: URL;

  beforeEach(() => {
    url = new URL('https://example.com');
  });

  describe('when parameter is primitive', () => {
    it('should append string parameters', () => {
      const params = { name: 'name', city: 'city' };

      appendSearchParams(url, params);

      expect(url.searchParams.get('name')).toBe('name');
      expect(url.searchParams.get('city')).toBe('city');
    });

    it('should append number parameters', () => {
      const params = { age: 25, streetNumber: 100 };

      appendSearchParams(url, params);

      expect(url.searchParams.get('age')).toBe('25');
      expect(url.searchParams.get('streetNumber')).toBe('100');
    });

    it('should append boolean parameters', () => {
      const params = { active: true, verified: false };

      appendSearchParams(url, params);

      expect(url.searchParams.get('active')).toBe('true');
      expect(url.searchParams.get('verified')).toBe('false');
    });

    it('should append null and undefined', () => {
      const params = { null: null, undefined: undefined };

      appendSearchParams(url, params);

      expect(url.searchParams.get('null')).toBe('null');
      expect(url.searchParams.get('undefined')).toBe('undefined');
    });
  });

  describe('when parameter is an array', () => {
    it('should handle empty array', () => {
      const params = { value: [] };

      appendSearchParams(url, params);

      expect(url.searchParams.getAll('value')).toStrictEqual([]);
      expect(url.searchParams.has('value')).toBe(false);
    });

    it('should append an array with single element', () => {
      const params = { value: ['value'] };

      appendSearchParams(url, params);

      expect(url.searchParams.getAll('value')).toStrictEqual(['value']);
    });

    it('should append an array with multiple elements of the same type', () => {
      const params = { value: ['javascript', 'typescript', 'react'] };

      appendSearchParams(url, params);

      expect(url.searchParams.getAll('value')).toStrictEqual(['javascript', 'typescript', 'react']);
    });

    it('should append an array with multiple elements of different types', () => {
      const params = { value: [1, 'string', true, null, undefined] };

      appendSearchParams(url, params);

      expect(url.searchParams.getAll('value')).toStrictEqual([
        '1',
        'string',
        'true',
        'null',
        'undefined',
      ]);
    });
  });

  describe('when parameter is Date', () => {
    it('should append single Date object as ISO string', () => {
      const params = { value: new Date('2025-12-12T10:00:00.000Z') };

      appendSearchParams(url, params);

      expect(url.searchParams.get('value')).toBe('2025-12-12T10:00:00.000Z');
    });

    it('should append multiple Date objects as ISO strings', () => {
      const params = {
        startDate: new Date('2025-11-12T10:00:00.000Z'),
        endDate: new Date('2025-12-12T10:00:00.000Z'),
      };

      appendSearchParams(url, params);

      expect(url.searchParams.get('startDate')).toBe('2025-11-12T10:00:00.000Z');
      expect(url.searchParams.get('endDate')).toBe('2025-12-12T10:00:00.000Z');
    });
  });

  describe('when parameter is an object', () => {
    it('should handle empty object', () => {
      const params = { value: {} };

      appendSearchParams(url, params);

      expect(url.searchParams.get('value')).toBe('{}');
    });

    it('should serialize simple objects as JSON', () => {
      const params = { value: { user: { id: 1, name: 'John' } } };

      appendSearchParams(url, params);

      expect(url.searchParams.get('value')).toBe('{"user":{"id":1,"name":"John"}}');
    });

    it('should serialize nested objects as JSON', () => {
      const params = {
        value: {
          user: {
            id: 1,
            name: 'John',
            address: { streetNumber: 100 },
            permissions: ['read', 'write'],
          },
        },
      };

      appendSearchParams(url, params);

      expect(url.searchParams.get('value')).toBe(
        '{"user":{"id":1,"name":"John","address":{"streetNumber":100},"permissions":["read","write"]}}',
      );
    });

    it('should throw HttpParamSerializationError for non-serializable objects', () => {
      const circular: Record<string, unknown> = { name: 'test' };
      circular.self = circular;

      expect(() => {
        appendSearchParams(url, { circular });
      }).toThrow(HttpParamSerializationError);
    });
  });

  describe('when other search parameters already exist', () => {
    it('should preserve existing search parameters', () => {
      const url = new URL('https://example.com?one=1');
      const params = { two: 2 };

      appendSearchParams(url, params);

      expect(url.searchParams.get('one')).toBe('1');
      expect(url.searchParams.get('two')).toBe('2');
    });

    it('should append to existing search parameters', () => {
      const url = new URL('https://example.com?one=1');
      const params = { one: 2 };

      appendSearchParams(url, params);

      expect(url.searchParams.getAll('one')).toStrictEqual(['1', '2']);
    });
  });

  describe('when search parameters contain special characters', () => {
    it('should handle params with special characters in keys', () => {
      const params = {
        'special-key': 'specialKey',
        'key with spaces': 'keyWithSpaces',
      };

      appendSearchParams(url, params);

      expect(url.searchParams.get('special-key')).toBe('specialKey');
      expect(url.searchParams.get('key with spaces')).toBe('keyWithSpaces');
    });

    it('should handle params with special characters in values', () => {
      const params = {
        text: 'hello world!',
        symbols: '!@#$%^&*()',
        unicode: '🎉🚀',
      };

      appendSearchParams(url, params);

      expect(url.searchParams.get('text')).toBe('hello world!');
      expect(url.searchParams.get('symbols')).toBe('!@#$%^&*()');
      expect(url.searchParams.get('unicode')).toBe('🎉🚀');
    });
  });

  describe('when parameter contains mixed values', () => {
    it('should handle params with mixed values', () => {
      const params = {
        string: 'hello',
        number: 1,
        boolean: true,
        array: ['a', 'b', 'c'],
        date: new Date('2025-01-01T00:00:00.000Z'),
        object: { name: 'name' },
        null: null,
        undefined: undefined,
      };

      appendSearchParams(url, params);

      expect(url.searchParams.get('string')).toBe('hello');
      expect(url.searchParams.get('number')).toBe('1');
      expect(url.searchParams.get('boolean')).toBe('true');
      expect(url.searchParams.getAll('array')).toStrictEqual(['a', 'b', 'c']);
      expect(url.searchParams.get('date')).toStrictEqual('2025-01-01T00:00:00.000Z');
      expect(url.searchParams.get('object')).toBe('{"name":"name"}');
      expect(url.searchParams.get('null')).toBe('null');
      expect(url.searchParams.get('undefined')).toBe('undefined');
    });
  });
});

describe(buildUrl.name, () => {
  describe('when no parameters is provided', () => {
    describe('when trailing slash is not provided', () => {
      const url = 'https://api.example.com';

      it('should build basic URL', () => {
        const result = buildUrl(url);

        expect(result).toBe(`${url}/`);
      });

      it('should build URL with baseUrl and path', () => {
        const result = buildUrl(url, '/users/1');

        expect(result).toBe(`${url}/users/1`);
      });
    });

    describe('when trailing slash is provided', () => {
      const url = 'https://api.example.com/';

      it('should build basic URL', () => {
        const result = buildUrl(url);

        expect(result).toBe(url);
      });

      it('should build URL with baseUrl and path', () => {
        const result = buildUrl(url, '/users/1');

        expect(result).toBe(`${url}users/1`);
      });
    });

    it('should overwrite baseUrl path', () => {
      const result = buildUrl('https://api.example.com/v1/users', '/v2/users');

      expect(result).toBe('https://api.example.com/v2/users');
    });

    it('shouldoverwrite baseUrl query parameters', () => {
      const params = { page: 2 };

      const result = buildUrl('https://api.example.com?version=1', '/users', params);

      expect(result).toBe('https://api.example.com/users?page=2');
    });

    it('should propagate HttpParamSerializationError from appendSearchParams', () => {
      const circular: Record<string, unknown> = { name: 'test' };
      circular.self = circular;

      expect(() => {
        buildUrl('https://api.example.com', '/test', { circular });
      }).toThrow(HttpParamSerializationError);
    });
  });

  describe('when parameters are provided', () => {
    it('should build URL with parameters', () => {
      const params = { name: 'John', age: null, active: true, permissions: ['read', 'write'] };

      const result = buildUrl('https://api.example.com', '/users', params, ['active']);

      expect(result).toBe(
        'https://api.example.com/users?name=John&permissions=read&permissions=write',
      );
    });

    it('should throw InvalidURLError for invalid baseUrl with correct details', () => {
      try {
        buildUrl('invalid-url', '/path');
      } catch (err) {
        expect(err).toBeInstanceOf(InvalidURLError);
        expect((err as Error).message).toContain('invalid-url');
        expect((err as Error).message).toContain('/path');
      }
    });
  });
});

describe(sleep.name, () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should return a Promise that resolves after specified number of milliseconds', async () => {
    const promise = sleep(1000);

    expect(promise).toBeInstanceOf(Promise);

    jest.advanceTimersByTime(999);
    expect(jest.getTimerCount()).toBe(1);

    jest.advanceTimersByTime(1);
    await expect(promise).resolves.toBeUndefined();
  });

  it('should handle zero milliseconds', async () => {
    const promise = sleep(0);

    jest.advanceTimersByTime(0);

    await expect(promise).resolves.toBeUndefined();
  });

  it('should handle multiple concurrent calls', async () => {
    const promise1 = sleep(100);
    const promise2 = sleep(200);

    jest.advanceTimersByTime(100);
    await expect(promise1).resolves.toBeUndefined();
    expect(jest.getTimerCount()).toBe(1);

    jest.advanceTimersByTime(100);
    await expect(promise2).resolves.toBeUndefined();
    expect(jest.getTimerCount()).toBe(0);
  });

  it('should work properly with async/await', async () => {
    const results: string[] = [];

    const execution = (async () => {
      results.push('Start');
      await sleep(100);
      results.push('End');
    })();

    expect(results).toStrictEqual(['Start']);

    jest.advanceTimersByTime(100);
    await execution;

    expect(results).toStrictEqual(['Start', 'End']);
  });
});

describe(mergeHeaders.name, () => {
  describe('when arguments are empty', () => {
    it('should return empty headers', () => {
      const result = mergeHeaders();

      expect(result).toBeInstanceOf(Headers);
      expect(Array.from(result.entries())).toStrictEqual([]);
    });
  });

  describe('when only base headers are provided', () => {
    it('should return proper headers', () => {
      const base = { 'Content-Type': 'application/json', Authorization: 'Authorization' };

      const result = mergeHeaders(base);

      expect(result.get('content-type')).toBe('application/json');
      expect(result.get('authorization')).toBe('Authorization');
    });
  });

  describe('when only override headers are provided', () => {
    it('should return proper headers', () => {
      const override = { 'Content-Type': 'application/json', Authorization: 'Authorization' };

      const result = mergeHeaders(undefined, override);

      expect(result.get('content-type')).toBe('application/json');
      expect(result.get('authorization')).toBe('Authorization');
    });
  });

  describe('when base and override headers are provided', () => {
    it('should properly merge headers', () => {
      const base = { 'Content-Type': 'application/json', Authorization: 'Authorization' };
      const override = { Accept: 'application/json', 'User-Agent': 'User-Agent' };

      const result = mergeHeaders(base, override);

      expect(result.get('content-type')).toBe('application/json');
      expect(result.get('authorization')).toBe('Authorization');
      expect(result.get('accept')).toBe('application/json');
      expect(result.get('user-agent')).toBe('User-Agent');
    });

    it('should properly override base headers', () => {
      const base = { 'Content-Type': 'application/xml' };
      const override = { 'Content-Type': 'application/json' };

      const result = mergeHeaders(base, override);

      expect(result.get('content-type')).toBe('application/json');
    });

    it('should properly override base headers with different casing', () => {
      const base = { 'CONTENT-TYPE': 'application/xml' };
      const override = { 'content-type': 'application/json' };

      const result = mergeHeaders(base, override);

      expect(result.get('content-type')).toBe('application/json');
    });

    it('should trim whitespace from header values', () => {
      const base = { 'CONTENT-TYPE': '  application/xml' };
      const override = { 'content-type': 'application/json  ' };

      const result = mergeHeaders(base, override);

      expect(result.get('content-type')).toBe('application/json');
    });

    it('should skip headers with empty or whitespace-only values', () => {
      const base = {
        'Content-Type': 'application/json',
        Empty: '',
        Whitespace: '   ',
        Tab: '\t',
        Newline: '\n',
      };
      const override = {
        Accept: 'application/json',
        'Another-Empty': '',
        'Another-Whitespace': '  \t  ',
      };

      const result = mergeHeaders(base, override);

      expect(result.get('content-type')).toBe('application/json');
      expect(result.get('accept')).toBe('application/json');
      expect(result.get('empty')).toBeNull();
      expect(result.get('whitespace')).toBeNull();
      expect(result.get('tab')).toBeNull();
      expect(result.get('newline')).toBeNull();
      expect(result.get('another-empty')).toBeNull();
      expect(result.get('another-whitespace')).toBeNull();
    });

    it('should handle null and undefined values', () => {
      const base = {
        'Content-Type': 'application/json',
        'Null-Header': null as unknown as string,
        'Undefined-Header': undefined as unknown as string,
      };

      const result = mergeHeaders(base);

      expect(result.get('content-type')).toBe('application/json');
      expect(result.get('null-header')).toBeNull();
      expect(result.get('undefined-header')).toBeNull();
    });
  });
});

describe(convertHeaders.name, () => {
  describe('when headers are invalid', () => {
    it.each([null, undefined, true, false, 'string', 123])(
      'should return empty object for %p',
      (input) => {
        const result = convertHeaders(input as unknown as Headers);

        expect(result).toStrictEqual({});
      },
    );
  });

  describe('when headers are empty', () => {
    it('should return proper result for empty Headers', () => {
      const headers = new Headers();

      const result = convertHeaders(headers);

      expect(result).toStrictEqual({});
    });

    it('should return proper result for empty array', () => {
      const result = convertHeaders([]);

      expect(result).toStrictEqual({});
    });

    it('should return proper result for empty object', () => {
      const headers = {};

      const result = convertHeaders(headers);

      expect(result).toStrictEqual({});
    });
  });

  describe('when headers are provided', () => {
    it('should convert Headers object to plain object', () => {
      const headers = new Headers([
        ['Content-Type', 'application/json'],
        ['Authorization', 'Authorization'],
      ]);

      const result = convertHeaders(headers);

      expect(result).toStrictEqual({
        'content-type': 'application/json',
        authorization: 'Authorization',
      });
    });

    it('should convert array of tuples to plain object', () => {
      const headers: [string, string][] = [
        ['Content-Type', 'application/json'],
        ['Authorization', 'Authorization'],
      ];

      const result = convertHeaders(headers);

      expect(result).toStrictEqual({
        'Content-Type': 'application/json',
        Authorization: 'Authorization',
      });
    });

    it('should convert plain object with string values', () => {
      const headers = {
        'Content-Type': 'application/json',
        Authorization: 'Authorization',
      };

      const result = convertHeaders(headers);

      expect(result).toStrictEqual({
        'Content-Type': 'application/json',
        Authorization: 'Authorization',
      });
    });
  });
});

describe(isAbortError.name, () => {
  it('should return true for AbortError instance', () => {
    const error = new AbortError();

    const result = isAbortError(error);

    expect(result).toBe(true);
  });

  it('should return true for Error with name "AbortError"', () => {
    const error = new Error();
    error.name = 'AbortError';

    const result = isAbortError(error);

    expect(result).toBe(true);
  });

  it('should return true for Error with message containing "aborted"', () => {
    const error1 = new Error('Request was aborted');
    const error2 = new Error('Operation aborted by user');
    const error3 = new Error('The fetch was aborted');

    const result1 = isAbortError(error1);
    const result2 = isAbortError(error2);
    const result3 = isAbortError(error3);

    expect(result1).toBe(true);
    expect(result2).toBe(true);
    expect(result3).toBe(true);
  });

  it('should return false for regular Error', () => {
    const error = new Error();

    const result = isAbortError(error);

    expect(result).toBe(false);
  });
});

describe(getError.name, () => {
  it('should return the same Error if input is already an Error', () => {
    const originalError = new Error('Original error message');

    const result = getError(originalError);

    expect(result).toBe(originalError);
    expect(result.message).toBe('Original error message');
  });

  it('should convert string to Error', () => {
    const result = getError('Something went wrong');

    expect(result).toBeInstanceOf(Error);
    expect(result.message).toBe('Something went wrong');
  });

  it('should convert number to Error', () => {
    const result = getError(404);

    expect(result).toBeInstanceOf(Error);
    expect(result.message).toBe('404');
  });

  it('should convert boolean to Error', () => {
    const result = getError(false);

    expect(result).toBeInstanceOf(Error);
    expect(result.message).toBe('false');
  });

  it('should convert object to Error', () => {
    const obj = { code: 500, message: 'Server error' };

    const result = getError(obj);

    expect(result).toBeInstanceOf(Error);
    expect(result.message).toBe('[object Object]');
  });

  it('should convert null to Error', () => {
    const result = getError(null);

    expect(result).toBeInstanceOf(Error);
    expect(result.message).toBe('null');
  });

  it('should convert undefined to Error', () => {
    const result = getError(undefined);

    expect(result).toBeInstanceOf(Error);
    expect(result.message).toBe('undefined');
  });

  it('should preserve Error subclasses', () => {
    const typeError = new TypeError('Type error message');

    const result = getError(typeError);

    expect(result).toBe(typeError);
    expect(result).toBeInstanceOf(TypeError);
    expect(result.message).toBe('Type error message');
  });
});
