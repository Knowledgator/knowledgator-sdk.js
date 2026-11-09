import type { SendRequest, ServerConfig, Config } from '../core/types';

export interface OpenModel {
  /**
   * Default prediction method invoking POST /inference/{model_id}/
   * (or POST /inference/{model_id}/{defaultMethod}/ if initialized with a default method).
   */
  predict: (body: Record<string, unknown>) => Promise<unknown>;
  /**
   * Explicit sub-method invocation invoking POST /inference/{model_id}/{method}/.
   */
  call: (method: string, body: Record<string, unknown>) => Promise<unknown>;
}

/**
 * Create a client for an Open Model (standalone full model).
 *
 * Invokes POST /inference/{model_id}/ or POST /inference/{model_id}/{method}/.
 *
 * @param sendRequest - HTTP transport handler.
 * @param apiKey - Knowledgator API key.
 * @param config - SDK client configuration.
 * @param modelId - The Open Model ID (e.g. 'm-d9be7ede307943439a30c6f814026566').
 * @param defaultMethod - Optional method name to use for predictions (e.g. 'relations').
 * @returns An initialized OpenModel instance.
 */
export const createOpenModelApi = (
  sendRequest: SendRequest,
  apiKey: string,
  config: Config,
  modelId: string,
  defaultMethod?: string,
): OpenModel => {
  if (!modelId) {
    throw new Error('Open Model ID is required');
  }

  const serviceKey: keyof ServerConfig = 'inference';

  const call = async (method: string, body: Record<string, unknown>): Promise<unknown> =>
    sendRequest(apiKey, config, {
      method: 'POST',
      serviceKey,
      endpointKey: 'modelInferenceMethod',
      pathParams: { modelId, method },
      body: { type: 'json', data: body },
    });

  return {
    predict: async (body: Record<string, unknown>): Promise<unknown> => {
      if (defaultMethod) {
        return call(defaultMethod, body);
      }
      return sendRequest(apiKey, config, {
        method: 'POST',
        serviceKey,
        endpointKey: 'modelInference',
        pathParams: { modelId },
        body: { type: 'json', data: body },
      });
    },
    call,
  };
};
