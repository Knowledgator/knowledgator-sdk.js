import type { Logger } from './types';

export const createDefaultLogger = (debug: boolean = false): Logger => ({
  debug: debug ? (msg, meta) => console.log(`[DEBUG] ${msg}`, meta) : () => {},
  info: (msg, meta) => console.log(`[INFO] ${msg}`, meta),
  warn: (msg, meta) => console.warn(`[WARN] ${msg}`, meta),
  error: (msg, meta) => console.error(`[ERROR] ${msg}`, meta),
});
