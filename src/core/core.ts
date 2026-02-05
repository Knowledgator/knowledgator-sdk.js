import {
  ApiKeyRequiredError,
  CustomProviderMissingConfigError,
  JsonParseError,
} from '../client/errors';
import { createHttpClient } from '../client/http';
import { createDefaultLogger } from '../client/logger/logger';
import { getError } from '../client/utils';
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
  validateExtractBaseRequest,
  validateExtractRelationsRequest,
  validateExtractSummaryRequest,
  type ComprehendRequest,
  type ExtractBaseRequest,
  type ExtractRelationsRequest,
  type ExtractSummaryRequest,
  type InstructItRequest,
  validateInstructItRequest,
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
  type InstructItResults,
  validateInstructItResults,
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

// Helper to build URL with path parameters
const buildUrl = (template: string, params: Record<string, string>): string => {
  return Object.entries(params).reduce(
    (url, [key, value]) => url.replace(`:${key}`, value),
    template,
  );
};

const resolveRequestConfig = (
  apiKey: string,
  config: Config,
  serviceKey: keyof ServerConfig,
  endpointKey: keyof EndpointConfig,
  pathParams?: Record<string, string>,
) => {
  let baseUrl: string | undefined;
  let endpoint: string | undefined;
  let baseHeaders: Record<string, string> | undefined;

  // Determine if we should use RapidAPI
  const useRapidApi = config.provider === 'rapidapi' && !config.disableRapidApi;

  if (useRapidApi) {
    if (!apiKey) {
      throw new ApiKeyRequiredError();
    }
    baseUrl = RAPID_API_SERVERS[serviceKey];
    if (!baseUrl) {
      throw new Error(`RapidAPI not supported for service: ${serviceKey}`);
    }
    endpoint = DEFAULT_ENDPOINTS[endpointKey];
    baseHeaders = getRapidApiHeaders(baseUrl.replace('https://', ''), apiKey);
  } else if (config.provider === 'custom') {
    if (!config.servers || !config.endpoints) {
      throw new CustomProviderMissingConfigError();
    }
    baseUrl = config.servers[serviceKey];
    endpoint = config.endpoints[endpointKey];
    baseHeaders = config.baseHeaders;
  } else {
    // Default / Knowledgator (or fallback for disabled RapidAPI)
    if (!apiKey) {
      throw new ApiKeyRequiredError();
    }
    baseUrl = DEFAULT_SERVERS[serviceKey];
    endpoint = DEFAULT_ENDPOINTS[endpointKey];
    baseHeaders = getDefaultHeaders(apiKey);
  }

  // Replace path parameters
  if (pathParams && endpoint) {
    endpoint = buildUrl(endpoint, pathParams);
  }

  return { baseUrl, endpoint, baseHeaders };
};

