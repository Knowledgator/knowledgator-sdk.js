import { createHttpClient, HttpOptions } from '../../client/http';
import { createClient } from '../../core/core';
import {
  type ListDataRequest,
  type CreateDataRequest,
  type UpdateDataRequest,
  type UploadDataRequest,
  type ListFormatsRequest,
  type Data,
  type ListDataResults,
  type DataCreationResults,
  type ListFormatsResults,
  validateListDataRequest,
  validateCreateDataRequest,
  validateUpdateDataRequest,
  validateUploadDataRequest,
  validateListFormatsRequest,
  validateData,
  validateListDataResults,
  validateDataCreationResults,
  validateListFormatsResults,
} from '../index';

jest.mock('../../client/http');
jest.mock('../index', () => {
  const actual = jest.requireActual('../index');
  return {
    ...actual,
    validateListDataRequest: jest.fn(),
    validateCreateDataRequest: jest.fn(),
    validateUpdateDataRequest: jest.fn(),
    validateUploadDataRequest: jest.fn(),
    validateListFormatsRequest: jest.fn(),
    validateData: jest.fn(),
    validateListDataResults: jest.fn(),
    validateDataCreationResults: jest.fn(),
    validateListFormatsResults: jest.fn(),
  };
});

const listDataRequest: ListDataRequest = {
  offset: 0,
  limit: 10,
};

const createDataRequest: CreateDataRequest = {
  name: 'test-data',
  type: 'ner',
  format: 'jsonl',
  description: 'Test data',
};

const updateDataRequest: UpdateDataRequest = {
  name: 'updated-data',
  description: 'Updated description',
};

const uploadDataRequest: UploadDataRequest = {
  file: new File(['test content'], 'test.jsonl', { type: 'application/jsonl' }),
};

const listFormatsRequest: ListFormatsRequest = {
  offset: 0,
  limit: 100,
};

