import { getE2EClient } from './setup';

const client = getE2EClient();
const runTest = client ? describe : describe.skip;

runTest('Open Model API E2E', () => {
  it('executes open model prediction against live API without failure', async () => {
    const body = {
      input: 'Steve Jobs founded Apple Inc. in Cupertino, California.',
      tasks: {
        topic: { type: 'classify', labels: ['technology', 'sports', 'politics'], threshold: 0.5 },
        entities: { type: 'span', labels: ['person', 'organization', 'location'] },
      },
      options: { include_usage: true },
    };

    const results = (await client!.model('gliformer-large-v1').predict(body)) as Record<
      string,
      unknown
    >;

    expect(results).toBeDefined();
    expect(typeof results).toBe('object');
    expect('outputs' in results).toBe(true);
  }, 60000);
});
