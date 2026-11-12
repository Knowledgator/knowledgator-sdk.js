import * as v from 'valibot';

export {
  type ComprehendRequest,
  type ExtractRequest,
  validateComprehendRequest,
  validateExtractRequest,
} from './models';

// Backwards-compatible alias for type imports if any external consumer used ExtractBaseRequest
export type { ExtractRequest as ExtractBaseRequest } from './models';

const ExtractRelationsRequestRuleSchema = v.object({
  relation: v.pipe(v.string(), v.minLength(1)),
  pairs_filter: v.optional(v.array(v.array(v.string()))),
  distance: v.optional(v.number()),
});

const ExtractRelationsRequestSchema = v.object({
  text: v.pipe(v.string(), v.minLength(1)),
  relations: v.pipe(v.array(v.string()), v.minLength(1)),
  entities: v.pipe(v.array(v.string()), v.minLength(1)),
  threshold: v.optional(v.pipe(v.number(), v.minValue(0.0), v.maxValue(1.0)), 0.5),
  rules: v.optional(v.array(ExtractRelationsRequestRuleSchema)),
  prompt: v.optional(v.string()),
  model_id: v.optional(v.string()),
  adapter_id: v.optional(v.string()),
});

const ExtractSummaryRequestSchema = v.object({
  text: v.pipe(v.string(), v.minLength(1)),
  threshold: v.optional(v.pipe(v.number(), v.minValue(0.0), v.maxValue(1.0)), 0.5),
  prompt: v.optional(v.string()),
  model_id: v.optional(v.string()),
  adapter_id: v.optional(v.string()),
});

export type ExtractRelationsRequest = v.InferInput<typeof ExtractRelationsRequestSchema>;

export type ExtractSummaryRequest = v.InferInput<typeof ExtractSummaryRequestSchema>;

export const validateExtractRelationsRequest = (data: unknown): ExtractRelationsRequest =>
  v.parse(ExtractRelationsRequestSchema, data);

export const validateExtractSummaryRequest = (data: unknown): ExtractSummaryRequest =>
  v.parse(ExtractSummaryRequestSchema, data);

const FileMetadataSchema = v.object({
  name: v.pipe(v.string(), v.minLength(1)),
  content: v.optional(v.instance(Uint8Array)),
});

/**
 * Metadata for a file reference, optionally with content.
 *
 * When content is provided, it will be transmitted as a file part
 * in the multipart/form-data request.
 */
export type FileMetadata = v.InferInput<typeof FileMetadataSchema>;

const InstructItRequestSchema = v.object({
  text: v.pipe(v.string(), v.minLength(1)),
  template: v.optional(v.string()),
  files: v.optional(v.array(FileMetadataSchema)),
  output_type: v.optional(v.string()),
  model_id: v.optional(v.string()),
  adapter_id: v.optional(v.string()),
});

export type InstructItRequest = v.InferInput<typeof InstructItRequestSchema>;

export const validateInstructItRequest = (data: unknown): InstructItRequest =>
  v.parse(InstructItRequestSchema, data);
