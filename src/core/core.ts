import * as fs from 'fs';
import * as path from 'path';

import {
  ApiKeyRequiredError,
  CustomProviderMissingConfigError,
  CustomProviderMissingEndpointError,
  CustomProviderMissingServerError,
  HttpError,
  JsonParseError,
  RapidApiNotSupportedError,
} from '../client/errors';
import { createHttpClient } from '../client/http';
import { createDefaultLogger } from '../client/logger/logger';
import { getError } from '../client/utils';
import {
  type ListDatasetsRequest,
  type CreateDatasetRequest,
  type UpdateDatasetRequest,
  type UploadDatasetRequest,
  type DownloadDatasetOptions,
  type StreamDownloadDatasetOptions,
  type ListFormatsRequest,
  type ListDataRequest,
  type CreateDataRequest,
  type UpdateDataRequest,
  type UploadDataRequest,
  type Dataset,
  type ListDatasetsResults,
  type DatasetCreationResults,
  type ListFormatsResults,
  type Data,
  type ListDataResults,
  type DataCreationResults,
  validateListDatasetsRequest,
  validateCreateDatasetRequest,
  validateUpdateDatasetRequest,
  validateUploadDatasetRequest,
  validateListFormatsRequest,
  validateListDataRequest,
  validateCreateDataRequest,
  validateUpdateDataRequest,
  validateUploadDataRequest,
  validateDataset,
  validateListDatasetsResults,
  validateDatasetCreationResults,
  validateListFormatsResults,
  validateData,
  validateListDataResults,
  validateDataCreationResults,
} from '../datasets';
import {
  type CreateBaseModelRequest,
  type ListModelsRequest,
  type StartTrainingRequest,
  type ListTrainingsRequest,
  type ListEventsRequest,
  type GetMetricsRequest,
  type TrainingModel,
  type ListModelsResults,
  type ObjectCreation,
  type TrainingObject,
  type ListTrainingsResults,
  type ListTagsResults,
  type ListEventsResults,
  type ListMetricsResults,
  validateCreateBaseModelRequest,
  validateListModelsRequest,
  validateStartTrainingRequest,
  validateListTrainingsRequest,
  validateListEventsRequest,
  validateTrainingModel,
  validateListModelsResults,
  validateObjectCreation,
  validateTrainingObject,
  validateListTrainingsResults,
  validateListTagsResults,
  validateListEventsResults,
  validateListMetricsResults,
  validateGetMetricsRequest,
} from '../finetuning';
import {
  validateComprehendRequest,
  validateExtractRequest,
  validateExtractRelationsRequest,
  validateExtractSummaryRequest,
  type ComprehendRequest,
  type ExtractRequest,
  type ExtractRelationsRequest,
  type ExtractSummaryRequest,
  type InstructItRequest,
  validateInstructItRequest,
} from '../models/inputs';
import {
  type ExtractResults,
  type ExtractRelationsResults,
  type ExtractSummaryResults,
  validateExtractResults,
  validateExtractRelationsResults,
  validateExtractSummaryResults,
  type ComprehendResults,
  validateComprehendResults,
  type InstructItResults,
  validateInstructItResults,
} from '../models/outputs';
import { createOpenModelApi } from '../open-model';

import {
  DEFAULT_CONFIG,
  DEFAULT_ENDPOINTS,
  DEFAULT_SERVERS,
  getDefaultHeaders,
  getRapidApiHeaders,
  RAPID_API_SERVERS,
} from './defaults';
import type { EndpointConfig, Config, ServerConfig, RequestConfig, SendRequest } from './types';
import { omitHeaders, replacePathParams, getModelIdHeader } from './utils';

const resolveRapidApiConfig = (
  apiKey: string,
  serviceKey: keyof ServerConfig,
  endpointKey: keyof EndpointConfig,
  pathParams?: Record<string, string>,
): RequestConfig => {
  if (!apiKey) {
    throw new ApiKeyRequiredError();
  }

  const baseUrl = RAPID_API_SERVERS[serviceKey];

  if (!baseUrl) {
    throw new RapidApiNotSupportedError(serviceKey);
  }

  return {
    baseUrl,
    endpoint: replacePathParams(DEFAULT_ENDPOINTS[endpointKey], pathParams),
    baseHeaders: getRapidApiHeaders(baseUrl.replace('https://', ''), apiKey),
  };
};

