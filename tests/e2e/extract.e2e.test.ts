import { getE2EClient } from './setup';

const client = getE2EClient();

const runTest = client ? describe : describe.skip;

runTest('Extract API E2E', () => {
  it('executes extract entity inference against live API', async () => {
    const results = await client!.extract.it({
      text: 'Steve Jobs co-founded Apple Inc. in California.',
      labels: ['person', 'organization', 'location'],
    });

    expect(results).toBeDefined();
    expect(results.results).toBeDefined();
    expect(Array.isArray(results.results)).toBe(true);
  }, 60000);
});
