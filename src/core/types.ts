import type { HttpConfig } from '../client/http/types';

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
  readonly apiKey?: string;
  readonly validateResponses?: boolean;
}) &
  HttpConfig;
