import { createOpenModelApi } from '../index';

describe('OpenModel', () => {
  const mockSendRequest = jest.fn();
  const apiKey = 'test-api-key';
  const config = {};
  const modelId = 'test-model-id';

  beforeEach(() => {
    mockSendRequest.mockClear();
  });

  it('should throw error if modelId is empty', () => {
    expect(() => createOpenModelApi(mockSendRequest, apiKey, config, '')).toThrow(
      'Open Model ID is required',
    );
  });

  it('should call predict with root endpoint if no default method provided', async () => {
    const api = createOpenModelApi(mockSendRequest, apiKey, config, modelId);
    const body = { input: 'test input' };
    mockSendRequest.mockResolvedValue({ result: 'success' });

    const result = await api.predict(body);

    expect(mockSendRequest).toHaveBeenCalledWith(
      apiKey,
      config,
      expect.objectContaining({
        method: 'POST',
        serviceKey: 'inference',
        endpointKey: 'modelInference',
        pathParams: { modelId },
        body: { type: 'json', data: body },
      }),
    );
    expect(result).toEqual({ result: 'success' });
  });

  it('should call predict with method-based endpoint if default method provided', async () => {
    const defaultMethod = 'generate';
    const api = createOpenModelApi(mockSendRequest, apiKey, config, modelId, defaultMethod);
    const body = { prompt: 'hello' };
    mockSendRequest.mockResolvedValue({ generated: 'world' });

    const result = await api.predict(body);

    expect(mockSendRequest).toHaveBeenCalledWith(
      apiKey,
      config,
      expect.objectContaining({
        method: 'POST',
        serviceKey: 'inference',
        endpointKey: 'modelInferenceMethod',
        pathParams: { modelId, method: defaultMethod },
        body: { type: 'json', data: body },
      }),
    );
    expect(result).toEqual({ generated: 'world' });
  });

  it('should call call() with correct parameters', async () => {
    const api = createOpenModelApi(mockSendRequest, apiKey, config, modelId);
    const body = { prompt: 'hello' };
    const method = 'generate';
    mockSendRequest.mockResolvedValue({ generated: 'world' });

    const result = await api.call(method, body);

    expect(mockSendRequest).toHaveBeenCalledWith(
      apiKey,
      config,
      expect.objectContaining({
        method: 'POST',
        serviceKey: 'inference',
        endpointKey: 'modelInferenceMethod',
        pathParams: { modelId, method },
        body: { type: 'json', data: body },
      }),
    );
    expect(result).toEqual({ generated: 'world' });
  });
});