const jsonRequest = async <TInput, TOutput>(
  apiKey: string,
  config: Config,
  serviceKey: keyof ServerConfig,
  endpointKey: keyof EndpointConfig,
  data: TInput,
  validator: (data: unknown) => TOutput,
  pathParams?: Record<string, string>,
): Promise<TOutput> => {
  const { baseUrl, endpoint, baseHeaders } = resolveRequestConfig(
    apiKey,
    config,
    serviceKey,
    endpointKey,
    pathParams,
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

const sendMultipartRequest = async <TOutput>(
  apiKey: string,
  config: Config,
  serviceKey: keyof ServerConfig,
  endpointKey: keyof EndpointConfig,
  formData: FormData,
  validator: (data: unknown) => TOutput,
  pathParams?: Record<string, string>,
): Promise<TOutput> => {
  const { baseUrl, endpoint, baseHeaders } = resolveRequestConfig(
    apiKey,
    config,
    serviceKey,
    endpointKey,
    pathParams,
  );

  // Remove Content-Type header to allow browser to set multipart/form-data with boundary
  const headers = { ...baseHeaders };
  delete headers['Content-Type'];
  delete headers['content-type'];

  const httpClient = createHttpClient({
    baseUrl,
    baseHeaders: headers,
    timeout: config.timeout,
    retryPolicy: config.retryPolicy,
    requestInterceptor: config.requestInterceptor,
    responseInterceptor: config.responseInterceptor,
    logger: config.logger,
  });

  const response = await httpClient.post(endpoint, {
    body: formData,
  });

  try {
    const output = await response.json();
    return config.validateResponses ? validator(output) : (output as TOutput);
  } catch (err) {
    throw new JsonParseError(getError(err));
  }
};

const sendGetRequest = async <TOutput>(
  apiKey: string,
  config: Config,
  serviceKey: keyof ServerConfig,
  endpointKey: keyof EndpointConfig,
  queryParams: Record<string, unknown>,
  validator: (data: unknown) => TOutput,
  pathParams?: Record<string, string>,
): Promise<TOutput> => {
  const { baseUrl, endpoint, baseHeaders } = resolveRequestConfig(
    apiKey,
    config,
    serviceKey,
    endpointKey,
    pathParams,
  );

  // Build query string
  const queryString = Object.entries(queryParams)
    .filter(([, value]) => value !== undefined && value !== null)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join('&');

  const fullEndpoint = queryString ? `${endpoint}?${queryString}` : endpoint;

  const httpClient = createHttpClient({
    baseUrl,
    baseHeaders,
    timeout: config.timeout,
    retryPolicy: config.retryPolicy,
    requestInterceptor: config.requestInterceptor,
    responseInterceptor: config.responseInterceptor,
    logger: config.logger,
  });

  const response = await httpClient.get(fullEndpoint);

  try {
    const output = await response.json();
    return config.validateResponses ? validator(output) : (output as TOutput);
  } catch (err) {
    throw new JsonParseError(getError(err));
  }
};

const sendDeleteRequest = async (
  apiKey: string,
  config: Config,
  serviceKey: keyof ServerConfig,
  endpointKey: keyof EndpointConfig,
  pathParams: Record<string, string>,
): Promise<void> => {
  const { baseUrl, endpoint, baseHeaders } = resolveRequestConfig(
    apiKey,
    config,
    serviceKey,
    endpointKey,
    pathParams,
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

  await httpClient.delete(endpoint);
};

const sendPatchRequest = async <TInput>(
  apiKey: string,
  config: Config,
  serviceKey: keyof ServerConfig,
  endpointKey: keyof EndpointConfig,
  data: TInput,
  pathParams: Record<string, string>,
): Promise<void> => {
  const { baseUrl, endpoint, baseHeaders } = resolveRequestConfig(
    apiKey,
    config,
    serviceKey,
    endpointKey,
    pathParams,
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

  await httpClient.patch(endpoint, {
    body: JSON.stringify(data),
  });
};

const sendSignalRequest = async (
  apiKey: string,
  config: Config,
  serviceKey: keyof ServerConfig,
  endpointKey: keyof EndpointConfig,
  method: 'POST' | 'GET' = 'POST',
  pathParams?: Record<string, string>,
): Promise<void> => {
  const { baseUrl, endpoint, baseHeaders } = resolveRequestConfig(
    apiKey,
    config,
    serviceKey,
    endpointKey,
    pathParams,
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

  if (method === 'POST') {
    await httpClient.post(endpoint);
  } else {
    await httpClient.get(endpoint);
  }
};

const instructMultipartRequest = async <TOutput>(
  apiKey: string,
  config: Config,
  serviceKey: keyof ServerConfig,
  endpointKey: keyof EndpointConfig,
  data: InstructItRequest,
  validator: (data: unknown) => TOutput,
): Promise<TOutput> => {
  // Create FormData for multipart/form-data request
  const formData = new FormData();

  // Add text field (required)
  formData.append('text', data.text);

  // Add optional fields
  if (data.template) {
    formData.append('template', data.template);
  }

  if (data.output_type) {
    formData.append('output_type', data.output_type);
  }

  // Add filesmetadata as JSON array of file names
  if (data.files && data.files.length > 0) {
    const filesmetadata = data.files.map((file) => file.name);
    formData.append('filesmetadata', JSON.stringify(filesmetadata));

    // Add file content for files that have content
    for (const file of data.files) {
      if (file.content) {
        // Create a Blob from the Uint8Array content
        const blob = new Blob([file.content]);
        formData.append('files', blob, file.name);
      }
    }
  }

  return sendMultipartRequest(apiKey, config, serviceKey, endpointKey, formData, validator);
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
  it: async (request: ExtractBaseRequest): Promise<ExtractBaseResults> =>
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

const createInstructApi = (apiKey: string, config: Config) => ({
  it: async (request: InstructItRequest): Promise<InstructItResults> =>
    instructMultipartRequest(
      apiKey,
      config,
      'instruct',
      'instruct',
      validateInstructItRequest(request),
      validateInstructItResults,
    ),
});

const createDatasetsApi = (apiKey: string, config: Config) => {
  // Datasets always skips RapidAPI
  const configWithSkip = { ...config, disableRapidApi: true };

  // Helper for multipart dataset requests (create, upload)
  const datasetMultipartRequest = async <TOutput>(
    endpointKey: keyof EndpointConfig,
    data: CreateDatasetRequest | UploadDatasetRequest,
    validator: (data: unknown) => TOutput,
    pathParams?: Record<string, string>,
  ): Promise<TOutput> => {
    const formData = new FormData();

    if ('name' in data) {
      // CreateDatasetRequest
      formData.append('name', data.name);
      formData.append('type', data.type);
      formData.append('format', data.format);
      if (data.description) {
        formData.append('description', data.description);
      }
      if (data.file) {
        formData.append('file', data.file);
      }
    } else {
      // UploadDatasetRequest
      formData.append('file', data.file);
    }

    return sendMultipartRequest(
      apiKey,
      configWithSkip,
      'datasets',
      endpointKey,
      formData,
      validator,
      pathParams,
    );
  };

  return {
    list: async (request: ListDatasetsRequest = {}): Promise<ListDatasetsResults> =>
      sendGetRequest(
        apiKey,
        configWithSkip,
        'datasets',
        'datasets',
        validateListDatasetsRequest(request),
        validateListDatasetsResults,
      ),

    create: async (request: CreateDatasetRequest): Promise<DatasetCreationResults> =>
      datasetMultipartRequest(
        'datasets',
        validateCreateDatasetRequest(request),
        validateDatasetCreationResults,
      ),

    get: async (datasetId: string): Promise<Dataset> =>
      sendGetRequest(apiKey, configWithSkip, 'datasets', 'datasetsById', {}, validateDataset, {
        id: datasetId,
      }),

    update: async (datasetId: string, request: UpdateDatasetRequest): Promise<void> =>
      sendPatchRequest(
        apiKey,
        configWithSkip,
        'datasets',
        'datasetsById',
        validateUpdateDatasetRequest(request),
        { id: datasetId },
      ),

    delete: async (datasetId: string): Promise<void> =>
      sendDeleteRequest(apiKey, configWithSkip, 'datasets', 'datasetsById', { id: datasetId }),

    upload: async (
      datasetId: string,
      request: UploadDatasetRequest,
    ): Promise<DatasetCreationResults> =>
      datasetMultipartRequest(
        'datasetsUpload',
        validateUploadDatasetRequest(request),
        validateDatasetCreationResults,
        { id: datasetId },
      ),

    listFormats: async (request: ListFormatsRequest = {}): Promise<ListFormatsResults> =>
      sendGetRequest(
        apiKey,
        configWithSkip,
        'datasets',
        'datasetsFormats',
        validateListFormatsRequest(request),
        validateListFormatsResults,
      ),
  };
};

const createFinetuningApi = (apiKey: string, config: Config) => {
  // Fine-tuning always skips RapidAPI
  const configWithSkip = { ...config, disableRapidApi: true };

  return {
    // Model Management
    createBaseModel: async (request: CreateBaseModelRequest): Promise<ObjectCreation> =>
      jsonRequest(
        apiKey,
        configWithSkip,
        'finetuning',
        'finetuningModels',
        validateCreateBaseModelRequest(request),
        validateObjectCreation,
      ),

    listModels: async (request: ListModelsRequest = {}): Promise<ListModelsResults> =>
      sendGetRequest(
        apiKey,
        configWithSkip,
        'finetuning',
        'finetuningModels',
        validateListModelsRequest(request),
        validateListModelsResults,
      ),

    getModel: async (modelId: string): Promise<TrainingModel> =>
      sendGetRequest(
        apiKey,
        configWithSkip,
        'finetuning',
        'finetuningModelsById',
        {},
        validateTrainingModel,
        { id: modelId },
      ),

    listModelTypes: async (): Promise<ListTagsResults> =>
      sendGetRequest(
        apiKey,
        configWithSkip,
        'finetuning',
        'finetuningModelsTypes',
        {},
        validateListTagsResults,
      ),

    // Training Management
    startTraining: async (request: StartTrainingRequest): Promise<TrainingObject> =>
      jsonRequest(
        apiKey,
        configWithSkip,
        'finetuning',
        'finetuningTrainings',
        validateStartTrainingRequest(request),
        validateTrainingObject,
      ),

    listTrainings: async (request: ListTrainingsRequest = {}): Promise<ListTrainingsResults> =>
      sendGetRequest(
        apiKey,
        configWithSkip,
        'finetuning',
        'finetuningTrainings',
        validateListTrainingsRequest(request),
        validateListTrainingsResults,
      ),

    getTraining: async (trainingId: string): Promise<TrainingObject> =>
      sendGetRequest(
        apiKey,
        configWithSkip,
        'finetuning',
        'finetuningTrainingsById',
        {},
        validateTrainingObject,
        { id: trainingId },
      ),

    deleteTraining: async (trainingId: string): Promise<void> =>
      sendDeleteRequest(apiKey, configWithSkip, 'finetuning', 'finetuningTrainingsById', {
        id: trainingId,
      }),

    stopTraining: async (trainingId: string): Promise<void> =>
      sendSignalRequest(apiKey, configWithSkip, 'finetuning', 'finetuningTrainingsStop', 'POST', {
        id: trainingId,
      }),

    // Training Monitoring
    listEvents: async (
      trainingId: string,
      request: ListEventsRequest = {},
    ): Promise<ListEventsResults> =>
      sendGetRequest(
        apiKey,
        configWithSkip,
        'finetuning',
        'finetuningTrainingsEvents',
        validateListEventsRequest(request),
        validateListEventsResults,
        { id: trainingId },
      ),

    getMetrics: async (
      trainingId: string,
      request: GetMetricsRequest,
    ): Promise<ListMetricsResults> => {
      const { metric, offset, limit } = validateGetMetricsRequest(request);
      return sendGetRequest(
        apiKey,
        configWithSkip,
        'finetuning',
        'finetuningTrainingsMetrics',
        { offset, limit },
        validateListMetricsResults,
        { id: trainingId, metric },
      );
    },
  };
};

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
    instruct: createInstructApi(apiKey, finalConfig),
    datasets: createDatasetsApi(apiKey, finalConfig),
    finetuning: createFinetuningApi(apiKey, finalConfig),
  };
};
