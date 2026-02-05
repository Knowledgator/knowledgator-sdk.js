import * as v from 'valibot';

// Response schemas
const TrainingModelSchema = v.object({
  id: v.string(),
  name: v.string(),
  type: v.string(),
  description: v.optional(v.string()),
  created_at: v.string(),
  updated_at: v.string(),
  is_base: v.optional(v.boolean()),
});

const ListModelsResultsSchema = v.object({
  models: v.array(TrainingModelSchema),
  total: v.number(),
  offset: v.number(),
  limit: v.number(),
});

const ObjectCreationSchema = v.object({
  id: v.string(),
  created_at: v.string(),
});

const TrainingObjectSchema = v.object({
  id: v.string(),
  model_id: v.string(),
  dataset_id: v.string(),
  status: v.string(),
  hyperparameters: v.optional(v.record(v.string(), v.any())),
  created_at: v.string(),
  updated_at: v.string(),
  started_at: v.optional(v.string()),
  completed_at: v.optional(v.string()),
  error: v.optional(v.string()),
});

const ListTrainingsResultsSchema = v.object({
  trainings: v.array(TrainingObjectSchema),
  total: v.number(),
  offset: v.number(),
  limit: v.number(),
});

const TagSchema = v.object({
  name: v.string(),
  description: v.optional(v.string()),
});

const ListTagsResultsSchema = v.object({
  tags: v.array(TagSchema),
  total: v.number(),
});

const TrainingEventSchema = v.object({
  id: v.string(),
  training_id: v.string(),
  event_type: v.string(),
  message: v.string(),
  created_at: v.string(),
  metadata: v.optional(v.record(v.string(), v.any())),
});

const ListEventsResultsSchema = v.object({
  events: v.array(TrainingEventSchema),
  total: v.number(),
  offset: v.number(),
  limit: v.number(),
});

const MetricDataPointSchema = v.object({
  step: v.number(),
  value: v.number(),
  timestamp: v.string(),
});

const ListMetricsResultsSchema = v.object({
  metric: v.string(),
  data: v.array(MetricDataPointSchema),
  total: v.number(),
  offset: v.number(),
  limit: v.number(),
});

// Response types
export type TrainingModel = v.InferOutput<typeof TrainingModelSchema>;
export type ListModelsResults = v.InferOutput<typeof ListModelsResultsSchema>;
export type ObjectCreation = v.InferOutput<typeof ObjectCreationSchema>;
export type TrainingObject = v.InferOutput<typeof TrainingObjectSchema>;
export type ListTrainingsResults = v.InferOutput<typeof ListTrainingsResultsSchema>;
export type Tag = v.InferOutput<typeof TagSchema>;
export type ListTagsResults = v.InferOutput<typeof ListTagsResultsSchema>;
export type TrainingEvent = v.InferOutput<typeof TrainingEventSchema>;
export type ListEventsResults = v.InferOutput<typeof ListEventsResultsSchema>;
export type MetricDataPoint = v.InferOutput<typeof MetricDataPointSchema>;
export type ListMetricsResults = v.InferOutput<typeof ListMetricsResultsSchema>;

// Validators
export const validateTrainingModel = (data: unknown): TrainingModel =>
  v.parse(TrainingModelSchema, data);

export const validateListModelsResults = (data: unknown): ListModelsResults =>
  v.parse(ListModelsResultsSchema, data);

export const validateObjectCreation = (data: unknown): ObjectCreation =>
  v.parse(ObjectCreationSchema, data);

export const validateTrainingObject = (data: unknown): TrainingObject =>
  v.parse(TrainingObjectSchema, data);

export const validateListTrainingsResults = (data: unknown): ListTrainingsResults =>
  v.parse(ListTrainingsResultsSchema, data);

export const validateListTagsResults = (data: unknown): ListTagsResults =>
  v.parse(ListTagsResultsSchema, data);

export const validateListEventsResults = (data: unknown): ListEventsResults =>
  v.parse(ListEventsResultsSchema, data);

export const validateListMetricsResults = (data: unknown): ListMetricsResults =>
  v.parse(ListMetricsResultsSchema, data);
