import { InvalidAttemptError, InvalidBaseDelayError, InvalidMaxDelayError } from '../errors';

import { DEFAULT_RETRY_POLICY, JITTER_MAX, JITTER_MIN } from './defaults';
import type { RetryPolicy } from './types';

export const shouldRetry = (policy: RetryPolicy | undefined, status: number): boolean => {
  const retryableStatuses = policy?.retryableStatuses ?? DEFAULT_RETRY_POLICY.retryableStatuses;

  return status >= 500 || retryableStatuses.includes(status);
};

export const calculateBackoff = (policy: RetryPolicy | undefined, attempt: number): number => {
  if (attempt < 0) {
    throw new InvalidAttemptError(attempt);
  }

  const baseDelay = policy?.baseDelay ?? DEFAULT_RETRY_POLICY.baseDelay;

  if (baseDelay < 0) {
    throw new InvalidBaseDelayError(baseDelay);
  }

  const maxDelay = policy?.maxDelay ?? DEFAULT_RETRY_POLICY.maxDelay;

  if (maxDelay < 0) {
    throw new InvalidMaxDelayError(maxDelay);
  }

  const jitter = policy?.jitter ?? DEFAULT_RETRY_POLICY.jitter;

  let delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);

  if (jitter) {
    delay *= Math.random() * (JITTER_MAX - JITTER_MIN) + JITTER_MIN;
  }

  return delay;
};
