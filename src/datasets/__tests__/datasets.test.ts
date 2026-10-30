import {
  ApiKeyRequiredError,
  CustomProviderMissingConfigError,
  RapidApiNotSupportedError,
} from '../../client/errors';
import { createHttpClient, HttpOptions } from '../../client/http';
import { createClient } from '../../core/core';
import { DEFAULT_CONFIG, DEFAULT_SERVERS, getDefaultHeaders } from '../../core/defaults';
import type { EndpointConfig, ServerConfig } from '../../core/types';
import {
  type ListDatasetsRequest,
  type CreateDatasetRequest,
  type UpdateDatasetRequest,
  type UploadDatasetRequest,
  type ListFormatsRequest,
  type Dataset,
  type ListDatasetsResults,
  type DatasetCreationResults,
  type ListFormatsResults,
  validateListDatasetsRequest,
  validateCreateDatasetRequest,
  validateUpdateDatasetRequest,
  validateUploadDatasetRequest,
  validateListFormatsRequest,
  validateDataset,
  validateListDatasetsResults,
  validateDatasetCreationResults,
  validateListFormatsResults,
} from '../index';

jest.mock('../../client/http');
jest.mock('../index', () => {
  const actual = jest.requireActual('../index');
  return {
    ...actual,
    validateListDatasetsRequest: jest.fn(),
    validateCreateDatasetRequest: jest.fn(),
    validateUpdateDatasetRequest: jest.fn(),
    validateUploadDatasetRequest: jest.fn(),
    validateListFormatsRequest: jest.fn(),
    validateDataset: jest.fn(),
    validateListDatasetsResults: jest.fn(),
    validateDatasetCreationResults: jest.fn(),
    validateListFormatsResults: jest.fn(),
  };
});

const listDatasetsRequest: ListDatasetsRequest = {
  offset: 0,
  limit: 10,
};

const createDatasetRequest: CreateDatasetRequest = {
  name: 'test-dataset',
  type: 'ner',
  format: 'jsonl',
  description: 'Test dataset',
};

const updateDatasetRequest: UpdateDatasetRequest = {
  name: 'updated-dataset',
  description: 'Updated description',
};

const uploadDatasetRequest: UploadDatasetRequest = {
  file: new File(['test content'], 'test.jsonl', { type: 'application/jsonl' }),
};

const listFormatsRequest: ListFormatsRequest = {
  offset: 0,
  limit: 100,
};