const resolveCustomConfig = (
  apiKey: string,
  config: Extract<Config, { provider: 'custom' }>,
  serviceKey: keyof ServerConfig,
  endpointKey: keyof EndpointConfig,
  pathParams?: Record<string, string>,
): RequestConfig => {
  if (!config.servers || !config.endpoints) {
    throw new CustomProviderMissingConfigError();
  }

  const baseUrl = config.servers[serviceKey];

  if (!baseUrl) {
    throw new CustomProviderMissingServerError(serviceKey);
  }

  const endpoint = config.endpoints[endpointKey] ?? DEFAULT_ENDPOINTS[endpointKey];

  if (!endpoint) {
    throw new CustomProviderMissingEndpointError(endpointKey);
  }

  return {
    baseUrl,
    endpoint: replacePathParams(endpoint, pathParams),
    baseHeaders: {
      ...(apiKey ? getDefaultHeaders(apiKey) : {}),
      ...config.baseHeaders,
    },
  };
};

const resolveDefaultConfig = (
  apiKey: string,
  serviceKey: keyof ServerConfig,
  endpointKey: keyof EndpointConfig,
  pathParams?: Record<string, string>,
): RequestConfig => {
  if (!apiKey) {
    throw new ApiKeyRequiredError();
  }

  return {
    baseUrl: DEFAULT_SERVERS[serviceKey],
    endpoint: replacePathParams(DEFAULT_ENDPOINTS[endpointKey], pathParams),
    baseHeaders: getDefaultHeaders(apiKey),
  };
};

const resolveRequestConfig = (
  apiKey: string,
  config: Config,
  serviceKey: keyof ServerConfig,
  endpointKey: keyof EndpointConfig,
  pathParams?: Record<string, string>,
): RequestConfig => {
  if (config.provider === 'rapidapi') {
    return resolveRapidApiConfig(apiKey, serviceKey, endpointKey, pathParams);
  }

  if (config.provider === 'custom') {
    return resolveCustomConfig(apiKey, config, serviceKey, endpointKey, pathParams);
  }

  return resolveDefaultConfig(apiKey, serviceKey, endpointKey, pathParams);
};

const sendRequest = (async (apiKey, config, options) => {
  const { method, serviceKey, endpointKey, pathParams, queryParams, body, responseValidator } =
    options;

  const { baseUrl, endpoint, baseHeaders } = resolveRequestConfig(
    apiKey,
    config,
    serviceKey,
    endpointKey,
    pathParams,
  );

  const headers = {
    ...((body?.type === 'formData' ? omitHeaders(baseHeaders, ['Content-Type']) : baseHeaders) ||
      {}),
    ...options.headers,
  };

  const httpClient = createHttpClient({
    baseUrl,
    baseHeaders: headers,
    timeout: config.timeout,
    retryPolicy: config.retryPolicy,
    requestInterceptor: config.requestInterceptor,
    responseInterceptor: config.responseInterceptor,
    logger: config.logger,
  });

  const requestBody = body
    ? body.type === 'json'
      ? JSON.stringify(body.data)
      : body.data
    : undefined;
  const requestOptions = { body: requestBody, params: queryParams };

  let response: Response;
  switch (method) {
    case 'GET':
      response = await httpClient.get(endpoint, requestOptions);
      break;
    case 'POST':
      response = await httpClient.post(endpoint, requestOptions);
      break;
    case 'PUT':
      response = await httpClient.put(endpoint, requestOptions);
      break;
    case 'PATCH':
      response = await httpClient.patch(endpoint, requestOptions);
      break;
    case 'DELETE':
      response = await httpClient.delete(endpoint, requestOptions);
      break;
    case 'HEAD':
      response = await httpClient.head(endpoint, { params: queryParams });
      break;
    case 'OPTIONS':
      response = await httpClient.options(endpoint, { params: queryParams });
      break;
    default: {
      throw new Error(`Unsupported method: ${method}`);
    }
  }

  if (response.status === 204) {
    return;
  }

  try {
    const output = await response.json();

    return config.validateResponses
      ? responseValidator
        ? responseValidator(output)
        : output
      : output;
  } catch (err) {
    throw new JsonParseError(getError(err));
  }
}) as SendRequest;

