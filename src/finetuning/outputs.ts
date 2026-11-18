import * as v from 'valibot';

// Response schemas
const TrainingModelSchema = v.pipe(
  v.looseObject({
    id: v.optional(v.string()),
    model_id: v.optional(v.string()),
    name: v.optional(v.string()),
    type: v.optional(v.string()),
    description: v.optional(v.nullable(v.string())),
    short_description: v.optional(v.nullable(v.string())),
    created_at: v.optional(v.nullable(v.string())),
    updated_at: v.optional(v.nullable(v.string())),
    is_base: v.optional(v.nullable(v.boolean())),
    training_model: v.optional(v.nullable(v.boolean())),
    training_adapter: v.optional(v.nullable(v.boolean())),
    inference: v.optional(v.nullable(v.string())),
    fine_tuned: v.optional(v.nullable(v.boolean())),
    parent_model: v.optional(v.nullable(v.string())),
    architecture: v.optional(v.nullable(v.string())),
    main_task: v.optional(v.nullable(v.string())),
    tasks: v.optional(v.nullable(v.array(v.string()))),
    modalities: v.optional(v.nullable(v.array(v.string()))),
    tags: v.optional(v.nullable(v.array(v.string()))),
    num_of_parameters: v.optional(v.nullable(v.any())),
    training: v.optional(v.nullable(v.record(v.string(), v.any()))),
    collections: v.optional(v.nullable(v.any())),
    export_info: v.optional(v.nullable(v.any())),
  }),
  v.transform((raw) => ({
    id: raw.id ?? raw.model_id ?? '',
    name: raw.name ?? '',
    type: raw.type ?? '',
    description: raw.description ?? undefined,
    short_description: raw.short_description ?? undefined,
    created_at: raw.created_at ?? '',
    updated_at: raw.updated_at ?? '',
    is_base: raw.is_base ?? false,
    training_model: raw.training_model ?? undefined,
    training_adapter: raw.training_adapter ?? undefined,
    inference: raw.inference ?? undefined,
    fine_tuned: raw.fine_tuned ?? undefined,
    parent_model: raw.parent_model ?? undefined,
    architecture: raw.architecture ?? undefined,
    main_task: raw.main_task ?? undefined,
    tasks: raw.tasks ?? undefined,
    modalities: raw.modalities ?? undefined,
    tags: raw.tags ?? undefined,
    num_of_parameters: raw.num_of_parameters ?? undefined,
    training: raw.training ?? undefined,
    collections: raw.collections ?? undefined,
    export_info: raw.export_info ?? undefined,
  })),
);

const ListModelsResultsSchema = v.pipe(
  v.looseObject({
    models: v.optional(v.array(TrainingModelSchema)),
    results: v.optional(v.array(TrainingModelSchema)),
    data: v.optional(v.array(TrainingModelSchema)),
    total: v.optional(v.number()),
    offset: v.optional(v.number()),
    limit: v.optional(v.number()),
  }),
  v.transform((raw) => {
    const items = raw.models ?? raw.results ?? raw.data ?? [];
    return {
      models: items,
      total: raw.total ?? items.length,
      offset: raw.offset ?? 0,
      limit: raw.limit ?? 100,
    };
  }),
);

const ObjectCreationSchema = v.pipe(
  v.looseObject({
    id: v.optional(v.string()),
    training_id: v.optional(v.string()),
    model_id: v.optional(v.string()),
    created_at: v.optional(v.string()),
  }),
  v.transform((raw) => ({
    id: raw.id ?? raw.training_id ?? raw.model_id ?? '',
    created_at: raw.created_at ?? '',
  })),
);

const TrainingObjectSchema = v.pipe(
  v.looseObject({
    id: v.optional(v.string()),
    training_id: v.optional(v.string()),
    name: v.optional(v.string()),
    type: v.optional(v.string()),
    model_id: v.optional(v.string()),
    parent_model_id: v.optional(v.string()),
    dataset_id: v.optional(v.string()),
    training: v.optional(v.record(v.string(), v.any())),
    status: v.optional(v.string()),
    hyperparameters: v.optional(v.record(v.string(), v.any())),
    args: v.optional(v.record(v.string(), v.any())),
    created_at: v.optional(v.string()),
    updated_at: v.optional(v.string()),
    last_updated_at: v.optional(v.string()),
    started_at: v.optional(v.string()),
    completed_at: v.optional(v.string()),
    error: v.optional(v.string()),
  }),
  v.transform((raw) => {
    const rawTraining = raw.training && typeof raw.training === 'object' ? raw.training : undefined;
    return {
      id: raw.id ?? raw.training_id ?? raw.name ?? '',
      name: raw.name ?? '',
      type: raw.type ?? '',
      model_id: raw.model_id ?? raw.parent_model_id ?? '',
      dataset_id: raw.dataset_id ?? (rawTraining ? rawTraining.dataset_id : '') ?? '',
      status: raw.status ?? 'pending',
      hyperparameters:
        raw.hyperparameters ??
        raw.args ??
        (rawTraining ? (rawTraining.hyperparameters ?? rawTraining.args) : undefined),
      created_at: raw.created_at ?? '',
      updated_at: raw.updated_at ?? raw.last_updated_at ?? '',
      started_at: raw.started_at,
      completed_at: raw.completed_at,
      error: raw.error,
    };
  }),
);

