import type { ServerConfig, Config } from '../core/types';
import type { RequestSender } from '../core/core';

export interface OpenModel {
    predict: (body: Record<string, unknown>) => Promise<unknown>;
    call: (method: string, body: Record<string, unknown>) => Promise<unknown>;
}

export const createOpenModelApi = (
    sendRequest: RequestSender,
    apiKey: string,
    config: Config,
    modelId: string,
    defaultMethod?: string
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
            responseValidator: (data: unknown) => data,
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
                responseValidator: (data: unknown) => data,
            });
        },

        call,
    };
};
