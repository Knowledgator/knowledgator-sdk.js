import type { Config } from '../client/http/types';

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

export interface KnowledgatorConfig extends Config {
  readonly apiKey?: string;
  readonly endpoints?: EndpointConfig;
  readonly validateResponses?: boolean;
}
