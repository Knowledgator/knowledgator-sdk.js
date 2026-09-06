import * as dotenv from 'dotenv';
import { createClient } from '../../src';

dotenv.config({ override: true });

export type KnowledgatorClient = ReturnType<typeof createClient>;

export const getApiKey = (): string | undefined => process.env.KG_API_KEY;

export const getBaseUrl = (): string | undefined => process.env.KG_BASE_URL;

export const getE2EClient = (): KnowledgatorClient | null => {
  const apiKey = getApiKey();
  if (!apiKey) return null;

  const baseUrl = getBaseUrl();
  const config = {
    timeout: 60000,
    ...(baseUrl
      ? {
          provider: 'custom' as const,
          servers: {
            comprehend: baseUrl,
            extract: baseUrl,
            instruct: baseUrl,
            datasets: baseUrl,
            finetuning: baseUrl,
            inference: baseUrl,
          },
          endpoints: {
            comprehend: '/inference/comprehend/',
            extract: '/inference/extract/',
            extractRelations: '/inference/extract/relations',
            extractSummary: '/inference/extract/summary',
            instruct: '/inference/instruct/',
          },
        }
      : {}),
  };

  return createClient(apiKey, config);
};
