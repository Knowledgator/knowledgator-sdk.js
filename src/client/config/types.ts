export interface RetryPolicy {
  readonly maxTries?: number;
  readonly baseDelay?: number;
  readonly maxDelay?: number;
  readonly retryableStatuses?: readonly number[];
  readonly jitter?: boolean;
}
