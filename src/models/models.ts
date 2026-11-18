import * as v from 'valibot';

export const LabelDefinitionSchema = v.object({
  title: v.optional(v.nullable(v.string())),
  description: v.optional(v.nullable(v.string())),
  metadata: v.optional(v.nullable(v.record(v.string(), v.any()))),
});

export type LabelDefinition = v.InferOutput<typeof LabelDefinitionSchema>;

export const LabelSpecSchema = v.union([
  v.pipe(v.string(), v.minLength(1)),
  v.pipe(v.array(v.pipe(v.string(), v.minLength(1))), v.minLength(1)),
  v.record(v.string(), v.nullable(v.union([v.string(), LabelDefinitionSchema]))),
]);

export type LabelSpec = v.InferOutput<typeof LabelSpecSchema>;

export const AnalyzeInputSchema = v.union([
  v.string(),
  v.number(),
  v.boolean(),
  v.array(v.any()),
  v.record(v.string(), v.any()),
]);

export type AnalyzeInput = v.InferOutput<typeof AnalyzeInputSchema>;

export const AnalyzeOptionsSchema = v.object({
  include_label_definitions: v.optional(v.boolean(), false),
  include_usage: v.optional(v.boolean(), false),
  include_evidence: v.optional(v.boolean(), false),
  include_layout_text: v.optional(v.boolean(), false),
  reference_date: v.optional(v.nullable(v.string())),
  adapter_id: v.optional(v.nullable(v.string())),
  timeout_ms: v.optional(v.number()),
});

export type AnalyzeOptions = v.InferOutput<typeof AnalyzeOptionsSchema>;

export const AnalyzeTaskClassifySchema = v.object({
  type: v.literal('classify'),
  labels: LabelSpecSchema,
  threshold: v.optional(v.nullable(v.pipe(v.number(), v.minValue(0), v.maxValue(1)))),
  multi_label: v.optional(v.nullable(v.boolean())),
  instruction: v.optional(v.nullable(v.string())),
});

export type AnalyzeTaskClassify = v.InferOutput<typeof AnalyzeTaskClassifySchema>;

export const AnalyzeTaskBooleanSchema = v.object({
  type: v.literal('boolean'),
  threshold: v.optional(v.nullable(v.pipe(v.number(), v.minValue(0), v.maxValue(1)))),
  labels: v.optional(v.nullable(LabelSpecSchema)),
  instruction: v.optional(v.nullable(v.string())),
});

export type AnalyzeTaskBoolean = v.InferOutput<typeof AnalyzeTaskBooleanSchema>;

export const AnalyzeTaskScoreSchema = v.object({
  type: v.literal('score'),
  labels: LabelSpecSchema,
  order: v.pipe(v.array(v.string()), v.minLength(2)),
  threshold: v.optional(v.nullable(v.pipe(v.number(), v.minValue(0), v.maxValue(1)))),
  instruction: v.optional(v.nullable(v.string())),
});

export type AnalyzeTaskScore = v.InferOutput<typeof AnalyzeTaskScoreSchema>;

export const AnalyzeTaskSpanSchema = v.object({
  type: v.literal('span'),
  labels: v.optional(v.nullable(LabelSpecSchema)),
  threshold: v.optional(v.nullable(v.pipe(v.number(), v.minValue(0), v.maxValue(1)))),
  flat: v.optional(v.nullable(v.boolean())),
  instruction: v.optional(v.nullable(v.string())),
});

export type AnalyzeTaskSpan = v.InferOutput<typeof AnalyzeTaskSpanSchema>;

export const AnalyzeTaskRelationSchema = v.object({
  type: v.literal('relation'),
  labels: LabelSpecSchema,
  entity_labels: v.optional(v.nullable(LabelSpecSchema)),
  threshold: v.optional(v.nullable(v.pipe(v.number(), v.minValue(0), v.maxValue(1)))),
  flat: v.optional(v.nullable(v.boolean())),
  instruction: v.optional(v.nullable(v.string())),
});

export type AnalyzeTaskRelation = v.InferOutput<typeof AnalyzeTaskRelationSchema>;

export const ComprehendTasksSchema = v.union([
  AnalyzeTaskClassifySchema,
  AnalyzeTaskBooleanSchema,
  AnalyzeTaskScoreSchema,
]);

export type ComprehendTask = v.InferOutput<typeof ComprehendTasksSchema>;

export const ExtractTasksSchema = v.union([AnalyzeTaskSpanSchema, AnalyzeTaskRelationSchema]);

export type ExtractTask = v.InferOutput<typeof ExtractTasksSchema>;

export const ComprehendRequestSchema = v.object({
  input: v.optional(AnalyzeInputSchema),
  text: v.optional(v.string()),
  tasks: v.record(v.string(), ComprehendTasksSchema),
  options: v.optional(v.nullable(AnalyzeOptionsSchema)),
  model_id: v.optional(v.nullable(v.string())),
  adapter_id: v.optional(v.nullable(v.string())),
});

export type ComprehendRequest = v.InferInput<typeof ComprehendRequestSchema>;

export const ExtractRequestSchema = v.object({
  input: v.optional(AnalyzeInputSchema),
  text: v.optional(v.string()),
  tasks: v.record(v.string(), ExtractTasksSchema),
  options: v.optional(v.nullable(AnalyzeOptionsSchema)),
  model_id: v.optional(v.nullable(v.string())),
  adapter_id: v.optional(v.nullable(v.string())),
});

export type ExtractRequest = v.InferInput<typeof ExtractRequestSchema>;

export const validateComprehendRequest = (data: unknown): Record<string, unknown> => {
  if (data && typeof data === 'object') {
    const d = data as Record<string, unknown>;
    if (d.labels !== undefined) {
      throw new TypeError(
        "The 'labels' argument has been removed from comprehend.it. Please pass 'tasks' instead.",
      );
    }
    const validated = v.parse(ComprehendRequestSchema, data);
    const input = validated.input !== undefined ? validated.input : validated.text;
    if (input === undefined) {
      throw new Error("Missing required field 'input' or 'text'");
    }
    const body: Record<string, unknown> = {
      input,
      tasks: validated.tasks,
    };
    if (validated.options) {
      body.options = validated.options;
    }
    if (validated.adapter_id !== undefined && validated.adapter_id !== null) {
      body.adapter_id = validated.adapter_id;
    }
    if (validated.model_id !== undefined && validated.model_id !== null) {
      body.model_id = validated.model_id;
    }
    return body;
  }
  return v.parse(ComprehendRequestSchema, data) as Record<string, unknown>;
};

export const validateExtractRequest = (data: unknown): Record<string, unknown> => {
  if (data && typeof data === 'object') {
    const d = data as Record<string, unknown>;
    if (d.labels !== undefined || d.entities !== undefined) {
      throw new TypeError(
        "The 'labels' and 'entities' arguments have been removed from extract.it. Please pass 'tasks' instead.",
      );
    }
    const validated = v.parse(ExtractRequestSchema, data);
    const input = validated.input !== undefined ? validated.input : validated.text;
    if (input === undefined) {
      throw new Error("Missing required field 'input' or 'text'");
    }
    const body: Record<string, unknown> = {
      input,
      tasks: validated.tasks,
    };
    if (validated.options) {
      body.options = validated.options;
    }
    if (validated.adapter_id !== undefined && validated.adapter_id !== null) {
      body.adapter_id = validated.adapter_id;
    }
    if (validated.model_id !== undefined && validated.model_id !== null) {
      body.model_id = validated.model_id;
    }
    return body;
  }
  return v.parse(ExtractRequestSchema, data) as Record<string, unknown>;
};
