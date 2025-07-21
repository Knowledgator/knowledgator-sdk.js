import type { RetryPolicy } from '../../client/config/types';
import {
  ApiKeyRequiredError,
  CustomProviderMissingConfigError,
  JsonParseError,
} from '../../client/errors';
import { createHttpClient, HttpOptions } from '../../client/http';
import {
  type ComprehendRequest,
  type ExtractBaseRequest,
  type ExtractRelationsRequest,
  type ExtractSummaryRequest,
  validateComprehendRequest,
  validateExtractBaseRequest,
  validateExtractRelationsRequest,
  validateExtractSummaryRequest,
} from '../../models/inputs';
import {
  validateExtractBaseResults,
  validateExtractRelationsResults,
  validateExtractSummaryResults,
  validateComprehendResults,
  type ComprehendResults,
  type ExtractBaseResults,
  type ExtractRelationsResults,
  type ExtractSummaryResults,
} from '../../models/outputs';
import { createClient } from '../core';
import {
  DEFAULT_CONFIG,
  DEFAULT_SERVERS,
  getDefaultHeaders,
  getRapidApiHeaders,
  RAPID_API_SERVERS,
} from '../defaults';
import type { EndpointConfig, ServerConfig } from '../types';

jest.mock('../../client/http');
jest.mock('../../models/inputs');
jest.mock('../../models/outputs');

const comprehendRequest: ComprehendRequest = {
  text: '',
  labels: [],
};
const extractBaseRequest: ExtractBaseRequest = {
  text: '',
  labels: [],
};
const extractRelationsRequest: ExtractRelationsRequest = {
  text: '',
  relations: [],
  entities: [],
};
const extractSummaryRequest: ExtractSummaryRequest = {
  text: '',
};
const comprehendResults: ComprehendResults = {
  results: [],
  input_text: '',
  labels: [],
  threshold: 1,
  status: '',
};
const extractBaseResults: ExtractBaseResults = {
  results: [],
  input_text: '',
  labels: [],
  threshold: 1,
  status: '',
};
const extractRelationsResults: ExtractRelationsResults = {
  results: [],
  input_text: '',
  entities: [],
  relations: [],
  threshold: 1,
  status: '',
};
const extractSummaryResults: ExtractSummaryResults = {
  summary: '',
  input_text: '',
  threshold: 1,
  status: '',
};

const mockValidateComprehendRequest = validateComprehendRequest as jest.MockedFunction<
  typeof validateComprehendRequest
>;
const mockValidateExtractBaseRequest = validateExtractBaseRequest as jest.MockedFunction<
  typeof validateExtractBaseRequest
>;
const mockValidateExtractRelationsRequest = validateExtractRelationsRequest as jest.MockedFunction<
  typeof validateExtractRelationsRequest
>;
const mockValidateExtractSummaryRequest = validateExtractSummaryRequest as jest.MockedFunction<
  typeof validateExtractSummaryRequest
>;
const mockValidateComprehendResults = validateComprehendResults as jest.MockedFunction<
  typeof validateComprehendResults
>;
const mockValidateExtractBaseResults = validateExtractBaseResults as jest.MockedFunction<
  typeof validateExtractBaseResults
>;
const mockValidateExtractRelationsResults = validateExtractRelationsResults as jest.MockedFunction<
  typeof validateExtractRelationsResults
>;
const mockValidateExtractSummaryResults = validateExtractSummaryResults as jest.MockedFunction<
  typeof validateExtractSummaryResults
>;

type MockResponse = {
  json: jest.MockedFunction<() => Promise<unknown>>;
};
type MockHttpClient = {
  post: jest.MockedFunction<(path?: string, options?: HttpOptions) => Promise<Response>>;
};
const mockCreateHttpClient = createHttpClient as jest.MockedFunction<typeof createHttpClient>;

