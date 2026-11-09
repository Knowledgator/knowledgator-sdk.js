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
  type InstructItRequest,
  type FileMetadata,
  validateComprehendRequest,
  validateExtractBaseRequest,
  validateExtractRelationsRequest,
  validateExtractSummaryRequest,
  validateInstructItRequest,
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
  type InstructItResults,
  validateInstructItResults,
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
import { getModelIdHeader } from '../utils';

jest.mock('../../client/http');
jest.mock('../../models/inputs', () => {
  const actual = jest.requireActual('../../models/inputs');
  return {
    ...actual,
    validateComprehendRequest: jest.fn(),
    validateExtractBaseRequest: jest.fn(),
    validateExtractRelationsRequest: jest.fn(),
    validateExtractSummaryRequest: jest.fn(),
    validateInstructItRequest: jest.fn(),
  };
});
jest.mock('../../models/outputs');

const comprehendRequest: ComprehendRequest = {
  text: '',
  labels: [],
};
const extractBaseRequest: ExtractBaseRequest = {
  text: '',
  entities: [],
};
const extractRelationsRequest: ExtractRelationsRequest = {
  text: '',
  relations: [],
  entities: [],
};
const extractSummaryRequest: ExtractSummaryRequest = {
  text: '',
};
const instructItRequest: InstructItRequest = {
  text: 'Summarize this policy in 3 bullet points.',
};
const comprehendResults: ComprehendResults = {
  results: [],
};
const extractBaseResults: ExtractBaseResults = {
  results: [],
};
const extractRelationsResults: ExtractRelationsResults = {
  results: [],
};
const extractSummaryResults: ExtractSummaryResults = {
  results: [],
};
const instructItResults: InstructItResults = {
  outputs: { summary: 'Test summary', key_points: [] },
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
const mockValidateInstructItRequest = validateInstructItRequest as jest.MockedFunction<
  typeof validateInstructItRequest
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
const mockValidateInstructItResults = validateInstructItResults as jest.MockedFunction<
  typeof validateInstructItResults
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
    mockValidateInstructItRequest.mockImplementation(() => instructItRequest);
    mockValidateComprehendResults.mockImplementation(() => comprehendResults);
    mockValidateExtractBaseResults.mockImplementation(() => extractBaseResults);
    mockValidateExtractRelationsResults.mockImplementation(() => extractRelationsResults);
    mockValidateExtractSummaryResults.mockImplementation(() => extractSummaryResults);
    mockValidateInstructItResults.mockImplementation(() => instructItResults);
  });

  describe('client creation', () => {
    it('should create client with default config', () => {
      const client = createClient('apiKey');

      expect(client).toHaveProperty('comprehend');
      expect(client).toHaveProperty('extract');
      expect(client).toHaveProperty('instruct');
      expect(client).toHaveProperty('finetuning');
      expect(client.comprehend).toHaveProperty('it');
      expect(client.extract).toHaveProperty('it');
      expect(client.extract).toHaveProperty('relations');
      expect(client.extract).toHaveProperty('summary');
      expect(client.instruct).toHaveProperty('it');
    });

    it('should create client with rapidapi config', () => {
      const client = createClient('apiKey', {
        provider: 'rapidapi',
      });

      expect(client).toHaveProperty('comprehend');
      expect(client).toHaveProperty('extract');
      expect(client).toHaveProperty('instruct');
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
      expect(client).toHaveProperty('instruct');
      expect(client.instruct).toHaveProperty('it');
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
            RAPID_API_SERVERS.comprehend?.replace('https://', '') || '',
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
      expect(mockHttpClient.post).toHaveBeenCalledWith('/inference/comprehend/', {
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
        expect(mockHttpClient.post).toHaveBeenCalledWith('/inference/extract/', {
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
        expect(mockHttpClient.post).toHaveBeenCalledWith('/inference/extract/relations', {
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
        expect(mockHttpClient.post).toHaveBeenCalledWith('/inference/extract/summary', {
          body: JSON.stringify(extractSummaryRequest),
        });
        expect(mockValidateExtractSummaryResults).toHaveBeenCalledWith(extractSummaryResults);
        expect(result).toBe(extractSummaryResults);
      });
    });
  });

  describe('instruct API', () => {
    it('should call instruct endpoint with multipart/form-data', async () => {
      const client = createClient('apiKey');
      mockResponse.json.mockResolvedValue(instructItResults);

      const result = await client.instruct.it(instructItRequest);

      expect(mockValidateInstructItRequest).toHaveBeenCalledWith(instructItRequest);
      expect(mockHttpClient.post).toHaveBeenCalledWith('/inference/instruct/', {
        body: expect.any(FormData),
      });

      // Verify FormData contains the text field
      const callArgs = mockHttpClient.post.mock.calls[0];
      const formData = callArgs[1]!.body as FormData;
      expect(formData.get('text')).toBe('Summarize this policy in 3 bullet points.');

      expect(mockValidateInstructItResults).toHaveBeenCalledWith(instructItResults);
      expect(result).toBe(instructItResults);
    });

    it('should handle optional parameters in FormData', async () => {
      const client = createClient('apiKey');
      const requestWithOptionals: InstructItRequest = {
        text: 'Test instruction',
        template: '{"summary": "", "key_points": []}',
        files: [{ name: 'file-1' }, { name: 'file-2' }],
        output_type: 'json',
      };
      mockValidateInstructItRequest.mockImplementation(() => requestWithOptionals);
      mockResponse.json.mockResolvedValue(instructItResults);

      const result = await client.instruct.it(requestWithOptionals);

      expect(mockValidateInstructItRequest).toHaveBeenCalledWith(requestWithOptionals);

      // Verify FormData structure
      const callArgs = mockHttpClient.post.mock.calls[0];
      const formData = callArgs[1]!.body as FormData;
      expect(formData.get('text')).toBe('Test instruction');
      expect(formData.get('template')).toBe('{"summary": "", "key_points": []}');
      expect(formData.get('output_type')).toBe('json');
      expect(formData.get('filesmetadata')).toBe(JSON.stringify(['file-1', 'file-2']));

      expect(result).toBe(instructItResults);
    });

    it('should handle file references without content', async () => {
      const client = createClient('apiKey');
      const files: FileMetadata[] = [{ name: 'file-id-1' }, { name: 'file-id-2' }];
      const requestWithFiles: InstructItRequest = {
        text: 'Compare these two documents',
        files,
      };
      mockValidateInstructItRequest.mockImplementation(() => requestWithFiles);
      mockResponse.json.mockResolvedValue(instructItResults);

      const result = await client.instruct.it(requestWithFiles);

      expect(mockValidateInstructItRequest).toHaveBeenCalledWith(requestWithFiles);

      // Verify FormData includes filesmetadata but no file parts
      const callArgs = mockHttpClient.post.mock.calls[0];
      const formData = callArgs[1]!.body as FormData;
      expect(formData.get('text')).toBe('Compare these two documents');
      expect(formData.get('filesmetadata')).toBe(JSON.stringify(['file-id-1', 'file-id-2']));

      // Verify no file parts were added (only metadata)
      expect(formData.getAll('files')).toHaveLength(0);

      expect(result).toBe(instructItResults);
    });

    it('should send file content as multipart file parts', async () => {
      const client = createClient('apiKey');
      const files: FileMetadata[] = [
        {
          name: 'document.pdf',
          content: new Uint8Array([0x50, 0x44, 0x46]), // PDF binary content
        },
      ];
      const requestWithContent: InstructItRequest = {
        text: 'Process this document',
        files,
        output_type: 'list',
      };
      mockValidateInstructItRequest.mockImplementation(() => requestWithContent);
      mockResponse.json.mockResolvedValue(instructItResults);

      const result = await client.instruct.it(requestWithContent);

      // Verify FormData includes filesmetadata and file parts
      const callArgs = mockHttpClient.post.mock.calls[0];
      const formData = callArgs[1]!.body as FormData;
      expect(formData.get('text')).toBe('Process this document');
      expect(formData.get('output_type')).toBe('list');
      expect(formData.get('filesmetadata')).toBe(JSON.stringify(['document.pdf']));

      // Verify file content was added as a file part
      const fileParts = formData.getAll('files');
      expect(fileParts).toHaveLength(1);
      expect(fileParts[0]).toBeInstanceOf(Blob);

      expect(result).toBe(instructItResults);
    });

    it('should handle mixed files with and without content', async () => {
      const client = createClient('apiKey');
      const files: FileMetadata[] = [
        { name: 'doc1.pdf' }, // Reference only
        {
          name: 'doc2.docx',
          content: new Uint8Array([0x44, 0x4f, 0x43]), // DOCX content
        },
        { name: 'doc3.txt' }, // Reference only
      ];
      const requestWithMixedFiles: InstructItRequest = {
        text: 'Analyze these documents comprehensively',
        files,
        template: '{"analysis": "", "recommendations": []}',
        output_type: 'json',
      };
      mockValidateInstructItRequest.mockImplementation(() => requestWithMixedFiles);
      mockResponse.json.mockResolvedValue(instructItResults);

      const result = await client.instruct.it(requestWithMixedFiles);

      // Verify FormData includes all file names in filesmetadata
      const callArgs = mockHttpClient.post.mock.calls[0];
      const formData = callArgs[1]!.body as FormData;
      expect(formData.get('text')).toBe('Analyze these documents comprehensively');
      expect(formData.get('template')).toBe('{"analysis": "", "recommendations": []}');
      expect(formData.get('output_type')).toBe('json');
      expect(formData.get('filesmetadata')).toBe(
        JSON.stringify(['doc1.pdf', 'doc2.docx', 'doc3.txt']),
      );

      // Verify only one file part was added (doc2.docx has content)
      const fileParts = formData.getAll('files');
      expect(fileParts).toHaveLength(1);
      expect(fileParts[0]).toBeInstanceOf(Blob);

      expect(result).toBe(instructItResults);
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

      it('should throw error when instruct request validation fails', async () => {
        const client = createClient('apiKey');
        mockValidateInstructItRequest.mockImplementation(() => {
          throw new Error('Invalid instruct request');
        });

        await expect(client.instruct.it({} as InstructItRequest)).rejects.toThrow(
          'Invalid instruct request',
        );

        expect(mockValidateInstructItRequest).toHaveBeenCalledWith({});
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

      it('should throw error when instruct response validation fails', async () => {
        const client = createClient('apiKey', {
          validateResponses: true,
        });
        mockResponse.json.mockResolvedValue({});
        mockValidateInstructItResults.mockImplementation(() => {
          throw new Error('Invalid instruct response');
        });

        await expect(client.instruct.it(instructItRequest)).rejects.toThrow(
          'Invalid instruct response',
        );

        expect(mockValidateInstructItResults).toHaveBeenCalledWith({});
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

  describe('header verification', () => {
    describe('main server (knowledgator provider)', () => {
      it('should use KnowledgatorAPI-Key header for comprehend service', async () => {
        const client = createClient('test-api-key');
        mockResponse.json.mockResolvedValue(comprehendResults);

        await client.comprehend.it(comprehendRequest);

        expect(mockCreateHttpClient).toHaveBeenCalledWith(
          expect.objectContaining({
            baseUrl: DEFAULT_SERVERS.comprehend,
            baseHeaders: {
              'Content-Type': 'application/json',
              'KnowledgatorAPI-Key': 'test-api-key',
              Authorization: 'Bearer test-api-key',
            },
          }),
        );
      });

      it('should use KnowledgatorAPI-Key header for extract service', async () => {
        const client = createClient('test-api-key');
        mockResponse.json.mockResolvedValue(extractBaseResults);

        await client.extract.it(extractBaseRequest);

        expect(mockCreateHttpClient).toHaveBeenCalledWith(
          expect.objectContaining({
            baseUrl: DEFAULT_SERVERS.extract,
            baseHeaders: {
              'Content-Type': 'application/json',
              'KnowledgatorAPI-Key': 'test-api-key',
              Authorization: 'Bearer test-api-key',
            },
          }),
        );
      });

      it('should use KnowledgatorAPI-Key header for instruct service', async () => {
        const client = createClient('test-api-key');
        mockResponse.json.mockResolvedValue(instructItResults);

        await client.instruct.it(instructItRequest);

        expect(mockCreateHttpClient).toHaveBeenCalledWith(
          expect.objectContaining({
            baseUrl: DEFAULT_SERVERS.instruct,
            baseHeaders: {
              'KnowledgatorAPI-Key': 'test-api-key',
              Authorization: 'Bearer test-api-key',
              // Ensure Content-Type is removed so browser/client can set multipart/form-data boundary
              'Content-Type': undefined,
            },
          }),
        );
      });
    });

    describe('rapidapi provider', () => {
      it('should use x-rapidapi-key and x-rapidapi-host headers for comprehend service', async () => {
        const client = createClient('test-rapidapi-key', {
          provider: 'rapidapi',
        });
        mockResponse.json.mockResolvedValue(comprehendResults);

        await client.comprehend.it(comprehendRequest);

        expect(mockCreateHttpClient).toHaveBeenCalledWith(
          expect.objectContaining({
            baseUrl: RAPID_API_SERVERS.comprehend,
            baseHeaders: {
              'Content-Type': 'application/json',
              'x-rapidapi-host': 'comprehend-it.p.rapidapi.com',
              'x-rapidapi-key': 'test-rapidapi-key',
            },
          }),
        );
      });

      it('should use x-rapidapi-key and x-rapidapi-host headers for extract service', async () => {
        const client = createClient('test-rapidapi-key', {
          provider: 'rapidapi',
        });
        mockResponse.json.mockResolvedValue(extractBaseResults);

        await client.extract.it(extractBaseRequest);

        expect(mockCreateHttpClient).toHaveBeenCalledWith(
          expect.objectContaining({
            baseUrl: RAPID_API_SERVERS.extract,
            baseHeaders: {
              'Content-Type': 'application/json',
              'x-rapidapi-host': 'extract-it.p.rapidapi.com',
              'x-rapidapi-key': 'test-rapidapi-key',
            },
          }),
        );
      });

      it('should use x-rapidapi-key and x-rapidapi-host headers for instruct service', async () => {
        const client = createClient('test-rapidapi-key', {
          provider: 'rapidapi',
        });
        mockResponse.json.mockResolvedValue(instructItResults);

        await client.instruct.it(instructItRequest);

        expect(mockCreateHttpClient).toHaveBeenCalledWith(
          expect.objectContaining({
            baseUrl: RAPID_API_SERVERS.instruct,
            baseHeaders: {
              'x-rapidapi-host': 'instruct-it.p.rapidapi.com',
              'x-rapidapi-key': 'test-rapidapi-key',
              // Ensure Content-Type is removed so browser/client can set multipart/form-data boundary
              'Content-Type': undefined,
            },
          }),
        );
      });

      it('should use correct host for each rapidapi service', async () => {
        const client = createClient('test-rapidapi-key', {
          provider: 'rapidapi',
        });
        mockResponse.json.mockResolvedValue(comprehendResults);

        await client.comprehend.it(comprehendRequest);
        expect(mockCreateHttpClient).toHaveBeenLastCalledWith(
          expect.objectContaining({
            baseUrl: 'https://comprehend-it.p.rapidapi.com',
            baseHeaders: expect.objectContaining({
              'x-rapidapi-host': 'comprehend-it.p.rapidapi.com',
            }),
          }),
        );

        mockResponse.json.mockResolvedValue(extractBaseResults);

        await client.extract.it(extractBaseRequest);
        expect(mockCreateHttpClient).toHaveBeenLastCalledWith(
          expect.objectContaining({
            baseUrl: 'https://extract-it.p.rapidapi.com',
            baseHeaders: expect.objectContaining({
              'x-rapidapi-host': 'extract-it.p.rapidapi.com',
            }),
          }),
        );

        mockResponse.json.mockResolvedValue(instructItResults);

        await client.instruct.it(instructItRequest);
        expect(mockCreateHttpClient).toHaveBeenLastCalledWith(
          expect.objectContaining({
            baseUrl: 'https://instruct-it.p.rapidapi.com',
            baseHeaders: expect.objectContaining({
              'x-rapidapi-host': 'instruct-it.p.rapidapi.com',
            }),
          }),
        );
      });
    });
  });

  describe('dual headers and environment variable resolution', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      process.env = { ...originalEnv };
    });

    afterAll(() => {
      process.env = originalEnv;
    });

    it('should generate dual auth headers in getDefaultHeaders', () => {
      const headers = getDefaultHeaders('my-secret-key');
      expect(headers).toEqual({
        'Content-Type': 'application/json',
        'KnowledgatorAPI-Key': 'my-secret-key',
        Authorization: 'Bearer my-secret-key',
      });

      const bearerHeaders = getDefaultHeaders('Bearer already-prefixed');
      expect(bearerHeaders['Authorization']).toBe('Bearer already-prefixed');
    });

    it('should generate dual model headers in getModelIdHeader', () => {
      const headers = getModelIdHeader('model-xyz');
      expect(headers).toEqual({
        'KnowledgatorAPI-Model-ID': 'model-xyz',
        'X-Model-Id': 'model-xyz',
      });

      expect(getModelIdHeader(undefined)).toBeUndefined();
    });

    it('should auto-resolve apiKey from process.env.KG_API_KEY when no apiKey argument is passed', async () => {
      process.env.KG_API_KEY = 'ambient-env-key';
      const client = createClient();

      mockResponse.json.mockResolvedValue(comprehendResults);
      await client.comprehend.it(comprehendRequest);

      expect(mockCreateHttpClient).toHaveBeenCalledWith(
        expect.objectContaining({
          baseHeaders: expect.objectContaining({
            'KnowledgatorAPI-Key': 'ambient-env-key',
            Authorization: 'Bearer ambient-env-key',
          }),
        }),
      );
    });

    it('should support config-only createClient(config) signature with env fallback', async () => {
      process.env.KG_API_KEY = 'config-only-key';
      const client = createClient({ debug: true });

      mockResponse.json.mockResolvedValue(comprehendResults);
      await client.comprehend.it(comprehendRequest);

      expect(mockCreateHttpClient).toHaveBeenCalledWith(
        expect.objectContaining({
          baseHeaders: expect.objectContaining({
            'KnowledgatorAPI-Key': 'config-only-key',
            Authorization: 'Bearer config-only-key',
          }),
        }),
      );
    });
  });
});
