import type { ComprehendRequest } from '../../src';

import { getE2EClient } from './setup';

const client = getE2EClient();

const runTest = client ? describe : describe.skip;

runTest('Comprehend API E2E', () => {
  it('executes comprehend inference against live API', async () => {
    const res = await client!.comprehend.it({
      text: 'SpaceX launched another Starship prototype rocket from Texas.',
      tasks: {
        topic: {
          type: 'classify',
          labels: ['aerospace', 'technology', 'sports'],
        },
      },
    });

    expect(res).toBeDefined();
    expect(res.outputs).toBeDefined();
    expect(res.topic).toBeDefined();
  }, 60000);

  it('throws TypeError when passing removed labels argument', async () => {
    await expect(
      client!.comprehend.it({
        text: 'SpaceX launched a rocket.',
        labels: ['aerospace', 'technology'],
      } as unknown as ComprehendRequest),
    ).rejects.toThrow(TypeError);
  });
});