const ListTrainingsResultsSchema = v.pipe(
  v.looseObject({
    trainings: v.optional(v.array(TrainingObjectSchema)),
    results: v.optional(v.array(TrainingObjectSchema)),
    data: v.optional(v.array(TrainingObjectSchema)),
    total: v.optional(v.number()),
    offset: v.optional(v.number()),
    limit: v.optional(v.number()),
  }),
  v.transform((raw) => {
    const items = raw.trainings ?? raw.results ?? raw.data ?? [];
    return {
      trainings: items,
      total: raw.total ?? items.length,
      offset: raw.offset ?? 0,
      limit: raw.limit ?? 100,
    };
  }),
);

const TagSchema = v.pipe(
  v.looseObject({
    name: v.optional(v.string()),
    description: v.optional(v.string()),
  }),
  v.transform((raw) => ({
    name: raw.name ?? '',
    description: raw.description,
  })),
);

const ListTagsResultsSchema = v.pipe(
  v.looseObject({
    tags: v.optional(v.array(TagSchema)),
    types: v.optional(v.array(TagSchema)),
    results: v.optional(v.array(TagSchema)),
    data: v.optional(v.array(TagSchema)),
    total: v.optional(v.number()),
  }),
  v.transform((raw) => {
    const items = raw.tags ?? raw.types ?? raw.results ?? raw.data ?? [];
    return {
      tags: items,
      total: raw.total ?? items.length,
    };
  }),
);

const TrainingEventSchema = v.pipe(
  v.looseObject({
    id: v.optional(v.string()),
    training_id: v.optional(v.string()),
    event_type: v.optional(v.string()),
    type: v.optional(v.string()),
    message: v.optional(v.string()),
    created_at: v.optional(v.string()),
    timestamp: v.optional(v.string()),
    metadata: v.optional(v.record(v.string(), v.any())),
  }),
  v.transform((raw) => ({
    id: raw.id ?? '',
    training_id: raw.training_id ?? '',
    event_type: raw.event_type ?? raw.type ?? '',
    message: raw.message ?? '',
    created_at: raw.created_at ?? raw.timestamp ?? '',
    metadata: raw.metadata,
  })),
);

const ListEventsResultsSchema = v.pipe(
  v.looseObject({
    events: v.optional(v.array(TrainingEventSchema)),
    results: v.optional(v.array(TrainingEventSchema)),
    data: v.optional(v.array(TrainingEventSchema)),
    total: v.optional(v.number()),
    offset: v.optional(v.number()),
    limit: v.optional(v.number()),
  }),
  v.transform((raw) => {
    const items = raw.events ?? raw.results ?? raw.data ?? [];
    return {
      events: items,
      total: raw.total ?? items.length,
      offset: raw.offset ?? 0,
      limit: raw.limit ?? 100,
    };
  }),
);

const MetricDataPointSchema = v.pipe(
  v.looseObject({
    step: v.optional(v.number()),
    value: v.optional(v.number()),
    timestamp: v.optional(v.string()),
  }),
  v.transform((raw) => ({
    step: raw.step ?? 0,
    value: raw.value ?? 0,
    timestamp: raw.timestamp ?? '',
  })),
);

const ListMetricsResultsSchema = v.pipe(
  v.looseObject({
    metric: v.optional(v.string()),
    data: v.optional(v.array(MetricDataPointSchema)),
    values: v.optional(v.array(MetricDataPointSchema)),
    results: v.optional(v.array(MetricDataPointSchema)),
    total: v.optional(v.number()),
    offset: v.optional(v.number()),
    limit: v.optional(v.number()),
  }),
  v.transform((raw) => {
    const items = raw.data ?? raw.values ?? raw.results ?? [];
    return {
      metric: raw.metric ?? '',
      data: items,
      total: raw.total ?? items.length,
      offset: raw.offset ?? 0,
      limit: raw.limit ?? 100,
    };
  }),
);

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
