import * as v from 'valibot';

import { ServiceTypeEnum } from '../common';

const BASE_MODEL_NAME_REGEX = /^[a-zA-Z0-9- .()]+$/;
const ID_REGEX = /^[a-zA-Z0-9-]+$/;

export const TrainingStatusEnum = v.picklist(['active', 'completed', 'stopped', 'failed']);

export type TrainingStatus = v.InferInput<typeof TrainingStatusEnum>;

// Request schemas
const CreateBaseModelRequestSchema = v.object({
  name: v.pipe(v.string(), v.minLength(1), v.maxLength(64), v.regex(BASE_MODEL_NAME_REGEX)),
  type: ServiceTypeEnum,
  description: v.optional(v.string()),
});

export const ModelObjectTypeEnum = v.picklist(['model', 'adapter']);
export type ModelObjectType = v.InferInput<typeof ModelObjectTypeEnum>;

const ListModelsRequestSchema = v.object({
  offset: v.optional(v.pipe(v.number(), v.minValue(0)), 0),
  limit: v.optional(v.pipe(v.number(), v.minValue(0), v.maxValue(10000)), 100),
  name: v.optional(
    v.nullable(v.pipe(v.string(), v.minLength(1), v.maxLength(64), v.regex(BASE_MODEL_NAME_REGEX))),
  ),
  type: v.optional(v.nullable(v.union([ServiceTypeEnum, v.string()]))),
  object_type: v.optional(v.nullable(ModelObjectTypeEnum)),
  trainable: v.optional(v.nullable(ModelObjectTypeEnum)),
  inference: v.optional(v.nullable(v.string())),
  architecture: v.optional(v.nullable(v.string())),
  tag: v.optional(v.nullable(v.string())),
  task: v.optional(v.nullable(v.string())),
  modality: v.optional(v.nullable(v.string())),
  collection_id: v.optional(v.nullable(v.string())),
  include_base: v.optional(v.boolean(), true),
});

const StartTrainingRequestSchema = v.object({
  model_id: v.pipe(v.string(), v.minLength(2), v.maxLength(64), v.regex(ID_REGEX)),
  dataset_id: v.pipe(v.string(), v.minLength(2), v.maxLength(64), v.regex(ID_REGEX)),
  hyperparameters: v.optional(v.record(v.string(), v.any())),
});

const ListTrainingsRequestSchema = v.object({
  offset: v.optional(v.pipe(v.number(), v.minValue(0)), 0),
  limit: v.optional(v.pipe(v.number(), v.minValue(0), v.maxValue(10000)), 100),
  status: v.optional(v.nullable(TrainingStatusEnum)),
  type: v.optional(v.nullable(ServiceTypeEnum)),
});

const ListEventsRequestSchema = v.object({
  offset: v.optional(v.pipe(v.number(), v.minValue(0)), 0),
  limit: v.optional(v.pipe(v.number(), v.minValue(0), v.maxValue(10000)), 100),
});

const GetMetricsRequestSchema = v.object({
  metric: v.literal('loss'),
  offset: v.optional(v.pipe(v.number(), v.minValue(0)), 0),
  limit: v.optional(v.pipe(v.number(), v.minValue(0), v.maxValue(10000)), 100),
});

// Request types
export type CreateBaseModelRequest = v.InferInput<typeof CreateBaseModelRequestSchema>;
export type ListModelsRequest = v.InferInput<typeof ListModelsRequestSchema>;
export type StartTrainingRequest = v.InferInput<typeof StartTrainingRequestSchema>;
export type ListTrainingsRequest = v.InferInput<typeof ListTrainingsRequestSchema>;
export type ListEventsRequest = v.InferInput<typeof ListEventsRequestSchema>;
export type GetMetricsRequest = v.InferInput<typeof GetMetricsRequestSchema>;

// Validators
export const validateCreateBaseModelRequest = (data: unknown): CreateBaseModelRequest =>
  v.parse(CreateBaseModelRequestSchema, data);

export const validateListModelsRequest = (data: unknown): ListModelsRequest =>
  v.parse(ListModelsRequestSchema, data);

export const validateStartTrainingRequest = (data: unknown): StartTrainingRequest =>
  v.parse(StartTrainingRequestSchema, data);

export const validateListTrainingsRequest = (data: unknown): ListTrainingsRequest =>
  v.parse(ListTrainingsRequestSchema, data);

export const validateListEventsRequest = (data: unknown): ListEventsRequest =>
  v.parse(ListEventsRequestSchema, data);

export const validateGetMetricsRequest = (data: unknown): GetMetricsRequest =>
  v.parse(GetMetricsRequestSchema, data);
