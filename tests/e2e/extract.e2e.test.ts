import type { ExtractRequest } from '../../src';

import { getE2EClient } from './setup';

const client = getE2EClient();

const runTest = client ? describe : describe.skip;

runTest('Extract API E2E', () => {
  it('executes extract entity inference against live API', async () => {
    const res = await client!.extract.it({
      text: 'Steve Jobs co-founded Apple Inc. in California.',
      tasks: {
        entities: {
          type: 'span',
          labels: ['person', 'organization', 'location'],
        },
      },
    });

    expect(res).toBeDefined();
    expect(res.outputs).toBeDefined();
    expect(res.entities).toBeDefined();
  }, 60000);

  it('throws TypeError when passing removed labels argument', async () => {
    await expect(
      client!.extract.it({
        text: 'Steve Jobs co-founded Apple Inc.',
        labels: ['person', 'organization'],
      } as unknown as ExtractRequest),
    ).rejects.toThrow(TypeError);
  });
});
