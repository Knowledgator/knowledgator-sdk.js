import * as v from 'valibot';

const ComprehendResponseSchema = v.object({
  label: v.string(),
  score: v.number(),
});

const EntityResponseSchema = v.object({
  span: v.string(),
  entity: v.string(),
  start: v.number(),
  end: v.number(),
  score: v.number(),
});

const RelationResponseSchema = v.object({
  source: EntityResponseSchema,
  relation: v.string(),
  target: EntityResponseSchema,
  score: v.number(),
});

const TextSpanSchema = v.object({
  text: v.pipe(v.string(), v.minLength(1, 'Text span must not be empty')),
  start: v.number(),
  end: v.number(),
  threshold: v.optional(v.pipe(v.number(), v.minValue(0.0), v.maxValue(1.0)), 0.5),
});

const ComprehendResultsSchema = v.object({
  results: v.array(ComprehendResponseSchema),
  input_text: v.string(),
  labels: v.pipe(v.array(v.string()), v.minLength(1, 'At least one label is required')),
  threshold: v.optional(v.pipe(v.number(), v.minValue(0.0), v.maxValue(1.0)), 0.5),
  status: v.string(),
});

const ExtractBaseResultsSchema = v.object({
  results: v.array(EntityResponseSchema),
  input_text: v.string(),
  labels: v.pipe(v.array(v.string()), v.minLength(1, 'At least one label is required')),
  threshold: v.optional(v.pipe(v.number(), v.minValue(0.0), v.maxValue(1.0)), 0.5),
  status: v.string(),
});

const ExtractRelationsResultsSchema = v.object({
  results: v.array(RelationResponseSchema),
  input_text: v.string(),
  entities: v.pipe(v.array(v.string()), v.minLength(1, 'At least one entity is required')),
  relations: v.pipe(v.array(v.string()), v.minLength(1, 'At least one relation is required')),
  threshold: v.optional(v.pipe(v.number(), v.minValue(0.0), v.maxValue(1.0)), 0.5),
  status: v.string(),
});

const ExtractSummaryResultsSchema = v.object({
  summary: v.string(),
  input_text: v.string(),
  threshold: v.optional(v.pipe(v.number(), v.minValue(0.0), v.maxValue(1.0)), 0.5),
  status: v.string(),
});

export type ComprehendResponse = v.InferOutput<typeof ComprehendResponseSchema>;

export type EntityResponse = v.InferOutput<typeof EntityResponseSchema>;

export type RelationResponse = v.InferOutput<typeof RelationResponseSchema>;

export type TextSpan = v.InferOutput<typeof TextSpanSchema>;

export type ComprehendResults = v.InferOutput<typeof ComprehendResultsSchema>;

export type ExtractBaseResults = v.InferOutput<typeof ExtractBaseResultsSchema>;

export type ExtractRelationsResults = v.InferOutput<typeof ExtractRelationsResultsSchema>;

export type ExtractSummaryResults = v.InferOutput<typeof ExtractSummaryResultsSchema>;

export const validateComprehendResponse = (data: unknown): ComprehendResponse =>
  v.parse(ComprehendResponseSchema, data);

export const validateEntityResponse = (data: unknown): EntityResponse =>
  v.parse(EntityResponseSchema, data);

export const validateRelationResponse = (data: unknown): RelationResponse =>
  v.parse(RelationResponseSchema, data);

export const validateTextSpan = (data: unknown): TextSpan => v.parse(TextSpanSchema, data);

export const validateComprehendResults = (data: unknown): ComprehendResults =>
  v.parse(ComprehendResultsSchema, data);

export const validateExtractBaseResults = (data: unknown): ExtractBaseResults =>
  v.parse(ExtractBaseResultsSchema, data);

export const validateExtractRelationsResults = (data: unknown): ExtractRelationsResults =>
  v.parse(ExtractRelationsResultsSchema, data);

export const validateExtractSummaryResults = (data: unknown): ExtractSummaryResults =>
  v.parse(ExtractSummaryResultsSchema, data);
