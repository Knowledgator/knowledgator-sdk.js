import { getE2EClient } from './setup';

const client = getE2EClient();

const runTest = client ? describe : describe.skip;

runTest('Instruct API E2E', () => {
  it('executes instruct inference against live API', async () => {
    const results = await client!.instruct.it({
      text: 'What are the main features of TypeScript 5?',
      output_type: 'json',
      template: JSON.stringify({ summary: '', key_points: [] }),
    });

    expect(results).toBeDefined();
    expect(results.outputs).toBeDefined();
  }, 60000);
});
