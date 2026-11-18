import type { HttpConfig } from '../client/http/types';
import type { Logger } from '../client/logger/types';

export interface RequestConfig {
  baseUrl: string;
  endpoint: string;
  baseHeaders: Record<string, string> | undefined;
}

interface SendRequestOptions<TOutput> {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';
  serviceKey: keyof ServerConfig;
  endpointKey: keyof EndpointConfig;
  pathParams?: Record<string, string>;
  queryParams?: Record<string, unknown>;
  body?: { type: 'json'; data: unknown } | { type: 'formData'; data: FormData };
  headers?: Record<string, string>;
  responseValidator?: (data: unknown) => TOutput;
}

export type SendRequest = <TOutput = void>(
  apiKey: string,
  config: Config,
  options: SendRequestOptions<TOutput>,
) => Promise<TOutput>;

export interface ServerConfig {
  readonly comprehend?: string;
  readonly extract?: string;
  readonly instruct?: string;
  readonly datasets?: string;
  readonly finetuning?: string;
  readonly inference?: string;
}

export interface EndpointConfig {
  readonly comprehend?: string;
  readonly extract?: string;
  readonly extractRelations?: string;
  readonly extractSummary?: string;
  readonly instruct?: string;
  readonly datasets?: string;
  readonly datasetsById?: string;
  readonly datasetsUpload?: string;
  readonly datasetsDownload?: string;
  readonly datasetsGeneratePlan?: string;
  readonly datasetsGenerate?: string;
  readonly datasetsFormats?: string;
  readonly data?: string;
  readonly dataById?: string;
  readonly dataUpload?: string;
  readonly models?: string;
  readonly modelsById?: string;
  readonly finetuningTrainings?: string;
  readonly finetuningTrainingsById?: string;
  readonly finetuningTrainingsEvaluations?: string;
  readonly finetuningTrainingsStop?: string;
  readonly finetuningTrainingsEvents?: string;
  readonly finetuningTrainingsMetrics?: string;
  readonly modelInference?: string;
  readonly modelInferenceMethod?: string;
}

export type Config = (
  | {
      readonly provider?: 'knowledgator' | 'rapidapi';
    }
  | {
      readonly provider: 'custom';
      readonly servers: ServerConfig;
      readonly endpoints: EndpointConfig;
    }
) & {
  readonly validateResponses?: boolean;
  readonly debug?: boolean;
  readonly logger?: Logger;
} & HttpConfig;
