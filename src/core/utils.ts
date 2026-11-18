export const replacePathParams = (
  endpoint: string,
  pathParams?: Record<string, string>,
): string => {
  if (!pathParams) {
    return endpoint;
  }

  return Object.entries(pathParams).reduce(
    (url, [key, value]) => url.replace(`:${key}`, encodeURIComponent(value)),
    endpoint,
  );
};

export const omitHeaders = (
  headers: Record<string, string> | undefined,
  values: readonly string[],
): Record<string, string> | undefined => {
  if (!headers) {
    return;
  }

  const lowerCaseValuesToOmit = new Set(values.map((k) => k.toLowerCase()));

  return Object.fromEntries(
    Object.entries(headers).filter(([key]) => !lowerCaseValuesToOmit.has(key.toLowerCase())),
  );
};

export const getModelIdHeader = (modelId?: string): Record<string, string> | undefined => {
  return modelId
    ? {
        'KnowledgatorAPI-Model-ID': modelId,
      }
    : undefined;
};
