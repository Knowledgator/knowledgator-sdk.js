import { createHttpClient } from '../client/http';
import { createDefaultLogger } from '../client/logger/logger';
import {
  validateComprehendRequest,
  validateExtractBaseRequest,
  validateExtractRelationsRequest,
  validateExtractSummaryRequest,
  type ComprehendRequest,
  type ExtractBaseRequest,
  type ExtractRelationsRequest,
  type ExtractSummaryRequest,
} from '../models/inputs';
import {
  type ExtractBaseResults,
  type ExtractRelationsResults,
  type ExtractSummaryResults,
  validateExtractBaseResults,
  validateExtractRelationsResults,
  validateExtractSummaryResults,
  type ComprehendResults,
  validateComprehendResults,
} from '../models/outputs';

import {
  DEFAULT_CONFIG,
  DEFAULT_ENDPOINTS,
  DEFAULT_SERVERS,
  getDefaultHeaders,
  getRapidApiHeaders,
  RAPID_API_SERVERS,
} from './defaults';
import type { EndpointConfig, Config, ServerConfig } from './types';

const jsonRequest = async <TInput, TOutput>(
  config: Config,
  serviceKey: keyof ServerConfig,
  endpointKey: keyof EndpointConfig,
  data: TInput,
  validator: (data: unknown) => TOutput,
): Promise<TOutput> => {
  let baseUrl: string | undefined = DEFAULT_SERVERS[serviceKey];
  let endpoint: string | undefined = DEFAULT_ENDPOINTS[endpointKey];
  let baseHeaders: Record<string, string> | undefined = getDefaultHeaders(config.apiKey);

  if (config.provider === 'rapidapi') {
    baseUrl = RAPID_API_SERVERS[serviceKey];
    endpoint = DEFAULT_ENDPOINTS[endpointKey];
    baseHeaders = getRapidApiHeaders(baseUrl.replace('https://', ''), config.apiKey);
  }

  if (config.provider === 'custom') {
    baseUrl = config.servers[serviceKey];
    endpoint = config.endpoints[endpointKey];
    baseHeaders = config.baseHeaders;
  }

  const httpClient = createHttpClient({
    baseUrl,
    baseHeaders,
    timeout: config.timeout,
    retryPolicy: config.retryPolicy,
    requestInterceptor: config.requestInterceptor,
    responseInterceptor: config.responseInterceptor,
    logger: config.logger,
  });

  const response = await httpClient.post(endpoint, {
    body: JSON.stringify(data),
  });
  const output = await response.json();

  return config.validateResponses ? validator(output) : (output as TOutput);
};

const createComprehendApi = (config: Config) => ({
  it: async (request: ComprehendRequest): Promise<ComprehendResults> =>
    jsonRequest(
      config,
      'comprehend',
      'comprehend',
      validateComprehendRequest(request),
      validateComprehendResults,
    ),
});

const createExtractApi = (config: Config) => ({
  entities: async (request: ExtractBaseRequest): Promise<ExtractBaseResults> =>
    jsonRequest(
      config,
      'extract',
      'extract',
      validateExtractBaseRequest(request),
      validateExtractBaseResults,
    ),
  relations: async (request: ExtractRelationsRequest): Promise<ExtractRelationsResults> =>
    jsonRequest(
      config,
      'extract',
      'extractRelations',
      validateExtractRelationsRequest(request),
      validateExtractRelationsResults,
    ),
  summary: async (request: ExtractSummaryRequest): Promise<ExtractSummaryResults> =>
    jsonRequest(
      config,
      'extract',
      'extractSummary',
      validateExtractSummaryRequest(request),
      validateExtractSummaryResults,
    ),
});

export const createClient = (config?: Config) => {
  const finalConfig: Config = {
    ...DEFAULT_CONFIG,
    ...config,
    retryPolicy: {
      ...DEFAULT_CONFIG.retryPolicy,
      ...config?.retryPolicy,
    },
    logger: config?.logger || createDefaultLogger(config?.debug ?? DEFAULT_CONFIG.debug),
  };

  finalConfig.logger?.debug('SDK client initialized', { finalConfig });

  return {
    comprehend: createComprehendApi(finalConfig),
    extract: createExtractApi(finalConfig),
  };
};
