import { getE2EClient } from './setup';

const client = getE2EClient();

const runTest = client ? describe : describe.skip;

runTest('Datasets API E2E', () => {
  it('lists datasets', async () => {
    const results = await client!.datasets.list({ limit: 10 });
    expect(results).toBeDefined();
    expect(Array.isArray(results.datasets)).toBe(true);
  }, 60000);

  it('lists dataset formats', async () => {
    const results = await client!.datasets.listFormats();
    expect(results).toBeDefined();
    expect(Array.isArray(results.formats)).toBe(true);
    expect(results.formats.length).toBeGreaterThan(0);
  }, 60000);

  it('lists dataset data entries', async () => {
    try {
      const results = await client!.datasets.listData({ limit: 10 });
      expect(results).toBeDefined();
    } catch (err: unknown) {
      // /data/ endpoint requires user session token (returns 401 with API Key auth)
      const message = err instanceof Error ? err.message : String(err);
      expect(message).toMatch(/401|invalid_token|unauthorized/i);
    }
  }, 60000);
});