const sendInstructRequest = async <TOutput>(
  apiKey: string,
  config: Config,
  serviceKey: keyof ServerConfig,
  endpointKey: keyof EndpointConfig,
  data: InstructItRequest,
  validator: (data: unknown) => TOutput,
): Promise<TOutput> => {
  const formData = new FormData();

  formData.append('text', data.text);
  const templateStr =
    typeof data.template === 'object' && data.template !== null
      ? JSON.stringify(data.template)
      : String(data.template);
  formData.append('template', templateStr);
  if (data.output_type) {
    formData.append('output_type', data.output_type);
  }

  if (data.files && data.files.length > 0) {
    const filesmetadata = data.files.map((file) => file.name);
    formData.append('filesmetadata', JSON.stringify(filesmetadata));

    for (const file of data.files) {
      if (file.content) {
        const blob = new Blob([file.content]);
        formData.append('files', blob, file.name);
      }
    }
  }

  return sendRequest(apiKey, config, {
    method: 'POST',
    serviceKey,
    endpointKey,
    body: { type: 'formData', data: formData },
    headers: getModelIdHeader(data.adapter_id ?? data.model_id),
    responseValidator: validator,
  });
};

const createComprehendApi = (apiKey: string, config: Config) => ({
  it: async (request: ComprehendRequest): Promise<ComprehendResults> =>
    sendRequest(apiKey, config, {
      method: 'POST',
      serviceKey: 'comprehend',
      endpointKey: 'comprehend',
      body: { type: 'json', data: validateComprehendRequest(request) },
      headers: getModelIdHeader((request.adapter_id ?? request.model_id) || undefined),
      responseValidator: validateComprehendResults,
    }),
});

const createExtractApi = (apiKey: string, config: Config) => ({
  it: async (request: ExtractRequest): Promise<ExtractResults> => {
    const data = validateExtractRequest(request);
    return sendRequest(apiKey, config, {
      method: 'POST',
      serviceKey: 'extract',
      endpointKey: 'extract',
      body: { type: 'json', data },
      headers: getModelIdHeader((request.adapter_id ?? request.model_id) || undefined),
      responseValidator: validateExtractResults,
    });
  },
  relations: async (request: ExtractRelationsRequest): Promise<ExtractRelationsResults> => {
    const data = validateExtractRelationsRequest(request);
    return sendRequest(apiKey, config, {
      method: 'POST',
      serviceKey: 'extract',
      endpointKey: 'extractRelations',
      body: { type: 'json', data },
      headers: getModelIdHeader(request.adapter_id ?? request.model_id),
      responseValidator: validateExtractRelationsResults,
    });
  },
  summary: async (request: ExtractSummaryRequest): Promise<ExtractSummaryResults> =>
    sendRequest(apiKey, config, {
      method: 'POST',
      serviceKey: 'extract',
      endpointKey: 'extractSummary',
      body: { type: 'json', data: validateExtractSummaryRequest(request) },
      headers: getModelIdHeader(request.adapter_id ?? request.model_id),
      responseValidator: validateExtractSummaryResults,
    }),
});

const createInstructApi = (apiKey: string, config: Config) => ({
  it: async (request: InstructItRequest): Promise<InstructItResults> =>
    sendInstructRequest(
      apiKey,
      config,
      'instruct',
      'instruct',
      validateInstructItRequest(request),
      validateInstructItResults,
    ),
});

