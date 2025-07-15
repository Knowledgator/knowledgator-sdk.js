import type { HttpConfig } from '../client/http/types';
import type { Logger } from '../client/logger/types';

export interface ServerConfig {
  readonly comprehend?: string;
  readonly extract?: string;
}

export interface EndpointConfig {
  readonly comprehend?: string;
  readonly extract?: string;
  readonly extractRelations?: string;
  readonly extractSummary?: string;
}

export type Config = ((
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
}) &
  HttpConfig;
