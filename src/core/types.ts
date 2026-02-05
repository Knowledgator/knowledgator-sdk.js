import type { HttpConfig } from '../client/http/types';
import type { Logger } from '../client/logger/types';

export interface ServerConfig {
  readonly comprehend?: string;
  readonly extract?: string;
  readonly instruct?: string;
  readonly datasets?: string;
  readonly finetuning?: string;
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
  readonly datasetsFormats?: string;
  readonly finetuningModels?: string;
  readonly finetuningModelsById?: string;
  readonly finetuningModelsTypes?: string;
  readonly finetuningTrainings?: string;
  readonly finetuningTrainingsById?: string;
  readonly finetuningTrainingsStop?: string;
  readonly finetuningTrainingsEvents?: string;
  readonly finetuningTrainingsMetrics?: string;
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
  readonly disableRapidApi?: boolean;
  readonly logger?: Logger;
} & HttpConfig;
