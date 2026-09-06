import { getE2EClient } from './setup';

const client = getE2EClient();

const runTest = client ? describe : describe.skip;

runTest('Comprehend API E2E', () => {
  it('executes comprehend inference against live API', async () => {
    const results = await client!.comprehend.it({
      text: 'SpaceX launched another Starship prototype rocket from Texas.',
      labels: ['aerospace', 'technology', 'sports'],
    });

    expect(results).toBeDefined();
    expect(results.results).toBeDefined();
    expect(Array.isArray(results.results)).toBe(true);
  }, 60000);
});
