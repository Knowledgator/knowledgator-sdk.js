import {
  ApiKeyRequiredError,
  CustomProviderMissingConfigError,
  CustomProviderMissingEndpointError,
  CustomProviderMissingServerError,
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
import type {
  EndpointConfig,
  Config,
  ServerConfig,
  RequestConfig,
  SendRequestOptions,
} from './types';
import { omitHeaders, replacePathParams } from './utils';

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

  const endpoint = config.endpoints[endpointKey];

  if (!endpoint) {
    throw new CustomProviderMissingEndpointError(endpointKey);
  }

  return {
    baseUrl,
    endpoint: replacePathParams(endpoint, pathParams),
    baseHeaders: config.baseHeaders,
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
    return resolveCustomConfig(config, serviceKey, endpointKey, pathParams);
  }

  return resolveDefaultConfig(apiKey, serviceKey, endpointKey, pathParams);
};

const sendRequest = async <TOutput = void>(
  apiKey: string,
  config: Config,
  options: SendRequestOptions<TOutput>,
): Promise<TOutput> => {
  const { method, serviceKey, endpointKey, pathParams, queryParams, body, responseValidator } =
    options;

  const { baseUrl, endpoint, baseHeaders } = resolveRequestConfig(
    apiKey,
    config,
    serviceKey,
    endpointKey,
    pathParams,
  );

  const headers =
    (body?.type === 'formData' ? omitHeaders(baseHeaders, ['Content-Type']) : baseHeaders) || {};

  if (options.headers) {
    Object.assign(headers, options.headers);
  }

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
    return undefined as TOutput;
  }

  try {
    const output = await response.json();

    return config.validateResponses
      ? responseValidator
        ? responseValidator(output)
        : (output as TOutput)
      : (output as TOutput);
  } catch (err) {
    throw new JsonParseError(getError(err));
  }
};

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
  if (data.template) {
    formData.append('template', data.template);
  }
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
    headers: data.model_id ? { 'Model-Id': data.model_id } : undefined,
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
      headers: request.model_id ? { 'Model-Id': request.model_id } : undefined,
      responseValidator: validateComprehendResults,
    }),
});

const createExtractApi = (apiKey: string, config: Config) => ({
  it: async (request: ExtractBaseRequest): Promise<ExtractBaseResults> =>
    sendRequest(apiKey, config, {
      method: 'POST',
      serviceKey: 'extract',
      endpointKey: 'extract',
      body: { type: 'json', data: validateExtractBaseRequest(request) },
      headers: request.model_id ? { 'Model-Id': request.model_id } : undefined,
      responseValidator: validateExtractBaseResults,
    }),
  relations: async (request: ExtractRelationsRequest): Promise<ExtractRelationsResults> =>
    sendRequest(apiKey, config, {
      method: 'POST',
      serviceKey: 'extract',
      endpointKey: 'extractRelations',
      body: { type: 'json', data: validateExtractRelationsRequest(request) },
      headers: request.model_id ? { 'Model-Id': request.model_id } : undefined,
      responseValidator: validateExtractRelationsResults,
    }),
  summary: async (request: ExtractSummaryRequest): Promise<ExtractSummaryResults> =>
    sendRequest(apiKey, config, {
      method: 'POST',
      serviceKey: 'extract',
      endpointKey: 'extractSummary',
      body: { type: 'json', data: validateExtractSummaryRequest(request) },
      headers: request.model_id ? { 'Model-Id': request.model_id } : undefined,
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
    data: CreateDatasetRequest | UploadDatasetRequest,
    validator: (data: unknown) => TOutput,
    pathParams?: Record<string, string>,
  ): Promise<TOutput> => {
    const formData = new FormData();

    if ('name' in data) {
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
      formData.append('file', data.file);
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

  return {
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
    listFormats: async (request: ListFormatsRequest = {}): Promise<ListFormatsResults> =>
      sendRequest(apiKey, config, {
        method: 'GET',
        serviceKey: 'datasets',
        endpointKey: 'datasetsFormats',
        queryParams: validateListFormatsRequest(request),
        responseValidator: validateListFormatsResults,
      }),
  };
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
