import { InvalidAttemptError, InvalidBaseDelayError, InvalidMaxDelayError } from '../../errors';
import { calculateBackoff, shouldRetry } from '../config';
import type { RetryPolicy } from '../types';

describe(shouldRetry.name, () => {
  describe('when policy is undefined', () => {
    it.each([
      { statusCode: 500, expected: true },
      { statusCode: 501, expected: true },
      { statusCode: 400, expected: false },
      { statusCode: 401, expected: false },
      { statusCode: 300, expected: false },
      { statusCode: 301, expected: false },
      { statusCode: 200, expected: false },
      { statusCode: 201, expected: false },
      { statusCode: 100, expected: false },
      { statusCode: 101, expected: false },
    ])('should return $expected for $statusCode status code', ({ statusCode, expected }) => {
      expect(shouldRetry(undefined, statusCode)).toBe(expected);
    });
  });

  describe('when policy is defined', () => {
    describe('when retryableStatuses are undefined', () => {
      const policy: RetryPolicy = {
        retryableStatuses: undefined,
      };

      it.each([
        { statusCode: 500, expected: true },
        { statusCode: 400, expected: false },
        { statusCode: 300, expected: false },
        { statusCode: 200, expected: false },
        { statusCode: 100, expected: false },
      ])('should return $expected for $statusCode status code', ({ statusCode, expected }) => {
        expect(shouldRetry(policy, statusCode)).toBe(expected);
      });
    });

    describe('when retryableStatuses are empty', () => {
      const policy: RetryPolicy = {
        retryableStatuses: [],
      };

      it.each([
        { statusCode: 500, expected: true },
        { statusCode: 400, expected: false },
        { statusCode: 300, expected: false },
        { statusCode: 200, expected: false },
        { statusCode: 100, expected: false },
      ])('should return $expected for $statusCode status code', ({ statusCode, expected }) => {
        expect(shouldRetry(policy, statusCode)).toBe(expected);
      });
    });

    describe('when retryableStatuses are defined', () => {
      const policy: RetryPolicy = {
        retryableStatuses: [400, 300, 100],
      };

      it.each([
        { statusCode: 500, expected: true },
        { statusCode: 400, expected: true },
        { statusCode: 300, expected: true },
        { statusCode: 200, expected: false },
        { statusCode: 100, expected: true },
      ])('should return $expected for $statusCode status code', ({ statusCode, expected }) => {
        expect(shouldRetry(policy, statusCode)).toBe(expected);
      });
    });
  });
});

describe(calculateBackoff.name, () => {
  describe('when attempt is negative', () => {
    it('should throw InvalidAttemptError', () => {
      expect(() => {
        calculateBackoff(undefined, -1);
      }).toThrow(InvalidAttemptError);
    });
  });

  describe('when attempt is zero or positive', () => {
    it.each([0, 1])('should return 0 for attempt %s', (attempt) => {
      expect(calculateBackoff(undefined, attempt)).toBe(0);
    });
  });

  describe('when baseDelay is negative', () => {
    it('should throw InvalidBaseDelayError', () => {
      const policy: RetryPolicy = {
        baseDelay: -1,
      };

      expect(() => {
        calculateBackoff(policy, 0);
      }).toThrow(InvalidBaseDelayError);
    });
  });

  describe('when baseDelay is zero or positive', () => {
    it.each([0, 1])('should return 0 for baseDelay %s', (baseDelay) => {
      const policy: RetryPolicy = {
        baseDelay,
      };

      expect(calculateBackoff(policy, 0)).toBe(0);
    });
  });

  describe('when maxDelay is negative', () => {
    it('should throw InvalidMaxDelayError', () => {
      const policy: RetryPolicy = {
        baseDelay: 0,
        maxDelay: -1,
      };

      expect(() => {
        calculateBackoff(policy, 0);
      }).toThrow(InvalidMaxDelayError);
    });
  });

  describe('when maxDelay is zero or positive', () => {
    it.each([0, 1])('should return 0 for maxDelay %s', (maxDelay) => {
      const policy: RetryPolicy = {
        baseDelay: 0,
        maxDelay,
      };

      expect(calculateBackoff(policy, 0)).toBe(0);
    });
  });

  describe('when jitter is false', () => {
    const policy: RetryPolicy = {
      baseDelay: 1000,
      maxDelay: 10_000,
      jitter: false,
    };

    it.each([
      { attempt: 0, expected: 1000 },
      { attempt: 1, expected: 2000 },
      { attempt: 2, expected: 4000 },
      { attempt: 3, expected: 8000 },
      { attempt: 4, expected: 10_000 },
      { attempt: 5, expected: 10_000 },
    ])('should return $expected for attempt $attempt', ({ attempt, expected }) => {
      expect(calculateBackoff(policy, attempt)).toBe(expected);
    });
  });

  describe('when jitter is true', () => {
    describe('when jitter range is not provided', () => {
      const policy: RetryPolicy = {
        baseDelay: 1000,
        maxDelay: 10_000,
        jitter: true,
      };

      it.each([{ attempt: 0 }, { attempt: 1 }, { attempt: 2 }])(
        'should return 0 for attempt $attempt',
        ({ attempt }) => {
          expect(calculateBackoff(policy, attempt)).toBe(0);
        },
      );
    });

    describe('when jitter range is provided', () => {
      const policy: RetryPolicy = {
        baseDelay: 1000,
        maxDelay: 10_000,
        jitter: true,
        jitterMin: 0.5,
        jitterMax: 1.5,
      };

      afterEach(() => {
        jest.restoreAllMocks();
      });

      describe('should apply minimum jitter', () => {
        beforeEach(() => {
          jest.spyOn(Math, 'random').mockReturnValue(0);
        });

        it.each([
          { attempt: 0, expected: 500 },
          { attempt: 1, expected: 1000 },
          { attempt: 2, expected: 2000 },
        ])('should apply jitter to delay for attempt $attempt', ({ attempt, expected }) => {
          expect(calculateBackoff(policy, attempt)).toBe(expected);
        });
      });
      describe('should apply middle jitter', () => {
        beforeEach(() => {
          jest.spyOn(Math, 'random').mockReturnValue(0.5);
        });

        it.each([
          { attempt: 0, expected: 1000 },
          { attempt: 1, expected: 2000 },
          { attempt: 2, expected: 4000 },
        ])('should apply jitter to delay for attempt $attempt', ({ attempt, expected }) => {
          expect(calculateBackoff(policy, attempt)).toBe(expected);
        });
      });
      describe('should apply maximum jitter', () => {
        beforeEach(() => {
          jest.spyOn(Math, 'random').mockReturnValue(1);
        });

        it.each([
          { attempt: 0, expected: 1500 },
          { attempt: 1, expected: 3000 },
          { attempt: 2, expected: 6000 },
        ])('should apply jitter to delay for attempt $attempt', ({ attempt, expected }) => {
          expect(calculateBackoff(policy, attempt)).toBe(expected);
        });
      });
    });
  });
});
