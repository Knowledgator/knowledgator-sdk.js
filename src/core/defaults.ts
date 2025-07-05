import type { EndpointConfig, ServerConfig } from './types';

export const DEFAULT_ENDPOINTS: Required<EndpointConfig> = {
  comprehend: '/comprehend',
  extract: '/extract',
  extractRelations: '/extract/relations',
  extractSummary: '/extract/summary',
} as const;

export const DEFAULT_SERVERS: Required<ServerConfig> = {
  comprehend: 'https://api.comprehend-it.knowledgator.com',
  extract: 'https://api.extract-it.knowledgator.com',
} as const;

export const getDefaultHeaders = (apiKey?: string): Record<string, string> => ({
  'Content-Type': 'application/json',
  'KnowledgatorAPI-Key': apiKey ?? '',
});

export const RAPID_API_SERVERS: Required<ServerConfig> = {
  comprehend: 'https://comprehend-it.p.rapidapi.com',
  extract: 'https://extract-it.p.rapidapi.com',
} as const;

export const getRapidApiHeaders = (host?: string, apiKey?: string): Record<string, string> => ({
  'Content-Type': 'application/json',
  'x-rapidapi-host': host ?? '',
  'x-rapidapi-key': apiKey ?? '',
});
