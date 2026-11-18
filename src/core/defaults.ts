import type { Config, EndpointConfig, ServerConfig } from './types';

export const DEFAULT_ENDPOINTS: Required<EndpointConfig> = {
  comprehend: '/inference/comprehend/',
  extract: '/inference/extract/',
  extractRelations: '/inference/extract/relations',
  extractSummary: '/inference/extract/summary',
  instruct: '/inference/instruct/',
  datasets: '/datasets/',
  datasetsById: '/datasets/:id/',
  datasetsUpload: '/datasets/:id/files/upload/',
  datasetsDownload: '/datasets/:id/download/',
  datasetsGeneratePlan: '/datasets/generate/plan/',
  datasetsGenerate: '/datasets/generate/',
  datasetsFormats: '/files/formats/datasets/',
  data: '/data/',
  dataById: '/data/:id/',
  dataUpload: '/data/:id/files/upload/',
  models: '/models/',
  modelsById: '/models/:id/',
  finetuningTrainings: '/trainings/',
  finetuningTrainingsById: '/trainings/:id/',
  finetuningTrainingsEvaluations: '/trainings/:id/evaluations/',
  finetuningTrainingsStop: '/trainings/:id/stop/',
  finetuningTrainingsEvents: '/trainings/:id/events/',
  finetuningTrainingsMetrics: '/trainings/:id/metrics/:metric/',
  modelInference: '/inference/:modelId/',
  modelInferenceMethod: '/inference/:modelId/:method/',
} as const;

export const DEFAULT_SERVERS: Required<ServerConfig> = {
  comprehend: 'https://api.knowledgator.com',
  extract: 'https://api.knowledgator.com',
  instruct: 'https://api.knowledgator.com',
  datasets: 'https://api.knowledgator.com',
  finetuning: 'https://api.knowledgator.com',
  inference: 'https://api.knowledgator.com',
} as const;

export const getDefaultHeaders = (apiKey?: string): Record<string, string> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (apiKey) {
    headers['KnowledgatorAPI-Key'] = apiKey;
  }
  return headers;
};

export const RAPID_API_SERVERS: ServerConfig = {
  comprehend: 'https://comprehend-it.p.rapidapi.com',
  extract: 'https://extract-it.p.rapidapi.com',
  instruct: 'https://instruct-it.p.rapidapi.com',
} as const;

export const getRapidApiHeaders = (host: string, apiKey: string): Record<string, string> => ({
  'Content-Type': 'application/json',
  'x-rapidapi-host': host,
  'x-rapidapi-key': apiKey,
});

export const DEFAULT_CONFIG: Config = {
  provider: 'knowledgator',
  validateResponses: true,
  timeout: 60000,
  retryPolicy: {
    maxTries: 3,
    baseDelay: 0.25,
    maxDelay: 10,
    retryableStatuses: [408, 409, 429],
    jitter: true,
    jitterMin: 0.5,
    jitterMax: 1.5,
  },
  debug: false,
};
