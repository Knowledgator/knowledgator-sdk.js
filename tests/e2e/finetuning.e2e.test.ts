import { getE2EClient } from './setup';

const client = getE2EClient();

const runTest = client ? describe : describe.skip;

runTest('Finetuning API E2E', () => {
  it('lists base models', async () => {
    const results = await client!.finetuning.listModels({ limit: 10 });
    expect(results).toBeDefined();
  }, 60000);

  it('lists training jobs and gets evaluations if available', async () => {
    const results = await client!.finetuning.listTrainings({ limit: 10 });
    expect(results).toBeDefined();
    const trainings = results.trainings ?? results.data ?? [];
    if (trainings.length > 0) {
      const evalRes = await client!.finetuning.getEvaluations(trainings[0].id);
      expect(evalRes).toBeDefined();
    }
  }, 60000);
});
