import { getE2EClient } from './setup';

const client = getE2EClient();

const runTest = client ? describe : describe.skip;

runTest('Finetuning API E2E', () => {
  it('lists base models', async () => {
    const results = await client!.finetuning.listModels({ limit: 10 });
    expect(results).toBeDefined();
  }, 60000);

  it('lists model types', async () => {
    const results = await client!.finetuning.listModelTypes();
    expect(results).toBeDefined();
  }, 60000);

  it('lists training jobs', async () => {
    const results = await client!.finetuning.listTrainings({ limit: 10 });
    expect(results).toBeDefined();
  }, 60000);
});
