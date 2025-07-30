import * as v from 'valibot';

const ComprehendRequestExampleSchema = v.object({
  text: v.pipe(v.string(), v.minLength(1)),
  labels: v.pipe(v.array(v.string()), v.minLength(1)),
});

const ComprehendRequestSchema = v.object({
  text: v.pipe(v.string(), v.minLength(1)),
  labels: v.pipe(v.array(v.string()), v.minLength(1)),
  threshold: v.optional(v.pipe(v.number(), v.minValue(0.0), v.maxValue(1.0)), 0.5),
  examples: v.optional(v.array(ComprehendRequestExampleSchema)),
});

const ExtractBaseRequestSchema = v.object({
  text: v.pipe(v.string(), v.minLength(1)),
  labels: v.pipe(v.array(v.string()), v.minLength(1)),
  threshold: v.optional(v.pipe(v.number(), v.minValue(0.0), v.maxValue(1.0)), 0.5),
  prompt: v.optional(v.string()),
});

const ExtractRelationsRequestRuleSchema = v.object({
  relation: v.pipe(v.string(), v.minLength(1)),
  pairs_filter: v.optional(v.array(v.array(v.string()))),
  distance: v.optional(v.number()),
});

const ExtractRelationsRequestSchema = v.object({
  text: v.pipe(v.string(), v.minLength(1)),
  relations: v.pipe(v.array(v.string()), v.minLength(1)),
  labels: v.optional(v.array(v.string())),
  threshold: v.optional(v.pipe(v.number(), v.minValue(0.0), v.maxValue(1.0)), 0.5),
  rules: v.optional(v.array(ExtractRelationsRequestRuleSchema)),
  prompt: v.optional(v.string()),
});

const ExtractSummaryRequestSchema = v.object({
  text: v.pipe(v.string(), v.minLength(1)),
  threshold: v.optional(v.pipe(v.number(), v.minValue(0.0), v.maxValue(1.0)), 0.5),
  prompt: v.optional(v.string()),
});

export type ComprehendRequest = v.InferInput<typeof ComprehendRequestSchema>;

export type ExtractBaseRequest = v.InferInput<typeof ExtractBaseRequestSchema>;

export type ExtractRelationsRequest = v.InferInput<typeof ExtractRelationsRequestSchema>;

export type ExtractSummaryRequest = v.InferInput<typeof ExtractSummaryRequestSchema>;

export const validateComprehendRequest = (data: unknown): ComprehendRequest =>
  v.parse(ComprehendRequestSchema, data);

export const validateExtractBaseRequest = (data: unknown): ExtractBaseRequest =>
  v.parse(ExtractBaseRequestSchema, data);

export const validateExtractRelationsRequest = (data: unknown): ExtractRelationsRequest =>
  v.parse(ExtractRelationsRequestSchema, data);

export const validateExtractSummaryRequest = (data: unknown): ExtractSummaryRequest =>
  v.parse(ExtractSummaryRequestSchema, data);
