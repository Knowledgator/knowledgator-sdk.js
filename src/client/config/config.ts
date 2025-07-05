import { InvalidAttemptError, InvalidBaseDelayError, InvalidMaxDelayError } from '../errors';

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
    delay *=
      Math.random() * ((policy?.jitterMax ?? 0) - (policy?.jitterMin ?? 0)) +
      (policy?.jitterMin ?? 0);
  }

  return delay;
};