const createDatasetsApi = (apiKey: string, config: Config) => {
  const sendDatasetsRequest = async <TOutput>(
    endpointKey: keyof EndpointConfig,
    data: CreateDatasetRequest | UploadDatasetRequest | CreateDataRequest | UploadDataRequest,
    validator: (data: unknown) => TOutput,
    pathParams?: Record<string, string>,
  ): Promise<TOutput> => {
    const formData = new FormData();

    if ('name' in data) {
      formData.append('name', data.name);
      formData.append('type', data.type);
      formData.append('format', data.format);
      if (data.short_description) {
        formData.append('short_description', data.short_description);
      }
      if ('parent_dataset_id' in data && data.parent_dataset_id) {
        formData.append('parent_dataset_id', data.parent_dataset_id);
      }
    }

    const filePath =
      'filePath' in data || 'file_path' in data
        ? ((data as { filePath?: string; file_path?: string }).filePath ??
          (data as { filePath?: string; file_path?: string }).file_path)
        : undefined;
    if (filePath) {
      if (!fs.existsSync(filePath)) {
        throw new Error(`Dataset file not found: ${filePath}`);
      }
      const fileBytes = fs.readFileSync(filePath);
      const fileName = path.basename(filePath);
      formData.append('file', new Blob([fileBytes]), fileName);
    } else if (data.file) {
      if (data.file instanceof Blob) {
        formData.append('file', data.file);
      } else if (Buffer.isBuffer(data.file) || data.file instanceof Uint8Array) {
        formData.append('file', new Blob([data.file]), 'dataset.json');
      } else if (typeof data.file === 'string') {
        if (fs.existsSync(data.file)) {
          const fileBytes = fs.readFileSync(data.file);
          const fileName = path.basename(data.file);
          formData.append('file', new Blob([fileBytes]), fileName);
        } else {
          formData.append('file', new Blob([data.file]), 'dataset.json');
        }
      } else {
        formData.append('file', data.file);
      }
    }

    return sendRequest(apiKey, config, {
      method: 'POST',
      serviceKey: 'datasets',
      endpointKey,
      pathParams,
      body: { type: 'formData', data: formData },
      responseValidator: validator,
    });
  };

  const api = {
    list: async (request: ListDatasetsRequest = {}): Promise<ListDatasetsResults> =>
      sendRequest(apiKey, config, {
        method: 'GET',
        serviceKey: 'datasets',
        endpointKey: 'datasets',
        queryParams: validateListDatasetsRequest(request),
        responseValidator: validateListDatasetsResults,
      }),
    create: async (request: CreateDatasetRequest): Promise<DatasetCreationResults> =>
      sendDatasetsRequest(
        'datasets',
        validateCreateDatasetRequest(request),
        validateDatasetCreationResults,
      ),
    get: async (datasetId: string): Promise<Dataset> =>
      sendRequest(apiKey, config, {
        method: 'GET',
        serviceKey: 'datasets',
        endpointKey: 'datasetsById',
        pathParams: { id: datasetId },
        responseValidator: validateDataset,
      }),
    update: async (datasetId: string, request: UpdateDatasetRequest): Promise<void> =>
      sendRequest(apiKey, config, {
        method: 'PATCH',
        serviceKey: 'datasets',
        endpointKey: 'datasetsById',
        pathParams: { id: datasetId },
        body: { type: 'json', data: validateUpdateDatasetRequest(request) },
      }),
    delete: async (datasetId: string): Promise<void> =>
      sendRequest(apiKey, config, {
        method: 'DELETE',
        serviceKey: 'datasets',
        endpointKey: 'datasetsById',
        pathParams: { id: datasetId },
      }),
    upload: async (
      datasetId: string,
      request: UploadDatasetRequest,
    ): Promise<DatasetCreationResults> =>
      sendDatasetsRequest(
        'datasetsUpload',
        validateUploadDatasetRequest(request),
        validateDatasetCreationResults,
        { id: datasetId },
      ),
    streamDownload: async function* (
      datasetId: string,
      options?: StreamDownloadDatasetOptions,
    ): AsyncGenerator<Uint8Array, void, unknown> {
      const { baseUrl, endpoint, baseHeaders } = resolveRequestConfig(
        apiKey,
        config,
        'datasets',
        'datasetsDownload',
        { id: datasetId },
      );

      const httpClient = createHttpClient({
        baseUrl,
        baseHeaders,
        timeout: config.timeout,
        retryPolicy: config.retryPolicy,
        requestInterceptor: config.requestInterceptor,
        responseInterceptor: config.responseInterceptor,
        logger: config.logger,
      });

      const response = await httpClient.get(endpoint);
      if (!response.ok) {
        throw new HttpError(response);
      }

      const contentType = response.headers.get('content-type') || '';
      let targetUrl: string | null = null;
      let initialBytes: Uint8Array | null = null;

      if (contentType.toLowerCase().includes('application/json')) {
        const text = await response.text();
        try {
          const parsed = JSON.parse(text);
          if (parsed && typeof parsed === 'object' && typeof parsed.url === 'string') {
            targetUrl = parsed.url;
          } else if (typeof parsed === 'string' && /^https?:\/\//i.test(parsed)) {
            targetUrl = parsed;
          } else {
            initialBytes = new TextEncoder().encode(text);
          }
        } catch {
          initialBytes = new TextEncoder().encode(text);
        }
      }

      let streamResponse = response;
      if (targetUrl) {
        config.logger?.debug('Following storage URL redirect', { targetUrl });
        const storageResp = await fetch(targetUrl, { redirect: 'follow' });
        if (!storageResp.ok) {
          throw new HttpError(storageResp);
        }
        streamResponse = storageResp;
      }

      const chunkSize = options?.chunkSize ?? options?.chunk_size ?? 65536;

      if (initialBytes) {
        for (let i = 0; i < initialBytes.length; i += chunkSize) {
          yield initialBytes.subarray(i, i + chunkSize);
        }
        return;
      }

      if (streamResponse.body) {
        const reader = streamResponse.body.getReader();
        try {
          let buffer = new Uint8Array(0);
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            if (value) {
              const combined = new Uint8Array(buffer.length + value.length);
              combined.set(buffer);
              combined.set(value, buffer.length);
              buffer = combined;

              while (buffer.length >= chunkSize) {
                yield buffer.subarray(0, chunkSize);
                buffer = buffer.subarray(chunkSize);
              }
            }
          }
          if (buffer.length > 0) {
            yield buffer;
          }
        } finally {
          reader.releaseLock();
        }
      } else if (typeof streamResponse.arrayBuffer === 'function') {
        const arrayBuf = await streamResponse.arrayBuffer();
        const bytes = new Uint8Array(arrayBuf);
        for (let i = 0; i < bytes.length; i += chunkSize) {
          yield bytes.subarray(i, i + chunkSize);
        }
      } else if (typeof streamResponse.text === 'function') {
        const text = await streamResponse.text();
        const bytes = new TextEncoder().encode(text);
        for (let i = 0; i < bytes.length; i += chunkSize) {
          yield bytes.subarray(i, i + chunkSize);
        }
      }
    },
    download: async (
      datasetId: string,
      options?: DownloadDatasetOptions,
    ): Promise<Uint8Array | unknown | string> => {
      const filePath = options?.filePath ?? options?.file_path;
      const returnData = options?.returnData ?? options?.return_data ?? false;

      if (filePath) {
        const resolvedPath = path.resolve(filePath);
        const dir = path.dirname(resolvedPath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }

        const fileStream = fs.createWriteStream(resolvedPath);
        for await (const chunk of api.streamDownload(datasetId, options)) {
          fileStream.write(chunk);
        }
        await new Promise<void>((resolve, reject) => {
          fileStream.end((err?: Error | null) => {
            if (err) reject(err);
            else resolve();
          });
        });

        if (returnData) {
          const content = fs.readFileSync(resolvedPath, 'utf-8');
          try {
            return JSON.parse(content);
          } catch {
            return content;
          }
        }
        return resolvedPath;
      }

      const chunks: Uint8Array[] = [];
      let totalLen = 0;
      for await (const chunk of api.streamDownload(datasetId, options)) {
        chunks.push(chunk);
        totalLen += chunk.length;
      }

      const result = new Uint8Array(totalLen);
      let offset = 0;
      for (const chunk of chunks) {
        result.set(chunk, offset);
        offset += chunk.length;
      }

      if (returnData) {
        const text = new TextDecoder().decode(result);
        try {
          return JSON.parse(text);
        } catch {
          return result;
        }
      }

      return result;
    },
    generatePlan: async (request: { prompt: string }): Promise<unknown> =>
      sendRequest(apiKey, config, {
        method: 'POST',
        serviceKey: 'datasets',
        endpointKey: 'datasetsGeneratePlan',
        body: { type: 'json', data: { prompt: request.prompt } },
      }),
    generate: async (request: {
      name: string;
      prompt: string;
      type: string;
      num_samples: number;
      domains?: string[];
      classes?: string[];
      entity_types?: string[];
      json_template?: string;
      ner_output_format?: string;
    }): Promise<unknown> =>
      sendRequest(apiKey, config, {
        method: 'POST',
        serviceKey: 'datasets',
        endpointKey: 'datasetsGenerate',
        body: { type: 'json', data: request },
      }),
    listFormats: async (request: ListFormatsRequest = {}): Promise<ListFormatsResults> =>
      sendRequest(apiKey, config, {
        method: 'GET',
        serviceKey: 'datasets',
        endpointKey: 'datasetsFormats',
        queryParams: validateListFormatsRequest(request),
        responseValidator: validateListFormatsResults,
      }),
    listData: async (request: ListDataRequest = {}): Promise<ListDataResults> =>
      sendRequest(apiKey, config, {
        method: 'GET',
        serviceKey: 'datasets',
        endpointKey: 'data',
        queryParams: validateListDataRequest(request),
        responseValidator: validateListDataResults,
      }),
    createData: async (request: CreateDataRequest): Promise<DataCreationResults> =>
      sendDatasetsRequest('data', validateCreateDataRequest(request), validateDataCreationResults),
    getData: async (dataId: string): Promise<Data> =>
      sendRequest(apiKey, config, {
        method: 'GET',
        serviceKey: 'datasets',
        endpointKey: 'dataById',
        pathParams: { id: dataId },
        responseValidator: validateData,
      }),
    updateData: async (dataId: string, request: UpdateDataRequest): Promise<void> =>
      sendRequest(apiKey, config, {
        method: 'PATCH',
        serviceKey: 'datasets',
        endpointKey: 'dataById',
        pathParams: { id: dataId },
        body: { type: 'json', data: validateUpdateDataRequest(request) },
      }),
    deleteData: async (dataId: string): Promise<void> =>
      sendRequest(apiKey, config, {
        method: 'DELETE',
        serviceKey: 'datasets',
        endpointKey: 'dataById',
        pathParams: { id: dataId },
      }),
    uploadData: async (dataId: string, request: UploadDataRequest): Promise<DataCreationResults> =>
      sendDatasetsRequest(
        'dataUpload',
        validateUploadDataRequest(request),
        validateDataCreationResults,
        { id: dataId },
      ),
  };

  return api;
};

