import {
  ApiKeyRequiredError,
  CustomProviderMissingConfigError,
  JsonParseError,
} from '../client/errors';
import { createHttpClient } from '../client/http';
import { createDefaultLogger } from '../client/logger/logger';
import { getError } from '../client/utils';
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
  apiKey: string,
  config: Config,
  serviceKey: keyof ServerConfig,
  endpointKey: keyof EndpointConfig,
  data: TInput,
  validator: (data: unknown) => TOutput,
): Promise<TOutput> => {
  let baseUrl: string | undefined;
  let endpoint: string | undefined;
  let baseHeaders: Record<string, string> | undefined;

  if (config.provider === 'knowledgator') {
    if (!apiKey) {
      throw new ApiKeyRequiredError();
    }

    baseUrl = DEFAULT_SERVERS[serviceKey];
    endpoint = DEFAULT_ENDPOINTS[endpointKey];
    baseHeaders = getDefaultHeaders(apiKey);
  }

  if (config.provider === 'rapidapi') {
    if (!apiKey) {
      throw new ApiKeyRequiredError();
    }

    baseUrl = RAPID_API_SERVERS[serviceKey];
    endpoint = DEFAULT_ENDPOINTS[endpointKey];
    baseHeaders = getRapidApiHeaders(baseUrl.replace('https://', ''), apiKey);
  }

  if (config.provider === 'custom') {
    if (!config.servers || !config.endpoints) {
      throw new CustomProviderMissingConfigError();
    }

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

  try {
    const output = await response.json();
    return config.validateResponses ? validator(output) : (output as TOutput);
  } catch (err) {
    throw new JsonParseError(getError(err));
  }
};

const createComprehendApi = (apiKey: string, config: Config) => ({
  it: async (request: ComprehendRequest): Promise<ComprehendResults> =>
    jsonRequest(
      apiKey,
      config,
      'comprehend',
      'comprehend',
      validateComprehendRequest(request),
      validateComprehendResults,
    ),
});

const createExtractApi = (apiKey: string, config: Config) => ({
  entities: async (request: ExtractBaseRequest): Promise<ExtractBaseResults> =>
    jsonRequest(
      apiKey,
      config,
      'extract',
      'extract',
      validateExtractBaseRequest(request),
      validateExtractBaseResults,
    ),
  relations: async (request: ExtractRelationsRequest): Promise<ExtractRelationsResults> =>
    jsonRequest(
      apiKey,
      config,
      'extract',
      'extractRelations',
      validateExtractRelationsRequest(request),
      validateExtractRelationsResults,
    ),
  summary: async (request: ExtractSummaryRequest): Promise<ExtractSummaryResults> =>
    jsonRequest(
      apiKey,
      config,
      'extract',
      'extractSummary',
      validateExtractSummaryRequest(request),
      validateExtractSummaryResults,
    ),
});

export const createClient = (apiKey: string, config?: Config) => {
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
    comprehend: createComprehendApi(apiKey, finalConfig),
    extract: createExtractApi(apiKey, finalConfig),
  };
};
