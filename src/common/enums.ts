import * as v from 'valibot';

/**
 * Service types supported by the Knowledgator API.
 * Used across models, datasets, and fine-tuning operations.
 */
export const ServiceTypeEnum = v.picklist([
  'ner',
  'text-classification',
  'relation-extraction',
  'comprehend-it',
  'extract-it',
  'instruct-it',
]);

export type ServiceType = v.InferInput<typeof ServiceTypeEnum>;