const createFinetuningApi = (apiKey: string, config: Config) => ({
  createBaseModel: async (request: CreateBaseModelRequest): Promise<ObjectCreation> =>
    sendRequest(apiKey, config, {
      method: 'POST',
      serviceKey: 'finetuning',
      endpointKey: 'finetuningModels',
      body: { type: 'json', data: validateCreateBaseModelRequest(request) },
      responseValidator: validateObjectCreation,
    }),
  listModels: async (request: ListModelsRequest = {}): Promise<ListModelsResults> =>
    sendRequest(apiKey, config, {
      method: 'GET',
      serviceKey: 'finetuning',
      endpointKey: 'finetuningModels',
      queryParams: validateListModelsRequest(request),
      responseValidator: validateListModelsResults,
    }),
  getModel: async (modelId: string): Promise<TrainingModel> =>
    sendRequest(apiKey, config, {
      method: 'GET',
      serviceKey: 'finetuning',
      endpointKey: 'finetuningModelsById',
      pathParams: { id: modelId },
      responseValidator: validateTrainingModel,
    }),
  listModelTypes: async (): Promise<ListTagsResults> =>
    sendRequest(apiKey, config, {
      method: 'GET',
      serviceKey: 'finetuning',
      endpointKey: 'finetuningModelsTypes',
      responseValidator: validateListTagsResults,
    }),
  startTraining: async (request: StartTrainingRequest): Promise<TrainingObject> =>
    sendRequest(apiKey, config, {
      method: 'POST',
      serviceKey: 'finetuning',
      endpointKey: 'finetuningTrainings',
      body: { type: 'json', data: validateStartTrainingRequest(request) },
      responseValidator: validateTrainingObject,
    }),
  listTrainings: async (request: ListTrainingsRequest = {}): Promise<ListTrainingsResults> =>
    sendRequest(apiKey, config, {
      method: 'GET',
      serviceKey: 'finetuning',
      endpointKey: 'finetuningTrainings',
      queryParams: validateListTrainingsRequest(request),
      responseValidator: validateListTrainingsResults,
    }),
  getTraining: async (trainingId: string): Promise<TrainingObject> =>
    sendRequest(apiKey, config, {
      method: 'GET',
      serviceKey: 'finetuning',
      endpointKey: 'finetuningTrainingsById',
      pathParams: { id: trainingId },
      responseValidator: validateTrainingObject,
    }),
  deleteTraining: async (trainingId: string): Promise<void> =>
    sendRequest(apiKey, config, {
      method: 'DELETE',
      serviceKey: 'finetuning',
      endpointKey: 'finetuningTrainingsById',
      pathParams: { id: trainingId },
    }),
  stopTraining: async (trainingId: string): Promise<void> =>
    sendRequest(apiKey, config, {
      method: 'POST',
      serviceKey: 'finetuning',
      endpointKey: 'finetuningTrainingsStop',
      pathParams: { id: trainingId },
    }),
  listEvents: async (
    trainingId: string,
    request: ListEventsRequest = {},
  ): Promise<ListEventsResults> =>
    sendRequest(apiKey, config, {
      method: 'GET',
      serviceKey: 'finetuning',
      endpointKey: 'finetuningTrainingsEvents',
      pathParams: { id: trainingId },
      queryParams: validateListEventsRequest(request),
      responseValidator: validateListEventsResults,
    }),
  getMetrics: async (
    trainingId: string,
    request: GetMetricsRequest,
  ): Promise<ListMetricsResults> => {
    const { metric, offset, limit } = validateGetMetricsRequest(request);

    return sendRequest(apiKey, config, {
      method: 'GET',
      serviceKey: 'finetuning',
      endpointKey: 'finetuningTrainingsMetrics',
      pathParams: { id: trainingId, metric },
      queryParams: { offset, limit },
      responseValidator: validateListMetricsResults,
    });
  },
});

