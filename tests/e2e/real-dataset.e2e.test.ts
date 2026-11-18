import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import { getE2EClient } from './setup';

const REAL_DATASET_ID = 'd655eda9-ca67-4a86-a8bc-5b3911233c79';

const client = getE2EClient();
const runTest = client ? describe : describe.skip;

function debugPrintSamples(title: string, parsed: unknown, fileSize: number): void {
  console.log(`\n========================= DEBUG: ${title} =========================`);
  console.log(`File Size on Disk: ${fileSize} bytes`);

  let items: unknown[] = [];
  if (Array.isArray(parsed)) {
    items = parsed;
  } else if (
    parsed &&
    typeof parsed === 'object' &&
    'data' in parsed &&
    Array.isArray((parsed as { data: unknown[] }).data)
  ) {
    items = (parsed as { data: unknown[] }).data;
  }

  const total = items.length;
  console.log(`Total Samples: ${total}`);

  if (total === 0) {
    console.log(`Raw Object: ${JSON.stringify(parsed, null, 2).slice(0, 500)}`);
  } else if (total === 1) {
    console.log(`\n[Single Sample (0/1)]:\n${JSON.stringify(items[0], null, 2)}`);
  } else if (total === 2) {
    console.log(`\n[First Sample (0/2)]:\n${JSON.stringify(items[0], null, 2)}`);
    console.log(`\n[Last Sample (1/2)]:\n${JSON.stringify(items[1], null, 2)}`);
  } else {
    const midIdx = Math.floor(total / 2);
    console.log(`\n[First Sample (0/${total})]:\n${JSON.stringify(items[0], null, 2)}`);
    console.log(
      `\n[Middle Sample (${midIdx}/${total})]:\n${JSON.stringify(items[midIdx], null, 2)}`,
    );
    console.log(
      `\n[Last Sample (${total - 1}/${total})]:\n${JSON.stringify(items[total - 1], null, 2)}`,
    );
  }
  console.log('=================================================================\n');
}

runTest('Real Dataset Download and Upload E2E', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'kg-js-test-'));
  });

  afterEach(() => {
    try {
      if (fs.existsSync(tmpDir)) {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      }
    } catch {
      // ignore cleanup errors
    }
  });

  it('downloads real dataset to file path and streams chunks', async () => {
    const destFile = path.join(tmpDir, 'real_dataset_download.json');

    // 1. Download directly to file path on disk
    const savedPath = await client!.datasets.download(REAL_DATASET_ID, {
      filePath: destFile,
    });

    expect(savedPath).toBe(destFile);
    expect(fs.existsSync(destFile)).toBe(true);

    const stat = fs.statSync(destFile);
    expect(stat.size).toBeGreaterThan(0);

    const content = fs.readFileSync(destFile, 'utf-8');
    const parsed = JSON.parse(content);
    expect(parsed).toBeDefined();

    if (Array.isArray(parsed)) {
      expect(parsed.length).toBeGreaterThanOrEqual(1);
    } else if (typeof parsed === 'object') {
      expect(parsed.data || parsed.text || Object.keys(parsed).length >= 1).toBeTruthy();
    }

    debugPrintSamples('JS E2E Download Result', parsed, stat.size);

    // 2. Stream download chunks and verify byte equality
    const chunks: Uint8Array[] = [];
    for await (const chunk of client!.datasets.streamDownload(REAL_DATASET_ID, {
      chunkSize: 1024,
    })) {
      chunks.push(chunk);
    }

    expect(chunks.length).toBeGreaterThanOrEqual(1);

    const totalLen = chunks.reduce((sum, c) => sum + c.length, 0);
    const combinedBytes = new Uint8Array(totalLen);
    let offset = 0;
    for (const chunk of chunks) {
      combinedBytes.set(chunk, offset);
      offset += chunk.length;
    }

    const diskBytes = fs.readFileSync(destFile);
    expect(Buffer.from(combinedBytes).equals(diskBytes)).toBe(true);
  }, 120000);

  it('downloads real dataset in memory with returnData: true', async () => {
    const data = await client!.datasets.download(REAL_DATASET_ID, {
      returnData: true,
    });

    expect(data).toBeDefined();
    if (Array.isArray(data)) {
      expect(data.length).toBeGreaterThanOrEqual(1);
    } else if (typeof data === 'object') {
      expect(data).toBeTruthy();
    }
  }, 120000);

  it('uploads a real dataset using short_description and cleans it up', async () => {
    const exactDatasetName = 'e2e-real-upload-js-test';
    const sampleData = [
      {
        text: "This is the third time I've ordered this particular brand of coffee, and it never disappoints. The aroma when you open the bag is incredible, and the taste is consistently smooth with just the right amount of bitterness. I usually get the medium roast, and it's perfect for my morning pour-over. It's a bit pricier than some other brands, but the quality really shines through. Definitely my go-to for a quality cup of coffee.",
        true_labels: ['positive'],
        all_labels: ['negative', 'positive'],
      },
    ];

    const tempFile = path.join(tmpDir, 'upload_sample.json');
    fs.writeFileSync(tempFile, JSON.stringify(sampleData, null, 2), 'utf-8');

    let createdId: string | undefined;

    try {
      const res = await client!.datasets.create({
        name: exactDatasetName,
        type: 'comprehend-it',
        format: 'json',
        short_description: 'Live E2E upload verification using valid dataset format',
        filePath: tempFile,
      });

      expect(res).toBeDefined();
      createdId = res.id;
      expect(createdId).toBeDefined();

      if (res.name) {
        expect(res.name).toBe(exactDatasetName);
      }

      console.log(`\n✅ Uploaded dataset ID: ${createdId} (Name: '${res.name}')`);
    } finally {
      if (createdId) {
        try {
          await client!.datasets.delete(createdId);
          console.log(`✅ Cleaned up/deleted test dataset: ${createdId}`);
        } catch (exc) {
          console.warn(`Could not delete test dataset ${createdId}:`, exc);
        }
      }
    }
  }, 120000);
});
