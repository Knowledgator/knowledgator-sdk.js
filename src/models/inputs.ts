import * as v from 'valibot';

const ClassificationExampleSchema = v.object({
  text: v.string(),
  label: v.string(),
});

const TextLabelsSchema = v.object({
  text: v.pipe(v.string(), v.minLength(1, 'Input text must not be empty')),
  labels: v.pipe(v.array(v.string()), v.minLength(1, 'At least one label is required')),
  threshold: v.optional(v.pipe(v.number(), v.minValue(0.0), v.maxValue(1.0)), 0.5),
});

const ComprehendRequestSchema = v.object({
  text: v.string(),
  labels: v.pipe(v.array(v.string()), v.minLength(1, 'At least one label is required')),
  threshold: v.optional(v.pipe(v.number(), v.minValue(0.0), v.maxValue(1.0)), 0.5),
  examples: v.optional(v.array(ClassificationExampleSchema)),
});

const ExtractBaseRequestSchema = v.object({
  text: v.string(),
  labels: v.pipe(v.array(v.string()), v.minLength(1, 'At least one label is required')),
  threshold: v.optional(v.pipe(v.number(), v.minValue(0.0), v.maxValue(1.0)), 0.5),
  prompt: v.optional(v.string()),
});

const ExtractRelationsRequestSchema = v.object({
  text: v.string(),
  relations: v.array(v.string()),
  entities: v.array(v.string()),
  threshold: v.optional(v.pipe(v.number(), v.minValue(0.0), v.maxValue(1.0)), 0.5),
  rules: v.optional(v.array(v.record(v.string(), v.unknown()))),
  prompt: v.optional(v.string()),
});

const ExtractSummaryRequestSchema = v.object({
  text: v.string(),
  threshold: v.optional(v.pipe(v.number(), v.minValue(0.0), v.maxValue(1.0)), 0.5),
  prompt: v.optional(v.string()),
});

export type ClassificationExample = v.InferOutput<typeof ClassificationExampleSchema>;

export type TextLabels = v.InferOutput<typeof TextLabelsSchema>;

export type ComprehendRequest = v.InferOutput<typeof ComprehendRequestSchema>;

export type ExtractBaseRequest = v.InferOutput<typeof ExtractBaseRequestSchema>;

export type ExtractRelationsRequest = v.InferOutput<typeof ExtractRelationsRequestSchema>;

export type ExtractSummaryRequest = v.InferOutput<typeof ExtractSummaryRequestSchema>;

export const validateClassificationExample = (data: unknown): ClassificationExample =>
  v.parse(ClassificationExampleSchema, data);

export const validateTextLabels = (data: unknown): TextLabels => v.parse(TextLabelsSchema, data);

export const validateComprehendRequest = (data: unknown): ComprehendRequest =>
  v.parse(ComprehendRequestSchema, data);

export const validateExtractBaseRequest = (data: unknown): ExtractBaseRequest =>
  v.parse(ExtractBaseRequestSchema, data);

export const validateExtractRelationsRequest = (data: unknown): ExtractRelationsRequest =>
  v.parse(ExtractRelationsRequestSchema, data);

export const validateExtractSummaryRequest = (data: unknown): ExtractSummaryRequest =>
  v.parse(ExtractSummaryRequestSchema, data);
