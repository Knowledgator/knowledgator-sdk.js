# Knowledgator TypeScript SDK

[![version badge](https://img.shields.io/npm/v/@knowledgator/typescript-sdk)](https://www.npmjs.com/package/@knowledgator/typescript-sdk)
![license badge](https://img.shields.io/github/license/Knowledgator/knowledgator-sdk.js)

The Knowledgator TypeScript SDK provides access to the Knowledgator APIs for zero-shot classification and information extraction tasks. Designed for Node.js applications and compatible with modern browsers, it uses async/await for all operations and supports both standard API access and RapidAPI integration.

### Key Advantages

- **Efficiency**: Based on non-generative technologies, our solutions are _100×_ faster and more cost-efficient.
- **Precision**: Designed and tailored to information extraction needs, our models demonstrate better precision than LLMs.
- **Interpretability**: Every processing result comes in structured form with a confidence score, offering a reliable indicator of precision to guide your trust in automation.
- **Customisability**: Our models can be fine-tuned with a few examples to achieve results on par with supervised models.
- **Modularity**: Naturally providing structured outputs, our APIs can be chained to solve complex end-to-end information extraction tasks.

### Available Models

- `Comprehend-it`: An efficient and accurate zero-shot and few-shot classifier ideal for text.
- `Extract-it`: Fast, interpretable, and accurate information extraction tool that efficiently handles different extraction tasks, like NER and relation extraction.
- `Link-it` (coming soon): Zero-shot entity-linking tool that supports entity extraction, disambiguation, and linking to custom databases.
- `Instruct-it` (coming soon): Extraction of structured information from raw text based on provided schema.

## Documentation

Knowledgator API reference and guides are available [here](https://docs.knowledgator.com/). For detailed endpoint specifications, refer to the API documentation.

## Quick Installation

> **Node.js Version Policy**: Supports Node.js 18+. Versions reaching end-of-life get a 3-month grace period before updates.

Install via npm:

```bash
npm install @knowledgator/typescript-sdk
```

Or with yarn:

```bash
yarn add @knowledgator/typescript-sdk
```

Or with pnpm:

```bash
pnpm add @knowledgator/typescript-sdk
```

You can also install from source by cloning the repo:

```bash
git clone git@github.com:Knowledgator/knowledgator-sdk.js.git
cd knowledgator-sdk.js
npm install
npm run build
```

## Quick Start

### API Key Setup

Before using the SDK, obtain a Knowledgator API key from [api.knowledgator.com](https://api.knowledgator.com/account/api-keys).

Pass the API key directly when initializing the client.

### SDK Example Usage

```typescript
import { createClient } from '@knowledgator/typescript-sdk';

const client = createClient('your-api-key-here');

const response = await client.comprehend.it({
  text: 'Earth is beautiful',
  labels: ['positive', 'negative', 'neutral'],
});

console.log(response);
```

### Basic Classification (Comprehend)

Use the `comprehend.it` method for zero-shot text classification.

```typescript
import { createClient } from '@knowledgator/typescript-sdk';

const client = createClient('your-api-key-here');

const result = await client.comprehend.it({
  text: 'Earth is beautiful',
  labels: ['geography', 'sport'],
  threshold: 0.5,
  examples: [{ text: 'Example text', label: 'geography' }],
});

console.log(result); // Outputs ComprehendResults with classifications
```

## Table of Contents

- [Information Extraction (Extract)](#information-extraction-extract)
- [Relation Extraction](#relation-extraction)
- [Summarization](#summarization)
- [Configuration Options](#configuration-options)
- [RapidAPI Integration](#rapidapi-integration)
- [Available Resources and Operations](#available-resources-and-operations)
- [Retries](#retries)
- [Error Handling](#error-handling)
- [Custom HTTP Configuration](#custom-http-configuration)
- [Authentication](#authentication)
- [Logging and Debugging](#logging-and-debugging)
- [TypeScript Support](#typescript-support)
- [Development](#development)

## Information Extraction (Extract)

Use the `extract.it` method for zero-shot named entity recognition (NER).

```typescript
import { createClient } from '@knowledgator/typescript-sdk';

const client = createClient('your-api-key-here');

const result = await client.extract.it({
  text: 'Extract entities from this text.',
  labels: ['person', 'location'],
  threshold: 0.5,
  prompt: 'Custom prompt for extraction',
});

console.log(result); // Outputs ExtractBaseResults with entities
```

## Relation Extraction

Use `extract.relations` for extracting relations between entities.

```typescript
import { createClient } from '@knowledgator/typescript-sdk';

const client = createClient('your-api-key-here');

const result = await client.extract.relations({
  text: 'Text with entities and relations.',
  entities: ['person', 'organization'],
  relations: ['works_for', 'located_in'],
  threshold: 0.5,
  prompt: 'Custom relation prompt',
  rules: [{ rule: 'example rule' }],
});

console.log(result); // Outputs ExtractRelationsResults
```

## Summarization

Use `extract.summary` for text summarization.

```typescript
import { createClient } from '@knowledgator/typescript-sdk';

const client = createClient('your-api-key-here');

const result = await client.extract.summary({
  text: 'Long text to summarize.',
  threshold: 0.5,
  prompt: 'Custom summarization prompt',
});

console.log(result); // Outputs ExtractSummaryResults
```

## Configuration Options

The SDK supports various configuration options for customization:

```typescript
import { createClient } from '@knowledgator/typescript-sdk';

const client = createClient('your-api-key-here', {
  // API provider: 'knowledgator', 'rapidapi', or 'custom'
  provider: 'knowledgator',

  // Request timeout in milliseconds
  timeout: 30000,

  // Enable debug logging
  debug: true,

  // Validate API responses (recommended for production)
  validateResponses: true,

  // Retry policy configuration
  retryPolicy: {
    maxTries: 3,
    baseDelay: 0.25,
    maxDelay: 10,
    retryableStatuses: [408, 409, 429],
    jitter: true,
    jitterMin: 0.5,
    jitterMax: 1.5,
  },

  // Custom request/response interceptors
  requestInterceptor: (init: RequestInit) => {
    console.log('Request:', init);
    return init;
  },
  responseInterceptor: (response: Response) => {
    console.log('Response:', response.status, response.statusText);
    return response;
  },
});
```

## RapidAPI Integration

For RapidAPI-hosted endpoints:

```typescript
import { createClient } from '@knowledgator/typescript-sdk';

const client = createClient('your-rapidapi-key-here', {
  provider: 'rapidapi',
});

// Usage is the same as above
const result = await client.comprehend.it({
  text: 'Text to classify',
  labels: ['positive', 'negative'],
});
```

## Available Resources and Operations

### Comprehend API

- `it(request)`: Zero-shot classification with confidence scores and structured output

### Extract API

- `it(request)`: Zero-shot named entity recognition (NER)
- `relations(request)`: Relation extraction between entities
- `summary(request)`: Text summarization with customizable prompts

### Configuration Types

All configuration options are fully typed with TypeScript for better development experience:

```typescript
import type {
  Config,
  ServerConfig,
  EndpointConfig,
  ComprehendRequest,
  ComprehendResults,
  ExtractBaseRequest,
  ExtractBaseResults,
  ExtractRelationsRequest,
  ExtractRelationsResults,
  ExtractSummaryResults,
} from '@knowledgator/typescript-sdk';
```

## Retries

Operations support retries via configuration. Default: 3 attempts with exponential backoff and jitter.

Override retry behavior:

```typescript
import { createClient } from '@knowledgator/typescript-sdk';

const client = createClient('your-api-key-here', {
  retryPolicy: {
    maxTries: 5,
    baseDelay: 0.5,
    maxDelay: 15,
    retryableStatuses: [408, 409, 429, 500, 502, 503, 504],
    jitter: true,
  },
});
```

## Error Handling

The SDK provides typed error handling:

```typescript
import {
  createClient,
  ApiKeyRequiredError,
  CustomProviderMissingConfigError,
  JsonParseError,
  HttpError,
  HttpTimeoutError,
  HttpRetryError,
} from '@knowledgator/typescript-sdk';

const client = createClient('your-api-key-here');

try {
  const result = await client.comprehend.it({
    text: 'text',
    labels: ['labels'],
  });
  console.log(result);
} catch (error) {
  if (error instanceof ApiKeyRequiredError) {
    console.error('API key is required');
  } else if (error instanceof HttpTimeoutError) {
    console.error('Request timed out:', error.message);
  } else if (error instanceof HttpRetryError) {
    console.error('Request failed after retries:', error.message);
  } else if (error instanceof HttpError) {
    console.error('HTTP error:', error.response.status, error.response.statusText);
  } else if (error instanceof JsonParseError) {
    console.error('Failed to parse response:', error.message);
  } else {
    console.error('Unexpected error:', error);
  }
}
```

## Custom HTTP Configuration

Use custom HTTP configuration for advanced scenarios:

```typescript
import { createClient } from '@knowledgator/typescript-sdk';

const client = createClient('your-api-key-here', {
  provider: 'custom',
  servers: {
    comprehend: 'https://custom-comprehend-api.com',
    extract: 'https://custom-extract-api.com',
  },
  endpoints: {
    comprehend: '/v1/classify',
    extract: '/v1/extract',
    extractRelations: '/v1/relations',
    extractSummary: '/v1/summary',
  },
  baseHeaders: {
    Authorization: 'Bearer your-custom-token',
    'Custom-Header': 'value',
  },
});
```

## Authentication

Authenticate via `apiKey` parameter:

```typescript
const client = createClient('your-api-key-here');
```

## Logging and Debugging

Enable debug logging for troubleshooting:

```typescript
import { createClient } from '@knowledgator/typescript-sdk';

// Enable debug mode
const client = createClient('your-api-key-here', {
  debug: true,
});

// Or provide custom logger
const client = createClient('your-api-key-here', {
  logger: {
    debug: (message, data) => console.log(`[DEBUG] ${message}`, data),
    info: (message, data) => console.log(`[INFO] ${message}`, data),
    warn: (message, data) => console.warn(`[WARN] ${message}`, data),
    error: (message, data) => console.error(`[ERROR] ${message}`, data),
  },
});
```

## TypeScript Support

The SDK is built with TypeScript and provides full type safety:

```typescript
import type {
  ComprehendRequest,
  ComprehendResults,
  ExtractBaseRequest,
  ExtractBaseResults,
  ExtractRelationsRequest,
  ExtractRelationsResults,
  ExtractSummaryRequest,
  Config,
} from '@knowledgator/typescript-sdk';

// All request and response objects are fully typed
const request: ComprehendRequest = {
  text: 'Sample text',
  labels: ['positive', 'negative'],
  threshold: 0.7, // TypeScript ensures this is between 0 and 1
};
```

## Development

### Building from Source

```bash
git clone https://github.com/Knowledgator/knowledgator-sdk.js.git
cd knowledgator-sdk.js
npm install
npm run build
```

### Running Tests

```bash
npm test
npm run test:coverage
```

### Linting and Type Checking

```bash
npm run lint
npm run typecheck
```

## Contributing

Feel free to contribute and open issues or PRs.

1. Fork → feature branch → PR.
2. For docs tweaks (like this README) – patch away, no generator sync needed.
3. For runtime changes – supply tests; we'll migrate logic upstream.

## License

Licensed under the Apache License 2.0. See [LICENSE](LICENSE) for details.
