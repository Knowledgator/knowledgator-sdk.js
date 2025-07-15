import {
  InvalidAttemptError,
  InvalidBaseDelayError,
  InvalidJitterRangeError,
  InvalidMaxDelayError,
} from '../errors';

import type { RetryPolicy } from './types';

export const shouldRetry = (policy: RetryPolicy | undefined, status: number): boolean => {
  const retryableStatuses = policy?.retryableStatuses ?? [];

  return status >= 500 || retryableStatuses.includes(status);
};

export const calculateBackoff = (policy: RetryPolicy | undefined, attempt: number): number => {
  if (attempt < 0) {
    throw new InvalidAttemptError(attempt);
  }

  const baseDelay = policy?.baseDelay ?? 0;

  if (baseDelay < 0) {
    throw new InvalidBaseDelayError(baseDelay);
  }

  const maxDelay = policy?.maxDelay ?? 0;

  if (maxDelay < 0) {
    throw new InvalidMaxDelayError(maxDelay);
  }

  const jitter = policy?.jitter;

  let delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);

  if (jitter) {
    const jitterMin = policy?.jitterMin ?? 0.5;
    const jitterMax = policy?.jitterMax ?? 1.5;

    if (jitterMin < 0 || jitterMax < 0 || jitterMin > jitterMax) {
      throw new InvalidJitterRangeError(jitterMin, jitterMax);
    }

    const jitterMultiplier = Math.random() * (jitterMax - jitterMin) + jitterMin;
    delay *= jitterMultiplier;
  }

  return Math.max(0, Math.min(delay, maxDelay));
};