export interface Client {
  comprehend: ReturnType<typeof createComprehendApi>;
  extract: ReturnType<typeof createExtractApi>;
  instruct: ReturnType<typeof createInstructApi>;
  datasets: ReturnType<typeof createDatasetsApi>;
  finetuning: ReturnType<typeof createFinetuningApi>;
  /**
   * Create a client for an Open Model (standalone full model).
   *
   * Invokes POST /inference/{model_id}/ or POST /inference/{model_id}/{method}/.
   *
   * @param modelId - The Open Model ID (e.g. 'm-d9be7ede307943439a30c6f814026566')
   * @param method - Optional method name to use for predictions (e.g. 'relations')
   * @returns An initialized OpenModel instance.
   */
  model: (modelId: string, method?: string) => ReturnType<typeof createOpenModelApi>;
}

export interface CreateClient {
  (config?: Config): Client;
  (apiKey?: string, config?: Config): Client;
}

export const createClient: CreateClient = (
  apiKeyOrConfig?: string | Config,
  config?: Config,
): Client => {
  let resolvedApiKey = typeof apiKeyOrConfig === 'string' ? apiKeyOrConfig : '';
  const inputConfig = typeof apiKeyOrConfig === 'object' ? apiKeyOrConfig : config;

  if (!resolvedApiKey && typeof process !== 'undefined' && process.env) {
    resolvedApiKey =
      process.env.KG_API_KEY ||
      process.env.KG_MCP_API_KEY ||
      process.env.KNOWLEDGATOR_API_KEY ||
      '';
  }

  const finalConfig: Config = {
    ...DEFAULT_CONFIG,
    ...inputConfig,
    retryPolicy: {
      ...DEFAULT_CONFIG.retryPolicy,
      ...inputConfig?.retryPolicy,
    },
    logger: inputConfig?.logger || createDefaultLogger(inputConfig?.debug ?? DEFAULT_CONFIG.debug),
  };

  finalConfig.logger?.debug('SDK client initialized', { finalConfig });

  return {
    comprehend: createComprehendApi(resolvedApiKey, finalConfig),
    extract: createExtractApi(resolvedApiKey, finalConfig),
    instruct: createInstructApi(resolvedApiKey, finalConfig),
    datasets: createDatasetsApi(resolvedApiKey, finalConfig),
    finetuning: createFinetuningApi(resolvedApiKey, finalConfig),
    model: (modelId: string, method?: string) =>
      createOpenModelApi(sendRequest, resolvedApiKey, finalConfig, modelId, method),
  };
};
