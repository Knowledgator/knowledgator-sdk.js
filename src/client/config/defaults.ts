import type { RetryPolicy } from './types';

export const ABSOLUTE_MAX_RETRIES = 20;
export const ABSOLUTE_MAX_TIMEOUT_MS = 30000;

export const JITTER_MIN = 0.5;
export const JITTER_MAX = 1.5;

export const DEFAULT_RETRY_POLICY: Required<RetryPolicy> = {
  maxTries: 3,
  baseDelay: 0.25,
  maxDelay: 10,
  retryableStatuses: [408, 409, 429] as const,
  jitter: true,
} as const;
