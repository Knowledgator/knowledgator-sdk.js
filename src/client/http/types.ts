import type { RetryPolicy } from '../config/types';
import type { Logger } from '../logger/types';

export interface HttpConfig {
  readonly baseUrl?: string;
  readonly baseHeaders?: Record<string, string>;
  readonly timeout?: number;
  readonly retryPolicy?: RetryPolicy;
  readonly requestInterceptor?: (init: RequestInit) => RequestInit | Promise<RequestInit>;
  readonly responseInterceptor?: (response: Response) => Response | Promise<Response>;
  readonly logger?: Logger;
}

export interface HttpOptions extends Omit<RequestInit, 'method'> {
  readonly params?: Record<string, unknown>;
  readonly timeout?: number;
  readonly retries?: number;
  readonly omit?: readonly string[];
}
