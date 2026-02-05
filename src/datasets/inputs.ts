import * as v from 'valibot';

import { ServiceTypeEnum, type ServiceType } from '../core/enums';

// Enums
export { ServiceTypeEnum, type ServiceType };
export const DatasetFormatEnum = v.picklist(['jsonl', 'csv', 'parquet', 'json']);
export const DatasetStatusEnum = v.picklist(['pending', 'processing', 'ready', 'failed']);

export type DatasetFormat = v.InferInput<typeof DatasetFormatEnum>;
export type DatasetStatus = v.InferInput<typeof DatasetStatusEnum>;

const DATASET_NAME_REGEX = /^[a-zA-Z0-9- .()]+$/;

// Request schemas
const ListDatasetsRequestSchema = v.object({
  offset: v.optional(v.pipe(v.number(), v.minValue(0)), 0),
  limit: v.optional(v.pipe(v.number(), v.minValue(0), v.maxValue(10000)), 100),
  name: v.optional(v.nullable(v.pipe(v.string(), v.minLength(1), v.maxLength(64)))),
  type: v.optional(v.nullable(ServiceTypeEnum)),
  format: v.optional(v.nullable(DatasetFormatEnum)),
  status: v.optional(v.nullable(DatasetStatusEnum)),
});

const CreateDatasetRequestSchema = v.object({
  name: v.pipe(v.string(), v.minLength(1), v.maxLength(64), v.regex(DATASET_NAME_REGEX)),
  type: ServiceTypeEnum,
  format: DatasetFormatEnum,
  description: v.optional(v.string()),
  file: v.optional(v.instance(File)),
});

const UpdateDatasetRequestSchema = v.object({
  name: v.optional(
    v.pipe(v.string(), v.minLength(1), v.maxLength(64), v.regex(DATASET_NAME_REGEX)),
  ),
  description: v.optional(v.string()),
});

const UploadDatasetRequestSchema = v.object({
  file: v.instance(File),
});

const ListFormatsRequestSchema = v.object({
  offset: v.optional(v.pipe(v.number(), v.minValue(0)), 0),
  limit: v.optional(v.pipe(v.number(), v.minValue(0), v.maxValue(10000)), 100),
});

// Request types
export type ListDatasetsRequest = v.InferInput<typeof ListDatasetsRequestSchema>;
export type CreateDatasetRequest = v.InferInput<typeof CreateDatasetRequestSchema>;
export type UpdateDatasetRequest = v.InferInput<typeof UpdateDatasetRequestSchema>;
export type UploadDatasetRequest = v.InferInput<typeof UploadDatasetRequestSchema>;
export type ListFormatsRequest = v.InferInput<typeof ListFormatsRequestSchema>;

// Validators
export const validateListDatasetsRequest = (data: unknown): ListDatasetsRequest =>
  v.parse(ListDatasetsRequestSchema, data);

export const validateCreateDatasetRequest = (data: unknown): CreateDatasetRequest =>
  v.parse(CreateDatasetRequestSchema, data);

export const validateUpdateDatasetRequest = (data: unknown): UpdateDatasetRequest =>
  v.parse(UpdateDatasetRequestSchema, data);

export const validateUploadDatasetRequest = (data: unknown): UploadDatasetRequest =>
  v.parse(UploadDatasetRequestSchema, data);

export const validateListFormatsRequest = (data: unknown): ListFormatsRequest =>
  v.parse(ListFormatsRequestSchema, data);