const dataItem: Data = {
  id: 'data-123',
  name: 'test-data',
  type: 'ner',
  format: 'jsonl',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

const listDataResults: ListDataResults = {
  data: [dataItem],
  total: 1,
  offset: 0,
  limit: 10,
};

const dataCreationResults: DataCreationResults = {
  id: 'data-123',
  // status is optional/not present in ObjectCreation schema for raw data
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

const mockValidateListDataRequest = validateListDataRequest as jest.MockedFunction<
  typeof validateListDataRequest
>;
const mockValidateCreateDataRequest = validateCreateDataRequest as jest.MockedFunction<
  typeof validateCreateDataRequest
>;
const mockValidateUpdateDataRequest = validateUpdateDataRequest as jest.MockedFunction<
  typeof validateUpdateDataRequest
>;
const mockValidateUploadDataRequest = validateUploadDataRequest as jest.MockedFunction<
  typeof validateUploadDataRequest
>;
const mockValidateListFormatsRequest = validateListFormatsRequest as jest.MockedFunction<
  typeof validateListFormatsRequest
>;
const mockValidateData = validateData as jest.MockedFunction<typeof validateData>;
const mockValidateListDataResults = validateListDataResults as jest.MockedFunction<
  typeof validateListDataResults
>;
const mockValidateDataCreationResults = validateDataCreationResults as jest.MockedFunction<
  typeof validateDataCreationResults
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

describe('Data API', () => {
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

    mockValidateListDataRequest.mockImplementation(() => listDataRequest);
    mockValidateCreateDataRequest.mockImplementation(() => createDataRequest);
    mockValidateUpdateDataRequest.mockImplementation(() => updateDataRequest);
    mockValidateUploadDataRequest.mockImplementation(() => uploadDataRequest);
    mockValidateListFormatsRequest.mockImplementation(() => listFormatsRequest);
    mockValidateData.mockImplementation(() => dataItem);
    mockValidateListDataResults.mockImplementation(() => listDataResults);
    mockValidateDataCreationResults.mockImplementation(() => dataCreationResults);
    mockValidateListFormatsResults.mockImplementation(() => listFormatsResults);
  });

  describe('client creation', () => {
    it('should create client with data API', () => {
      const client = createClient('apiKey');

      expect(client).toHaveProperty('datasets');
      expect(client.datasets).toHaveProperty('listData');
      expect(client.datasets).toHaveProperty('createData');
      expect(client.datasets).toHaveProperty('getData');
      expect(client.datasets).toHaveProperty('updateData');
      expect(client.datasets).toHaveProperty('deleteData');
      expect(client.datasets).toHaveProperty('uploadData');
    });
  });

  describe('list data', () => {
    it('should call list endpoint with query parameters', async () => {
      const client = createClient('apiKey');
      mockResponse.json.mockResolvedValue(listDataResults);

      const result = await client.datasets.listData(listDataRequest);

      expect(mockValidateListDataRequest).toHaveBeenCalledWith(listDataRequest);
      expect(mockHttpClient.get).toHaveBeenCalledWith('/data/', {
        params: { offset: 0, limit: 10 },
      });
      expect(mockValidateListDataResults).toHaveBeenCalledWith(listDataResults);
      expect(result).toBe(listDataResults);
    });
  });

  describe('create data', () => {
    it('should call create endpoint with multipart/form-data', async () => {
      const client = createClient('apiKey');
      mockResponse.json.mockResolvedValue(dataCreationResults);

      const result = await client.datasets.createData(createDataRequest);

      expect(mockValidateCreateDataRequest).toHaveBeenCalledWith(createDataRequest);
      expect(mockHttpClient.post).toHaveBeenCalledWith('/data/', {
        body: expect.any(FormData),
      });

      const callArgs = mockHttpClient.post.mock.calls[0];
      const formData = callArgs[1]!.body as FormData;
      expect(formData.get('name')).toBe('test-data');
      expect(formData.get('type')).toBe('ner');
      expect(formData.get('format')).toBe('jsonl');
      expect(formData.get('description')).toBe('Test data');

      expect(mockValidateDataCreationResults).toHaveBeenCalledWith(dataCreationResults);
      expect(result).toBe(dataCreationResults);
    });
  });

  describe('get data', () => {
    it('should call get endpoint with data ID', async () => {
      const client = createClient('apiKey');
      mockResponse.json.mockResolvedValue(dataItem);

      const result = await client.datasets.getData('data-123');

      expect(mockHttpClient.get).toHaveBeenCalledWith('/data/data-123/', {});
      expect(mockValidateData).toHaveBeenCalledWith(dataItem);
      expect(result).toBe(dataItem);
    });
  });

  describe('update data', () => {
    it('should call update endpoint with PATCH method', async () => {
      const client = createClient('apiKey');

      await client.datasets.updateData('data-123', updateDataRequest);

      expect(mockValidateUpdateDataRequest).toHaveBeenCalledWith(updateDataRequest);
      expect(mockHttpClient.patch).toHaveBeenCalledWith('/data/data-123/', {
        body: JSON.stringify(updateDataRequest),
      });
    });
  });

  describe('delete data', () => {
    it('should call delete endpoint', async () => {
      const client = createClient('apiKey');

      await client.datasets.deleteData('data-123');

      expect(mockHttpClient.delete).toHaveBeenCalledWith('/data/data-123/', {});
    });
  });

  describe('upload data files', () => {
    it('should call upload endpoint with multipart/form-data', async () => {
      const client = createClient('apiKey');
      mockResponse.json.mockResolvedValue(dataCreationResults);

      const result = await client.datasets.uploadData('data-123', uploadDataRequest);

      expect(mockValidateUploadDataRequest).toHaveBeenCalledWith(uploadDataRequest);
      expect(mockHttpClient.post).toHaveBeenCalledWith('/data/data-123/files/upload/', {
        body: expect.any(FormData),
      });

      const callArgs = mockHttpClient.post.mock.calls[0];
      const formData = callArgs[1]!.body as FormData;
      expect(formData.get('file')).toBe(uploadDataRequest.file);

      expect(mockValidateDataCreationResults).toHaveBeenCalledWith(dataCreationResults);
      expect(result).toBe(dataCreationResults);
    });
  });
});
