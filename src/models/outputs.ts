import * as v from 'valibot';

export const ClassifyTaskOutputSchema = v.object({
  type: v.optional(v.literal('classify'), 'classify'),
  value: v.optional(v.union([v.string(), v.array(v.string())])),
  scores: v.optional(v.record(v.string(), v.number())),
  threshold: v.optional(v.nullable(v.number())),
  adapter_id: v.optional(v.nullable(v.string())),
});

export type ClassifyTaskOutput = v.InferOutput<typeof ClassifyTaskOutputSchema>;

export const BooleanTaskOutputSchema = v.object({
  type: v.optional(v.literal('boolean'), 'boolean'),
  value: v.optional(v.boolean()),
  truth_score: v.optional(v.nullable(v.number())),
  score: v.optional(v.nullable(v.number())),
  scores: v.optional(v.record(v.string(), v.number())),
  threshold: v.optional(v.nullable(v.number())),
  adapter_id: v.optional(v.nullable(v.string())),
});

export type BooleanTaskOutput = v.InferOutput<typeof BooleanTaskOutputSchema>;

export const ScoreTaskOutputSchema = v.object({
  type: v.optional(v.literal('score'), 'score'),
  value: v.optional(v.string()),
  scores: v.optional(v.record(v.string(), v.number())),
  threshold: v.optional(v.nullable(v.number())),
  adapter_id: v.optional(v.nullable(v.string())),
});

export type ScoreTaskOutput = v.InferOutput<typeof ScoreTaskOutputSchema>;

export const SpanEntitySchema = v.object({
  text: v.optional(v.string()),
  span: v.optional(v.string()),
  label: v.optional(v.string()),
  entity: v.optional(v.string()),
  start: v.optional(v.number()),
  end: v.optional(v.number()),
  score: v.optional(v.number()),
  source: v.optional(v.string()),
});

export type SpanEntity = v.InferOutput<typeof SpanEntitySchema>;

export const SpanTaskOutputSchema = v.object({
  type: v.optional(v.literal('span'), 'span'),
  value: v.array(SpanEntitySchema),
  threshold: v.optional(v.nullable(v.number())),
});

export type SpanTaskOutput = v.InferOutput<typeof SpanTaskOutputSchema>;

export const RelationEntitySchema = v.object({
  head: SpanEntitySchema,
  tail: SpanEntitySchema,
  relation: v.optional(v.string()),
  label: v.optional(v.string()),
  score: v.optional(v.number()),
});

export type RelationEntity = v.InferOutput<typeof RelationEntitySchema>;

export const RelationTaskOutputSchema = v.object({
  type: v.optional(v.literal('relation'), 'relation'),
  value: v.array(RelationEntitySchema),
  threshold: v.optional(v.nullable(v.number())),
});

export type RelationTaskOutput = v.InferOutput<typeof RelationTaskOutputSchema>;

export type TaskOutput =
  | ClassifyTaskOutput
  | BooleanTaskOutput
  | ScoreTaskOutput
  | SpanTaskOutput
  | RelationTaskOutput
  | Record<string, unknown>;

export interface ComprehendResults {
  outputs: Record<string, TaskOutput>;
  raw?: Record<string, unknown>;
  usage?: Record<string, unknown>;
  input_text?: string;
  threshold?: number;
  status?: string;
  [key: string]: unknown;
}

export interface ExtractResults {
  outputs: Record<string, TaskOutput>;
  raw?: Record<string, unknown>;
  usage?: Record<string, unknown>;
  input_text?: string;
  threshold?: number;
  status?: string;
  [key: string]: unknown;
}

export const validateComprehendResults = (data: unknown): ComprehendResults => {
  if (!data || typeof data !== 'object') {
    throw new Error("Unexpected response shape: expected task-keyed dictionary in 'outputs'");
  }

  const raw = data as Record<string, unknown>;
  const tasksRaw = raw.outputs;

  if (!tasksRaw || typeof tasksRaw !== 'object' || Array.isArray(tasksRaw)) {
    throw new Error("Unexpected response shape: expected task-keyed dictionary in 'outputs'");
  }

  const res: ComprehendResults = {
    outputs: tasksRaw as Record<string, TaskOutput>,
    raw,
    usage: raw.usage as Record<string, unknown> | undefined,
    status: (raw.status as string) || 'ok',
  };

  for (const [key, val] of Object.entries(tasksRaw)) {
    if (!(key in res)) {
      res[key] = val;
    }
  }

  return res;
};

export const validateExtractResults = (data: unknown): ExtractResults => {
  if (!data || typeof data !== 'object') {
    throw new Error("Unexpected response shape: expected task-keyed dictionary in 'outputs'");
  }

  const raw = data as Record<string, unknown>;
  const tasksRaw = raw.outputs;

  if (!tasksRaw || typeof tasksRaw !== 'object' || Array.isArray(tasksRaw)) {
    throw new Error("Unexpected response shape: expected task-keyed dictionary in 'outputs'");
  }

  const res: ExtractResults = {
    outputs: tasksRaw as Record<string, TaskOutput>,
    raw,
    usage: raw.usage as Record<string, unknown> | undefined,
    status: (raw.status as string) || 'ok',
  };

  for (const [key, val] of Object.entries(tasksRaw)) {
    if (val && typeof val === 'object' && 'value' in (val as Record<string, unknown>)) {
      const vObj = val as Record<string, unknown>;
      if (Array.isArray(vObj.value)) {
        for (const item of vObj.value) {
          if (item && typeof item === 'object') {
            const spanItem = item as Record<string, unknown>;
            if (spanItem.text === undefined && spanItem.span !== undefined) {
              spanItem.text = spanItem.span;
            } else if (spanItem.span === undefined && spanItem.text !== undefined) {
              spanItem.span = spanItem.text;
            }
            if (spanItem.label === undefined && spanItem.entity !== undefined) {
              spanItem.label = spanItem.entity;
            } else if (spanItem.entity === undefined && spanItem.label !== undefined) {
              spanItem.entity = spanItem.label;
            }
          }
        }
      }
    }
    if (!(key in res)) {
      res[key] = val;
    }
  }

  return res;
};

// --- extract.relations and extract.summary output models ---

const RelationResultSchema = v.object({
  source: SpanEntitySchema,
  relation: v.string(),
  target: SpanEntitySchema,
  score: v.number(),
});

const ExtractRelationsResultsSchema = v.object({
  outputs: v.array(RelationResultSchema),
});

const ExtractSummaryResultSchema = v.object({
  text: v.string(),
  start: v.number(),
  end: v.number(),
  score: v.number(),
});

const ExtractSummaryResultsSchema = v.object({
  outputs: v.array(ExtractSummaryResultSchema),
});

export type ExtractRelationsResults = v.InferOutput<typeof ExtractRelationsResultsSchema>;
export type ExtractSummaryResults = v.InferOutput<typeof ExtractSummaryResultsSchema>;

export const validateExtractRelationsResults = (data: unknown): ExtractRelationsResults =>
  v.parse(ExtractRelationsResultsSchema, data);

export const validateExtractSummaryResults = (data: unknown): ExtractSummaryResults =>
  v.parse(ExtractSummaryResultsSchema, data);

// --- Instruct outputs ---

const InstructItResultsSchema = v.object({
  outputs: v.union([v.string(), v.array(v.any()), v.record(v.string(), v.any())]),
  parsed: v.optional(v.boolean()),
});

export type InstructItResults = v.InferOutput<typeof InstructItResultsSchema>;

export const validateInstructItResults = (data: unknown): InstructItResults =>
  v.parse(InstructItResultsSchema, data);