describe(createClient.name, () => {
  let mockResponse: MockResponse;
  let mockHttpClient: MockHttpClient;

  beforeEach(() => {
    jest.clearAllMocks();

    mockResponse = {
      json: jest.fn(),
    };
    mockHttpClient = {
      post: jest.fn().mockResolvedValue(mockResponse),
    };
    mockCreateHttpClient.mockReturnValue(
      mockHttpClient as unknown as ReturnType<typeof createHttpClient>,
    );

    mockValidateComprehendRequest.mockImplementation(() => comprehendRequest);
    mockValidateExtractBaseRequest.mockImplementation(() => extractBaseRequest);
    mockValidateExtractRelationsRequest.mockImplementation(() => extractRelationsRequest);
    mockValidateExtractSummaryRequest.mockImplementation(() => extractSummaryRequest);
    mockValidateComprehendResults.mockImplementation(() => comprehendResults);
    mockValidateExtractBaseResults.mockImplementation(() => extractBaseResults);
    mockValidateExtractRelationsResults.mockImplementation(() => extractRelationsResults);
    mockValidateExtractSummaryResults.mockImplementation(() => extractSummaryResults);
  });

  describe('client creation', () => {
    it('should create client with default config', () => {
      const client = createClient('apiKey');

      expect(client).toHaveProperty('comprehend');
      expect(client).toHaveProperty('extract');
      expect(client.comprehend).toHaveProperty('it');
      expect(client.extract).toHaveProperty('it');
      expect(client.extract).toHaveProperty('relations');
      expect(client.extract).toHaveProperty('summary');
    });

    it('should create client with rapidapi config', () => {
      const client = createClient('apiKey', {
        provider: 'rapidapi',
      });

      expect(client).toHaveProperty('comprehend');
      expect(client).toHaveProperty('extract');
    });

    it('should create client with custom config', () => {
      const client = createClient('', {
        provider: 'custom',
        servers: {
          comprehend: 'https://custom-comprehend.com',
          extract: 'https://custom-extract.com',
        },
        endpoints: {
          comprehend: '/custom-comprehend',
          extract: '/custom-extract',
          extractRelations: '/custom-relations',
          extractSummary: '/custom-summary',
        },
      });

      expect(client).toHaveProperty('comprehend');
      expect(client.comprehend).toHaveProperty('it');
      expect(client).toHaveProperty('extract');
      expect(client.extract).toHaveProperty('it');
      expect(client.extract).toHaveProperty('relations');
      expect(client.extract).toHaveProperty('summary');
    });
  });

  describe('provider configurations', () => {
    describe('when provider is knowledgator', () => {
      it('should throw error when api key is empty', async () => {
        const client = createClient('');

        await expect(client.comprehend.it(comprehendRequest)).rejects.toThrow(ApiKeyRequiredError);
      });

      it('should use default servers and headers', async () => {
        const client = createClient('apiKey');

        await client.comprehend.it(comprehendRequest);

        expect(mockCreateHttpClient).toHaveBeenCalledWith({
          baseUrl: DEFAULT_SERVERS.comprehend,
          baseHeaders: getDefaultHeaders('apiKey'),
          timeout: DEFAULT_CONFIG.timeout,
          retryPolicy: DEFAULT_CONFIG.retryPolicy,
          requestInterceptor: DEFAULT_CONFIG.requestInterceptor,
          responseInterceptor: DEFAULT_CONFIG.responseInterceptor,
          logger: expect.objectContaining({
            debug: expect.any(Function),
            info: expect.any(Function),
            warn: expect.any(Function),
            error: expect.any(Function),
          }),
        });
      });
    });

    describe('when provider is rapidapi', () => {
      it('should throw error when api key is empty', async () => {
        const client = createClient('', { provider: 'rapidapi' });

        await expect(client.comprehend.it(comprehendRequest)).rejects.toThrow(ApiKeyRequiredError);
      });

      it('should use Rapid API servers and headers', async () => {
        const client = createClient('apiKey', {
          provider: 'rapidapi',
        });

        await client.comprehend.it(comprehendRequest);

        expect(mockCreateHttpClient).toHaveBeenCalledWith({
          baseUrl: RAPID_API_SERVERS.comprehend,
          baseHeaders: getRapidApiHeaders(
            RAPID_API_SERVERS.comprehend.replace('https://', ''),
            'apiKey',
          ),
          timeout: DEFAULT_CONFIG.timeout,
          retryPolicy: DEFAULT_CONFIG.retryPolicy,
          requestInterceptor: DEFAULT_CONFIG.requestInterceptor,
          responseInterceptor: DEFAULT_CONFIG.responseInterceptor,
          logger: expect.objectContaining({
            debug: expect.any(Function),
            info: expect.any(Function),
            warn: expect.any(Function),
            error: expect.any(Function),
          }),
        });
      });
    });

    describe('when provider is custom', () => {
      it('should throw error when servers are not provided', async () => {
        const client = createClient('', {
          provider: 'custom',
          servers: undefined as unknown as ServerConfig,
          endpoints: {
            comprehend: '/custom-comprehend',
            extract: '/custom-extract',
            extractRelations: '/custom-relations',
            extractSummary: '/custom-summary',
          },
        });

        await expect(client.comprehend.it(comprehendRequest)).rejects.toThrow(
          CustomProviderMissingConfigError,
        );
      });

      it('should throw error when endpoints are not provided', async () => {
        const client = createClient('', {
          provider: 'custom',
          servers: {
            comprehend: 'https://custom-comprehend.com',
            extract: 'https://custom-extract.com',
          },
          endpoints: undefined as unknown as EndpointConfig,
        });

        await expect(client.comprehend.it(comprehendRequest)).rejects.toThrow(
          CustomProviderMissingConfigError,
        );
      });

      it('should use custom servers and headers', async () => {
        const client = createClient('', {
          provider: 'custom',
          servers: {
            comprehend: 'https://custom-comprehend.com',
            extract: 'https://custom-extract.com',
          },
          endpoints: {
            comprehend: '/custom-comprehend',
            extract: '/custom-extract',
            extractRelations: '/custom-relations',
            extractSummary: '/custom-summary',
          },
          baseHeaders: { 'Custom-Auth': 'Custom-Auth' },
        });

        await client.comprehend.it(comprehendRequest);

        expect(mockCreateHttpClient).toHaveBeenCalledWith({
          baseUrl: 'https://custom-comprehend.com',
          baseHeaders: { 'Custom-Auth': 'Custom-Auth' },
          timeout: DEFAULT_CONFIG.timeout,
          retryPolicy: DEFAULT_CONFIG.retryPolicy,
          requestInterceptor: DEFAULT_CONFIG.requestInterceptor,
          responseInterceptor: DEFAULT_CONFIG.responseInterceptor,
          logger: expect.objectContaining({
            debug: expect.any(Function),
            info: expect.any(Function),
            warn: expect.any(Function),
            error: expect.any(Function),
          }),
        });
        expect(mockHttpClient.post).toHaveBeenCalledWith('/custom-comprehend', {
          body: JSON.stringify(comprehendRequest),
        });
      });
    });
  });

  describe('comprehend API', () => {
    it('should call comprehend endpoint with correct parameters', async () => {
      const client = createClient('apiKey');
      mockResponse.json.mockResolvedValue(comprehendResults);

      const result = await client.comprehend.it(comprehendRequest);

      expect(mockValidateComprehendRequest).toHaveBeenCalledWith(comprehendRequest);
      expect(mockHttpClient.post).toHaveBeenCalledWith('/comprehend', {
        body: JSON.stringify(comprehendRequest),
      });
      expect(mockValidateComprehendResults).toHaveBeenCalledWith(comprehendResults);
      expect(result).toBe(comprehendResults);
    });
  });

  describe('extract API', () => {
    describe('it method', () => {
      it('should call extract it endpoint', async () => {
        const client = createClient('apiKey');
        mockResponse.json.mockResolvedValue(extractBaseResults);

        const result = await client.extract.it(extractBaseRequest);

        expect(mockValidateExtractBaseRequest).toHaveBeenCalledWith(extractBaseRequest);
        expect(mockHttpClient.post).toHaveBeenCalledWith('/extract', {
          body: JSON.stringify(extractBaseRequest),
        });
        expect(mockValidateExtractBaseResults).toHaveBeenCalledWith(extractBaseResults);
        expect(result).toBe(extractBaseResults);
      });
    });

    describe('relations method', () => {
      it('should call extract relations endpoint', async () => {
        const client = createClient('apiKey');
        mockResponse.json.mockResolvedValue(extractRelationsResults);

        const result = await client.extract.relations(extractRelationsRequest);

        expect(mockValidateExtractRelationsRequest).toHaveBeenCalledWith(extractRelationsRequest);
        expect(mockHttpClient.post).toHaveBeenCalledWith('/extract/relations', {
          body: JSON.stringify(extractRelationsRequest),
        });
        expect(mockValidateExtractRelationsResults).toHaveBeenCalledWith(extractRelationsResults);
        expect(result).toBe(extractRelationsResults);
      });
    });

    describe('summary method', () => {
      it('should call extract summary endpoint', async () => {
        const client = createClient('apiKey');
        mockResponse.json.mockResolvedValue(extractSummaryResults);

        const result = await client.extract.summary(extractSummaryRequest);

        expect(mockValidateExtractSummaryRequest).toHaveBeenCalledWith(extractSummaryRequest);
        expect(mockHttpClient.post).toHaveBeenCalledWith('/extract/summary', {
          body: JSON.stringify(extractSummaryRequest),
        });
        expect(mockValidateExtractSummaryResults).toHaveBeenCalledWith(extractSummaryResults);
        expect(result).toBe(extractSummaryResults);
      });
    });
  });

  describe('response validation', () => {
    it('should validate responses when validateResponses is true', async () => {
      const client = createClient('apiKey', {
        validateResponses: true,
      });
      mockResponse.json.mockResolvedValue(comprehendResults);
      mockValidateComprehendResults.mockReturnValue(comprehendResults);

      const result = await client.comprehend.it(comprehendRequest);

      expect(mockValidateComprehendResults).toHaveBeenCalledWith(comprehendResults);
      expect(result).toBe(comprehendResults);
    });

    it('should skip validation when validateResponses is false', async () => {
      const client = createClient('apiKey', {
        validateResponses: false,
      });
      mockResponse.json.mockResolvedValue(comprehendResults);

      const result = await client.comprehend.it(comprehendRequest);

      expect(mockValidateComprehendResults).not.toHaveBeenCalled();
      expect(result).toBe(comprehendResults);
    });
  });

  describe('HTTP client configuration', () => {
    it('should pass through timeout configuration', async () => {
      const client = createClient('apiKey', {
        timeout: 5000,
      });

      await client.comprehend.it(comprehendRequest);

      expect(mockCreateHttpClient).toHaveBeenCalledWith(
        expect.objectContaining({
          timeout: 5000,
        }),
      );
    });

    it('should pass through retry policy configuration', async () => {
      const retryPolicy: RetryPolicy = {
        maxTries: 5,
        baseDelay: 1,
        maxDelay: 30,
      };
      const client = createClient('apiKey', {
        retryPolicy,
      });

      await client.comprehend.it(comprehendRequest);

      expect(mockCreateHttpClient).toHaveBeenCalledWith(
        expect.objectContaining({
          retryPolicy: expect.objectContaining(retryPolicy),
        }),
      );
    });

    it('should pass through interceptors', async () => {
      const requestInterceptor = jest.fn();
      const responseInterceptor = jest.fn();
      const client = createClient('apiKey', {
        requestInterceptor,
        responseInterceptor,
      });

      await client.comprehend.it(comprehendRequest);

      expect(mockCreateHttpClient).toHaveBeenCalledWith(
        expect.objectContaining({
          requestInterceptor,
          responseInterceptor,
        }),
      );
    });
  });

  describe('validation errors', () => {
    describe('request validation failures', () => {
      it('should throw error when comprehend request validation fails', async () => {
        const client = createClient('apiKey');
        mockValidateComprehendRequest.mockImplementation(() => {
          throw new Error('Invalid comprehend request');
        });

        await expect(client.comprehend.it({} as ComprehendRequest)).rejects.toThrow(
          'Invalid comprehend request',
        );

        expect(mockValidateComprehendRequest).toHaveBeenCalledWith({});
        expect(mockHttpClient.post).not.toHaveBeenCalled();
      });

      it('should throw error when extract base request validation fails', async () => {
        const client = createClient('apiKey');
        mockValidateExtractBaseRequest.mockImplementation(() => {
          throw new Error('Invalid extract base request');
        });

        await expect(client.extract.it({} as ExtractBaseRequest)).rejects.toThrow(
          'Invalid extract base request',
        );

        expect(mockValidateExtractBaseRequest).toHaveBeenCalledWith({});
        expect(mockHttpClient.post).not.toHaveBeenCalled();
      });

      it('should throw error when extract relations request validation fails', async () => {
        const client = createClient('apiKey');
        mockValidateExtractRelationsRequest.mockImplementation(() => {
          throw new Error('Invalid extract relations request');
        });

        await expect(client.extract.relations({} as ExtractRelationsRequest)).rejects.toThrow(
          'Invalid extract relations request',
        );

        expect(mockValidateExtractRelationsRequest).toHaveBeenCalledWith({});
        expect(mockHttpClient.post).not.toHaveBeenCalled();
      });

      it('should throw error when extract summary request validation fails', async () => {
        const client = createClient('apiKey');
        mockValidateExtractSummaryRequest.mockImplementation(() => {
          throw new Error('Invalid extract summary request');
        });

        await expect(client.extract.summary({} as ExtractSummaryRequest)).rejects.toThrow(
          'Invalid extract summary request',
        );

        expect(mockValidateExtractSummaryRequest).toHaveBeenCalledWith({});
        expect(mockHttpClient.post).not.toHaveBeenCalled();
      });
    });

    describe('response validation failures', () => {
      it('should throw error when comprehend response validation fails', async () => {
        const client = createClient('apiKey', {
          validateResponses: true,
        });
        mockResponse.json.mockResolvedValue({});
        mockValidateComprehendResults.mockImplementation(() => {
          throw new Error('Invalid comprehend response');
        });

        await expect(client.comprehend.it(comprehendRequest)).rejects.toThrow(
          'Invalid comprehend response',
        );

        expect(mockValidateComprehendResults).toHaveBeenCalledWith({});
      });

      it('should throw error when extract base response validation fails', async () => {
        const client = createClient('apiKey', {
          validateResponses: true,
        });
        mockResponse.json.mockResolvedValue({});
        mockValidateExtractBaseResults.mockImplementation(() => {
          throw new Error('Invalid extract base response');
        });

        await expect(client.extract.it(extractBaseRequest)).rejects.toThrow(
          'Invalid extract base response',
        );

        expect(mockValidateExtractBaseResults).toHaveBeenCalledWith({});
      });

      it('should throw error when extract relations response validation fails', async () => {
        const client = createClient('apiKey', {
          validateResponses: true,
        });
        mockResponse.json.mockResolvedValue({});
        mockValidateExtractRelationsResults.mockImplementation(() => {
          throw new Error('Invalid extract relations response');
        });

        await expect(client.extract.relations(extractRelationsRequest)).rejects.toThrow(
          'Invalid extract relations response',
        );

        expect(mockValidateExtractRelationsResults).toHaveBeenCalledWith({});
      });

      it('should throw error when extract summary response validation fails', async () => {
        const client = createClient('apiKey', {
          validateResponses: true,
        });
        mockResponse.json.mockResolvedValue({});
        mockValidateExtractSummaryResults.mockImplementation(() => {
          throw new Error('Invalid extract summary response');
        });

        await expect(client.extract.summary(extractSummaryRequest)).rejects.toThrow(
          'Invalid extract summary response',
        );

        expect(mockValidateExtractSummaryResults).toHaveBeenCalledWith({});
      });

      it('should not validate response when validateResponses is false', async () => {
        const client = createClient('apiKey', {
          validateResponses: false,
        });
        mockResponse.json.mockResolvedValue({});

        const result = await client.comprehend.it(comprehendRequest);

        expect(mockValidateComprehendResults).not.toHaveBeenCalled();
        expect(result).toStrictEqual({});
      });
    });
  });

  describe('error handling', () => {
    it('should propagate HTTP client errors', async () => {
      const client = createClient('apiKey');
      const httpError = new Error('Network error');
      mockHttpClient.post.mockRejectedValue(httpError);

      await expect(client.comprehend.it(comprehendRequest)).rejects.toThrow('Network error');
    });

    it('should propagate validation errors', async () => {
      const client = createClient('apiKey', {
        validateResponses: true,
      });
      mockValidateComprehendResults.mockImplementation(() => {
        throw new Error('Validation failed');
      });

      await expect(client.comprehend.it(comprehendRequest)).rejects.toThrow('Validation failed');
    });

    it('should throw JsonParseError when JSON parsing fails', async () => {
      const client = createClient('apiKey');
      const jsonError = new Error('Invalid JSON');
      mockResponse.json.mockRejectedValue(jsonError);

      await expect(client.comprehend.it(comprehendRequest)).rejects.toThrow(JsonParseError);
      await expect(client.comprehend.it(comprehendRequest)).rejects.toThrow(
        'Failed to parse JSON response: Invalid JSON',
      );
    });
  });

  describe('default configuration', () => {
    it('should use default configuration values', async () => {
      const client = createClient('apiKey');

      await client.comprehend.it(comprehendRequest);

      expect(mockCreateHttpClient).toHaveBeenCalledWith({
        baseUrl: DEFAULT_SERVERS.comprehend,
        baseHeaders: getDefaultHeaders('apiKey'),
        timeout: DEFAULT_CONFIG.timeout,
        retryPolicy: DEFAULT_CONFIG.retryPolicy,
        requestInterceptor: DEFAULT_CONFIG.requestInterceptor,
        responseInterceptor: DEFAULT_CONFIG.responseInterceptor,
        logger: expect.objectContaining({
          debug: expect.any(Function),
          info: expect.any(Function),
          warn: expect.any(Function),
          error: expect.any(Function),
        }),
      });
    });

    it('should merge custom config with defaults', async () => {
      const client = createClient('apiKey', {
        timeout: 5000,
        retryPolicy: { maxTries: 1 },
      });

      await client.comprehend.it(comprehendRequest);

      expect(mockCreateHttpClient).toHaveBeenCalledWith(
        expect.objectContaining({
          timeout: 5000,
          retryPolicy: {
            ...DEFAULT_CONFIG.retryPolicy,
            maxTries: 1,
          },
        }),
      );
    });
  });
});