const dataset: Dataset = {
  id: 'dataset-123',
  name: 'test-dataset',
  type: 'ner',
  format: 'jsonl',
  status: 'ready',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

const listDatasetsResults: ListDatasetsResults = {
  datasets: [dataset],
  total: 1,
  offset: 0,
  limit: 10,
};

const datasetCreationResults: DatasetCreationResults = {
  id: 'dataset-123',
  name: 'test-dataset',
  type: 'ner',
  format: 'jsonl',
  status: 'pending',
  created_at: '2024-01-01T00:00:00Z',
};

const listFormatsResults: ListFormatsResults = {
  formats: [
    { name: 'jsonl', description: 'JSON Lines format' },
    { name: 'csv', description: 'CSV format' },
  ],
  total: 2,
  offset: 0,
  limit: 100,
};

const mockValidateListDatasetsRequest = validateListDatasetsRequest as jest.MockedFunction<
  typeof validateListDatasetsRequest
>;
const mockValidateCreateDatasetRequest = validateCreateDatasetRequest as jest.MockedFunction<
  typeof validateCreateDatasetRequest
>;
const mockValidateUpdateDatasetRequest = validateUpdateDatasetRequest as jest.MockedFunction<
  typeof validateUpdateDatasetRequest
>;
const mockValidateUploadDatasetRequest = validateUploadDatasetRequest as jest.MockedFunction<
  typeof validateUploadDatasetRequest
>;
const mockValidateListFormatsRequest = validateListFormatsRequest as jest.MockedFunction<
  typeof validateListFormatsRequest
>;
const mockValidateDataset = validateDataset as jest.MockedFunction<typeof validateDataset>;
const mockValidateListDatasetsResults = validateListDatasetsResults as jest.MockedFunction<
  typeof validateListDatasetsResults
>;
const mockValidateDatasetCreationResults = validateDatasetCreationResults as jest.MockedFunction<
  typeof validateDatasetCreationResults
>;
const mockValidateListFormatsResults = validateListFormatsResults as jest.MockedFunction<
  typeof validateListFormatsResults
>;

type MockResponse = {
  json: jest.MockedFunction<() => Promise<unknown>>;
};
type MockHttpClient = {
  get: jest.MockedFunction<(path?: string, options?: HttpOptions) => Promise<Response>>;
  post: jest.MockedFunction<(path?: string, options?: HttpOptions) => Promise<Response>>;
  patch: jest.MockedFunction<(path?: string, options?: HttpOptions) => Promise<Response>>;
  delete: jest.MockedFunction<(path?: string, options?: HttpOptions) => Promise<Response>>;
};
const mockCreateHttpClient = createHttpClient as jest.MockedFunction<typeof createHttpClient>;

describe('Datasets API', () => {
  let mockResponse: MockResponse;
  let mockHttpClient: MockHttpClient;

  beforeEach(() => {
    jest.clearAllMocks();

    mockResponse = {
      json: jest.fn(),
    };
    mockHttpClient = {
      get: jest.fn().mockResolvedValue(mockResponse),
      post: jest.fn().mockResolvedValue(mockResponse),
      patch: jest.fn().mockResolvedValue(mockResponse),
      delete: jest.fn().mockResolvedValue({ status: 204 }),
    };
    mockCreateHttpClient.mockReturnValue(
      mockHttpClient as unknown as ReturnType<typeof createHttpClient>,
    );

    mockValidateListDatasetsRequest.mockImplementation(() => listDatasetsRequest);
    mockValidateCreateDatasetRequest.mockImplementation(() => createDatasetRequest);
    mockValidateUpdateDatasetRequest.mockImplementation(() => updateDatasetRequest);
    mockValidateUploadDatasetRequest.mockImplementation(() => uploadDatasetRequest);
    mockValidateListFormatsRequest.mockImplementation(() => listFormatsRequest);
    mockValidateDataset.mockImplementation(() => dataset);
    mockValidateListDatasetsResults.mockImplementation(() => listDatasetsResults);
    mockValidateDatasetCreationResults.mockImplementation(() => datasetCreationResults);
    mockValidateListFormatsResults.mockImplementation(() => listFormatsResults);
  });

  describe('client creation', () => {
    it('should create client with datasets API', () => {
      const client = createClient('apiKey');

      expect(client).toHaveProperty('datasets');
      expect(client.datasets).toHaveProperty('list');
      expect(client.datasets).toHaveProperty('create');
      expect(client.datasets).toHaveProperty('get');
      expect(client.datasets).toHaveProperty('update');
      expect(client.datasets).toHaveProperty('delete');
      expect(client.datasets).toHaveProperty('upload');
      expect(client.datasets).toHaveProperty('download');
      expect(client.datasets).toHaveProperty('streamDownload');
      expect(client.datasets).toHaveProperty('listFormats');
    });
  });

  describe('list datasets', () => {
    it('should call list endpoint with query parameters', async () => {
      const client = createClient('apiKey');
      mockResponse.json.mockResolvedValue(listDatasetsResults);

      const result = await client.datasets.list(listDatasetsRequest);

      expect(mockValidateListDatasetsRequest).toHaveBeenCalledWith(listDatasetsRequest);
      expect(mockHttpClient.get).toHaveBeenCalledWith('/datasets/', {
        params: { offset: 0, limit: 10 },
      });
      expect(mockValidateListDatasetsResults).toHaveBeenCalledWith(listDatasetsResults);
      expect(result).toBe(listDatasetsResults);
    });

    it('should handle empty request', async () => {
      const client = createClient('apiKey');
      mockValidateListDatasetsRequest.mockImplementation(() => ({}));
      mockResponse.json.mockResolvedValue(listDatasetsResults);

      const result = await client.datasets.list();

      expect(mockHttpClient.get).toHaveBeenCalledWith('/datasets/', {
        params: {},
      });
      expect(result).toBe(listDatasetsResults);
    });

    it('should filter null and undefined query parameters', async () => {
      const client = createClient('apiKey');
      const requestWithFilters: ListDatasetsRequest = {
        offset: 0,
        limit: 10,
        name: 'test',
        type: 'ner',
        format: null,
        status: undefined,
      };
      mockValidateListDatasetsRequest.mockImplementation(() => requestWithFilters);
      mockResponse.json.mockResolvedValue(listDatasetsResults);

      await client.datasets.list(requestWithFilters);

      // Note: null/undefined filtering is now handled by the http client's buildUrl
      expect(mockHttpClient.get).toHaveBeenCalledWith('/datasets/', {
        params: requestWithFilters,
      });
    });
  });

  describe('create dataset', () => {
    it('should call create endpoint with multipart/form-data', async () => {
      const client = createClient('apiKey');
      mockResponse.json.mockResolvedValue(datasetCreationResults);

      const result = await client.datasets.create(createDatasetRequest);

      expect(mockValidateCreateDatasetRequest).toHaveBeenCalledWith(createDatasetRequest);
      expect(mockHttpClient.post).toHaveBeenCalledWith('/datasets/', {
        body: expect.any(FormData),
      });

      const callArgs = mockHttpClient.post.mock.calls[0];
      const formData = callArgs[1]!.body as FormData;
      expect(formData.get('name')).toBe('test-dataset');
      expect(formData.get('type')).toBe('ner');
      expect(formData.get('format')).toBe('jsonl');
      expect(formData.get('description')).toBe('Test dataset');

      expect(mockValidateDatasetCreationResults).toHaveBeenCalledWith(datasetCreationResults);
      expect(result).toBe(datasetCreationResults);
    });

    it('should handle file upload in create request', async () => {
      const client = createClient('apiKey');
      const file = new File(['test content'], 'test.jsonl', { type: 'application/jsonl' });
      const requestWithFile: CreateDatasetRequest = {
        ...createDatasetRequest,
        file,
      };
      mockValidateCreateDatasetRequest.mockImplementation(() => requestWithFile);
      mockResponse.json.mockResolvedValue(datasetCreationResults);

      await client.datasets.create(requestWithFile);

      const callArgs = mockHttpClient.post.mock.calls[0];
      const formData = callArgs[1]!.body as FormData;
      expect(formData.get('file')).toBe(file);
    });
  });

  describe('get dataset', () => {
    it('should call get endpoint with dataset ID', async () => {
      const client = createClient('apiKey');
      mockResponse.json.mockResolvedValue(dataset);

      const result = await client.datasets.get('dataset-123');

      expect(mockHttpClient.get).toHaveBeenCalledWith('/datasets/dataset-123/', {});
      expect(mockValidateDataset).toHaveBeenCalledWith(dataset);
      expect(result).toBe(dataset);
    });
  });

  describe('update dataset', () => {
    it('should call update endpoint with PATCH method', async () => {
      const client = createClient('apiKey');

      await client.datasets.update('dataset-123', updateDatasetRequest);

      expect(mockValidateUpdateDatasetRequest).toHaveBeenCalledWith(updateDatasetRequest);
      expect(mockHttpClient.patch).toHaveBeenCalledWith('/datasets/dataset-123/', {
        body: JSON.stringify(updateDatasetRequest),
      });
    });
  });

  describe('delete dataset', () => {
    it('should call delete endpoint', async () => {
      const client = createClient('apiKey');

      await client.datasets.delete('dataset-123');

      expect(mockHttpClient.delete).toHaveBeenCalledWith('/datasets/dataset-123/', {});
    });
  });

  describe('upload dataset files', () => {
    it('should call upload endpoint with multipart/form-data', async () => {
      const client = createClient('apiKey');
      mockResponse.json.mockResolvedValue(datasetCreationResults);

      const result = await client.datasets.upload('dataset-123', uploadDatasetRequest);

      expect(mockValidateUploadDatasetRequest).toHaveBeenCalledWith(uploadDatasetRequest);
      expect(mockHttpClient.post).toHaveBeenCalledWith('/datasets/dataset-123/files/upload/', {
        body: expect.any(FormData),
      });

      const callArgs = mockHttpClient.post.mock.calls[0];
      const formData = callArgs[1]!.body as FormData;
      expect(formData.get('file')).toBe(uploadDatasetRequest.file);

      expect(mockValidateDatasetCreationResults).toHaveBeenCalledWith(datasetCreationResults);
      expect(result).toBe(datasetCreationResults);
    });
  });

  describe('list formats', () => {
    it('should call list formats endpoint', async () => {
      const client = createClient('apiKey');
      mockResponse.json.mockResolvedValue(listFormatsResults);

      const result = await client.datasets.listFormats(listFormatsRequest);

      expect(mockValidateListFormatsRequest).toHaveBeenCalledWith(listFormatsRequest);
      expect(mockHttpClient.get).toHaveBeenCalledWith('/files/formats/datasets/', {
        params: { offset: 0, limit: 100 },
      });
      expect(mockValidateListFormatsResults).toHaveBeenCalledWith(listFormatsResults);
      expect(result).toBe(listFormatsResults);
    });
  });

  describe('provider configurations', () => {
    describe('when provider is knowledgator', () => {
      it('should throw error when api key is empty', async () => {
        const client = createClient('');

        await expect(client.datasets.list()).rejects.toThrow(ApiKeyRequiredError);
      });

      it('should use default servers and headers', async () => {
        const client = createClient('apiKey');
        mockResponse.json.mockResolvedValue(listDatasetsResults);

        await client.datasets.list();

        expect(mockCreateHttpClient).toHaveBeenCalledWith({
          baseUrl: DEFAULT_SERVERS.datasets,
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

        await expect(client.datasets.list()).rejects.toThrow(ApiKeyRequiredError);
      });

      it('should throw RapidApiNotSupportedError because datasets is not supported by RapidAPI', async () => {
        const client = createClient('apiKey', {
          provider: 'rapidapi',
        });

        await expect(client.datasets.list()).rejects.toThrow(RapidApiNotSupportedError);
      });
    });

    describe('when provider is custom', () => {
      it('should throw error when servers are not provided', async () => {
        const client = createClient('', {
          provider: 'custom',
          servers: undefined as unknown as ServerConfig,
          endpoints: {
            datasets: '/custom-datasets',
          },
        });

        await expect(client.datasets.list()).rejects.toThrow(CustomProviderMissingConfigError);
      });

      it('should throw error when endpoints are not provided', async () => {
        const client = createClient('', {
          provider: 'custom',
          servers: {
            datasets: 'https://custom-datasets.com',
          },
          endpoints: undefined as unknown as EndpointConfig,
        });

        await expect(client.datasets.list()).rejects.toThrow(CustomProviderMissingConfigError);
      });

      it('should use custom servers and headers', async () => {
        const client = createClient('', {
          provider: 'custom',
          servers: {
            datasets: 'https://custom-datasets.com',
          },
          endpoints: {
            datasets: '/custom-datasets',
            datasetsById: '/custom-datasets/:id',
            datasetsUpload: '/custom-datasets/:id/upload',
            datasetsFormats: '/custom-formats',
          },
          baseHeaders: { 'Custom-Auth': 'Custom-Auth' },
        });
        mockResponse.json.mockResolvedValue(listDatasetsResults);

        await client.datasets.list();

        expect(mockCreateHttpClient).toHaveBeenCalledWith({
          baseUrl: 'https://custom-datasets.com',
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
        expect(mockHttpClient.get).toHaveBeenCalledWith('/custom-datasets', {
          params: { offset: 0, limit: 10 },
        });
      });
    });
  });

  describe('response validation', () => {
    it('should validate responses when validateResponses is true', async () => {
      const client = createClient('apiKey', {
        validateResponses: true,
      });
      mockResponse.json.mockResolvedValue(listDatasetsResults);
      mockValidateListDatasetsResults.mockReturnValue(listDatasetsResults);

      const result = await client.datasets.list();

      expect(mockValidateListDatasetsResults).toHaveBeenCalledWith(listDatasetsResults);
      expect(result).toBe(listDatasetsResults);
    });

    it('should skip validation when validateResponses is false', async () => {
      const client = createClient('apiKey', {
        validateResponses: false,
      });
      mockResponse.json.mockResolvedValue(listDatasetsResults);

      const result = await client.datasets.list();

      expect(mockValidateListDatasetsResults).not.toHaveBeenCalled();
      expect(result).toBe(listDatasetsResults);
    });
  });

  describe('validation errors', () => {
    it('should throw error when list request validation fails', async () => {
      const client = createClient('apiKey');
      mockValidateListDatasetsRequest.mockImplementation(() => {
        throw new Error('Invalid list request');
      });

      await expect(client.datasets.list({} as ListDatasetsRequest)).rejects.toThrow(
        'Invalid list request',
      );

      expect(mockValidateListDatasetsRequest).toHaveBeenCalledWith({});
      expect(mockHttpClient.get).not.toHaveBeenCalled();
    });

    it('should throw error when create request validation fails', async () => {
      const client = createClient('apiKey');
      mockValidateCreateDatasetRequest.mockImplementation(() => {
        throw new Error('Invalid create request');
      });

      await expect(client.datasets.create({} as CreateDatasetRequest)).rejects.toThrow(
        'Invalid create request',
      );

      expect(mockValidateCreateDatasetRequest).toHaveBeenCalledWith({});
      expect(mockHttpClient.post).not.toHaveBeenCalled();
    });

    it('should throw error when response validation fails', async () => {
      const client = createClient('apiKey', {
        validateResponses: true,
      });
      mockResponse.json.mockResolvedValue({});
      mockValidateListDatasetsResults.mockImplementation(() => {
        throw new Error('Invalid list response');
      });

      await expect(client.datasets.list()).rejects.toThrow('Invalid list response');

      expect(mockValidateListDatasetsResults).toHaveBeenCalledWith({});
    });
  });

  describe('download dataset', () => {
    it('should download dataset in-memory as raw bytes', async () => {
      const client = createClient('apiKey');
      const sampleData = [{ text: 'sample review', true_labels: ['positive'] }];
      const sampleJson = JSON.stringify(sampleData);

      const fakeResponse = {
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        text: jest.fn().mockResolvedValue(sampleJson),
      } as unknown as Response;

      mockHttpClient.get.mockResolvedValue(fakeResponse);

      const result = await client.datasets.download('dataset-123');
      expect(mockHttpClient.get).toHaveBeenCalledWith('/datasets/dataset-123/download/');
      expect(result).toBeInstanceOf(Uint8Array);
      expect(new TextDecoder().decode(result as Uint8Array)).toBe(sampleJson);
    });

    it('should download dataset with returnData: true and parse JSON', async () => {
      const client = createClient('apiKey');
      const sampleData = [{ text: 'sample review', true_labels: ['positive'] }];
      const sampleJson = JSON.stringify(sampleData);

      const fakeResponse = {
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        text: jest.fn().mockResolvedValue(sampleJson),
      } as unknown as Response;

      mockHttpClient.get.mockResolvedValue(fakeResponse);

      const result = await client.datasets.download('dataset-123', { returnData: true });
      expect(result).toEqual(sampleData);
    });

    it('should stream download dataset chunks', async () => {
      const client = createClient('apiKey');
      const sampleData = 'chunk1chunk2chunk3';

      const fakeResponse = {
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'text/plain' }),
        text: jest.fn().mockResolvedValue(sampleData),
        arrayBuffer: jest.fn().mockResolvedValue(new TextEncoder().encode(sampleData).buffer),
      } as unknown as Response;

      mockHttpClient.get.mockResolvedValue(fakeResponse);

      const chunks: Uint8Array[] = [];
      for await (const chunk of client.datasets.streamDownload('dataset-123', { chunkSize: 6 })) {
        chunks.push(chunk);
      }

      expect(chunks.length).toBe(3);
      expect(new TextDecoder().decode(chunks[0])).toBe('chunk1');
      expect(new TextDecoder().decode(chunks[1])).toBe('chunk2');
      expect(new TextDecoder().decode(chunks[2])).toBe('chunk3');
    });

    it('should follow storage URL redirect pointer', async () => {
      const client = createClient('apiKey');
      const storageUrl = 'https://s3.amazonaws.com/bucket/dataset.json';
      const fileContent = '[{"item": 1}]';

      const redirectResponse = {
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        text: jest.fn().mockResolvedValue(JSON.stringify({ url: storageUrl })),
      } as unknown as Response;

      mockHttpClient.get.mockResolvedValue(redirectResponse);

      const originalFetch = global.fetch;
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        arrayBuffer: jest.fn().mockResolvedValue(new TextEncoder().encode(fileContent).buffer),
      } as unknown as Response);

      try {
        const result = await client.datasets.download('dataset-123', { returnData: true });
        expect(global.fetch).toHaveBeenCalledWith(storageUrl, { redirect: 'follow' });
        expect(result).toEqual([{ item: 1 }]);
      } finally {
        global.fetch = originalFetch;
      }
    });
  });
});
