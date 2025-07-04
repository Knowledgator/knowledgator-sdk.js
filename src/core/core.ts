import { EndpointNotConfiguredError } from '../client/errors';
import { createHttpClient } from '../client/http';
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
  DEFAULT_ENDPOINTS,
  DEFAULT_SERVERS,
  getDefaultHeaders,
  getRapidApiHeaders,
  RAPID_API_SERVERS,
} from './defaults';
import type { EndpointConfig, KnowledgatorConfig, ServerConfig } from './types';

const jsonRequest = async <TInput, TOutput>(
  config: KnowledgatorConfig,
  endpoint: string,
  data: TInput,
  validator: (data: unknown) => TOutput,
): Promise<TOutput> => {
  const httpClient = createHttpClient(config);

  const response = await httpClient.post(endpoint, {
    body: JSON.stringify(data),
  });
  const output = await response.json();

  return config.validateResponses ? validator(output) : (output as TOutput);
};

const createComprehendApi = (config: KnowledgatorConfig) => {
  const endpoint = config.endpoints?.comprehend;

  return {
    it: async (request: ComprehendRequest): Promise<ComprehendResults> => {
      if (!endpoint) {
        throw new EndpointNotConfiguredError('Comprehend');
      }

      return jsonRequest(
        config,
        endpoint,
        validateComprehendRequest(request),
        validateComprehendResults,
      );
    },
  };
};

const createExtractApi = (config: KnowledgatorConfig) => {
  const endpoints: Partial<
    Pick<EndpointConfig, 'extract' | 'extractRelations' | 'extractSummary'>
  > = {
    extract: config.endpoints?.extract,
    extractRelations: config.endpoints?.extractRelations,
    extractSummary: config.endpoints?.extractSummary,
  };

  return {
    entities: async (request: ExtractBaseRequest): Promise<ExtractBaseResults> => {
      if (!endpoints.extract) {
        throw new EndpointNotConfiguredError('Extract');
      }

      return jsonRequest(
        config,
        endpoints.extract,
        validateExtractBaseRequest(request),
        validateExtractBaseResults,
      );
    },
    relations: async (request: ExtractRelationsRequest): Promise<ExtractRelationsResults> => {
      if (!endpoints.extractRelations) {
        throw new EndpointNotConfiguredError('Extract Relations');
      }

      return jsonRequest(
        config,
        endpoints.extractRelations,
        validateExtractRelationsRequest(request),
        validateExtractRelationsResults,
      );
    },
    summary: async (request: ExtractSummaryRequest): Promise<ExtractSummaryResults> => {
      if (!endpoints.extractSummary) {
        throw new EndpointNotConfiguredError('Extract Summary');
      }

      return jsonRequest(
        config,
        endpoints.extractSummary,
        validateExtractSummaryRequest(request),
        validateExtractSummaryResults,
      );
    },
  };
};

export const getBaseConfig = (config?: KnowledgatorConfig): KnowledgatorConfig => ({
  validateResponses: config?.validateResponses ?? true,
  timeout: config?.timeout,
  retryPolicy: config?.retryPolicy,
  maxAbsoluteRetries: config?.maxAbsoluteRetries,
  requestInterceptor: config?.requestInterceptor,
  responseInterceptor: config?.responseInterceptor,
  apiKey: config?.apiKey,
});

export const createKnowledgatorConfig = (
  service: keyof ServerConfig,
  config?: KnowledgatorConfig,
): KnowledgatorConfig => ({
  baseUrl: config?.baseUrl || DEFAULT_SERVERS[service],
  baseHeaders: {
    ...getDefaultHeaders(config?.apiKey),
    ...config?.baseHeaders,
  },
  endpoints: {
    ...DEFAULT_ENDPOINTS,
    ...config?.endpoints,
  },
  ...getBaseConfig(config),
});

export const createRapidApiConfig = (
  service: keyof ServerConfig,
  config?: KnowledgatorConfig,
): KnowledgatorConfig => {
  const baseUrl = config?.baseUrl || RAPID_API_SERVERS[service];
  const host = baseUrl.replace('https://', '');

  return {
    baseUrl: config?.baseUrl || RAPID_API_SERVERS[service],
    baseHeaders: {
      ...getRapidApiHeaders(host, config?.apiKey),
      ...config?.baseHeaders,
    },
    endpoints: {
      ...DEFAULT_ENDPOINTS,
      ...config?.endpoints,
    },
    ...getBaseConfig(config),
  };
};

export const createClient = (config: KnowledgatorConfig) => ({
  comprehend: createComprehendApi(config),
  extract: createExtractApi(config),
});
