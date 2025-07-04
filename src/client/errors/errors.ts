export class AbortError extends Error {
  constructor(message: string = 'Request was aborted') {
    super(message);
    this.name = 'AbortError';
  }
}

export class HttpError extends Error {
  constructor(public readonly response: Response) {
    super(`HTTP ${response.status}: ${response.statusText}`);
    this.name = 'HttpError';
  }
}

export class HttpTimeoutError extends Error {
  constructor(
    public readonly timeout: number,
    public readonly url: string,
    public readonly method: string,
    public readonly attempt: number,
  ) {
    super(`Request timed out after ${timeout}ms for ${method} ${url} (attempt ${attempt})`);
    this.name = 'HttpTimeoutError';
  }
}

export class HttpRetryError extends Error {
  constructor(
    public readonly lastResponseStatus: number | null,
    public readonly lastResponseStatusText: string | null,
    public readonly lastErrorMessage: string | null,
    public readonly attempts: number,
    public readonly url: string,
    public readonly method: string,
  ) {
    super(`Request failed after ${attempts} attempts for ${method} ${url}`);
    this.name = 'HttpRetryError';
  }
}

export class HttpParamSerializationError extends Error {
  constructor(
    public readonly key: string,
    public readonly value: unknown,
    public readonly originalError: Error,
  ) {
    super(`Failed to serialize query param "${key}": ${originalError.message}`);
    this.name = 'HttpParamSerializationError';
  }
}

export class InvalidURLError extends Error {
  constructor(
    public readonly baseUrl: string,
    public readonly path?: string,
  ) {
    super(`Invalid URL: baseUrl="${baseUrl}", path="${path}"`);
    this.name = 'InvalidURLError';
  }
}

export class InvalidAttemptError extends Error {
  constructor(attempt: number) {
    super(`Attempt must be non-negative, got: ${attempt}`);
    this.name = 'InvalidAttemptError';
  }
}

export class InvalidBaseDelayError extends Error {
  constructor(baseDelay: number) {
    super(`Base delay must be non-negative, got: ${baseDelay}`);
    this.name = 'InvalidBaseDelayError';
  }
}

export class InvalidMaxDelayError extends Error {
  constructor(maxDelay: number) {
    super(`Max delay must be non-negative, got: ${maxDelay}`);
    this.name = 'InvalidMaxDelayError';
  }
}

export class InterceptorError extends Error {
  constructor(
    public readonly type: 'request' | 'response',
    public readonly originalError: Error,
    public readonly url: string,
    public readonly method: string,
    public readonly attempt: number,
  ) {
    super(
      `${type === 'request' ? 'Request' : 'Response'} interceptor failed for ${method} ${url} (attempt ${attempt}): ${originalError.message}`,
    );
    this.name = 'InterceptorError';
    this.cause = originalError;
  }
}

export class UnexpectedError extends Error {
  constructor(message: string = 'An unexpected error occurred') {
    super(message);
    this.name = 'UnexpectedError';
  }
}

export class EndpointNotConfiguredError extends Error {
  constructor(endpointName: string) {
    super(
      `${endpointName} endpoint not configured. Please provide a ${endpointName} endpoint in the SDK configuration.`,
    );
    this.name = 'EndpointNotConfiguredError';
  }
}
