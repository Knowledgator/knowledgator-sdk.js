import type { JestConfigWithTsJest } from 'ts-jest';

const config: JestConfigWithTsJest = {
  preset: 'ts-jest/presets/default',
  testEnvironment: 'node',
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.base.json',
      },
    ],
  },
  collectCoverage: false,
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.test.ts',
    '!src/**/*.spec.ts',
    '!src/__tests__/**',
    '!src/**/index.ts',
    '!src/**/types.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'text-summary', 'html', 'lcov', 'json', 'cobertura'],
  coveragePathIgnorePatterns: ['/node_modules/', '/dist/', '/coverage/', '\\.d\\.ts$'],
  coverageProvider: 'v8',
};

export default config;
