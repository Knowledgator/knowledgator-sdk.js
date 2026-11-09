import * as v from 'valibot';

const ComprehendResultSchema = v.object({
  label: v.string(),
  score: v.number(),
});

const ComprehendResultsSchema = v.object({
  results: v.array(ComprehendResultSchema),
});

const EntitySchema = v.object({
  span: v.string(),
  entity: v.string(),
  start: v.number(),
  end: v.number(),
  score: v.number(),
});

const ExtractBaseResultsSchema = v.object({
  results: v.array(EntitySchema),
});

const RelationResultSchema = v.object({
  source: EntitySchema,
  relation: v.string(),
  target: EntitySchema,
  score: v.number(),
});

const ExtractRelationsResultsSchema = v.object({
  results: v.array(RelationResultSchema),
});

const ExtractSummaryResultSchema = v.object({
  text: v.string(),
  start: v.number(),
  end: v.number(),
  score: v.number(),
});

const ExtractSummaryResultsSchema = v.object({
  results: v.array(ExtractSummaryResultSchema),
});

export type ComprehendResults = v.InferOutput<typeof ComprehendResultsSchema>;

export type ExtractBaseResults = v.InferOutput<typeof ExtractBaseResultsSchema>;

export type ExtractRelationsResults = v.InferOutput<typeof ExtractRelationsResultsSchema>;

export type ExtractSummaryResults = v.InferOutput<typeof ExtractSummaryResultsSchema>;

export const validateComprehendResults = (data: unknown): ComprehendResults => {
  if (data && typeof data === 'object' && !('results' in data) && 'outputs' in data) {
    return v.parse(ComprehendResultsSchema, {
      ...(data as object),
      results: (data as Record<string, unknown>).outputs,
    });
  }
  return v.parse(ComprehendResultsSchema, data);
};

export const validateExtractBaseResults = (data: unknown): ExtractBaseResults => {
  if (data && typeof data === 'object' && !('results' in data) && 'outputs' in data) {
    return v.parse(ExtractBaseResultsSchema, {
      ...(data as object),
      results: (data as Record<string, unknown>).outputs,
    });
  }
  return v.parse(ExtractBaseResultsSchema, data);
};

export const validateExtractRelationsResults = (data: unknown): ExtractRelationsResults => {
  if (data && typeof data === 'object' && !('results' in data) && 'outputs' in data) {
    return v.parse(ExtractRelationsResultsSchema, {
      ...(data as object),
      results: (data as Record<string, unknown>).outputs,
    });
  }
  return v.parse(ExtractRelationsResultsSchema, data);
};

export const validateExtractSummaryResults = (data: unknown): ExtractSummaryResults =>
  v.parse(ExtractSummaryResultsSchema, data);

const InstructItResultsSchema = v.object({
  outputs: v.union([v.string(), v.array(v.any()), v.record(v.string(), v.any())]),
  parsed: v.optional(v.boolean()),
});

export type InstructItResults = v.InferOutput<typeof InstructItResultsSchema>;

export const validateInstructItResults = (data: unknown): InstructItResults =>
  v.parse(InstructItResultsSchema, data);
