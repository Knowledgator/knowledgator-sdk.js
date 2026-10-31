import * as v from 'valibot';

import { ServiceTypeEnum } from '../common';

const DATASET_NAME_REGEX = /^[a-zA-Z0-9- .()]+$/;

// Enums
export const DatasetFormatEnum = v.picklist(['jsonl', 'csv', 'parquet', 'json']);
export const DatasetStatusEnum = v.picklist(['pending', 'processing', 'ready', 'failed']);

export type DatasetFormat = v.InferInput<typeof DatasetFormatEnum>;
export type DatasetStatus = v.InferInput<typeof DatasetStatusEnum>;

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
  short_description: v.optional(v.string()),
  file: v.optional(v.any()),
  filePath: v.optional(v.string()),
  file_path: v.optional(v.string()),
});

const UpdateDatasetRequestSchema = v.object({
  name: v.optional(
    v.pipe(v.string(), v.minLength(1), v.maxLength(64), v.regex(DATASET_NAME_REGEX)),
  ),
  short_description: v.optional(v.string()),
});

const UploadDatasetRequestSchema = v.object({
  file: v.optional(v.any()),
  filePath: v.optional(v.string()),
  file_path: v.optional(v.string()),
});

const ListFormatsRequestSchema = v.object({
  offset: v.optional(v.pipe(v.number(), v.minValue(0)), 0),
  limit: v.optional(v.pipe(v.number(), v.minValue(0), v.maxValue(10000)), 100),
});

const ListDataRequestSchema = v.object({
  offset: v.optional(v.pipe(v.number(), v.minValue(0)), 0),
  limit: v.optional(v.pipe(v.number(), v.minValue(0), v.maxValue(10000)), 100),
  name: v.optional(v.nullable(v.pipe(v.string(), v.minLength(1), v.maxLength(64)))),
  type: v.optional(v.nullable(ServiceTypeEnum)),
  format: v.optional(v.nullable(DatasetFormatEnum)),
});

const CreateDataRequestSchema = v.object({
  name: v.pipe(v.string(), v.minLength(1), v.maxLength(64), v.regex(DATASET_NAME_REGEX)),
  type: ServiceTypeEnum,
  format: DatasetFormatEnum,
  short_description: v.optional(v.string()),
  file: v.optional(v.any()),
  filePath: v.optional(v.string()),
  file_path: v.optional(v.string()),
});

const UpdateDataRequestSchema = v.object({
  name: v.optional(
    v.pipe(v.string(), v.minLength(1), v.maxLength(64), v.regex(DATASET_NAME_REGEX)),
  ),
  short_description: v.optional(v.string()),
});

const UploadDataRequestSchema = v.object({
  file: v.optional(v.any()),
  filePath: v.optional(v.string()),
  file_path: v.optional(v.string()),
});

// Download options
export interface DownloadDatasetOptions {
  filePath?: string;
  file_path?: string;
  returnData?: boolean;
  return_data?: boolean;
  chunkSize?: number;
  chunk_size?: number;
}

export interface StreamDownloadDatasetOptions {
  chunkSize?: number;
  chunk_size?: number;
}

// Request types
export type ListDatasetsRequest = v.InferInput<typeof ListDatasetsRequestSchema>;
export type CreateDatasetRequest = v.InferInput<typeof CreateDatasetRequestSchema>;
export type UpdateDatasetRequest = v.InferInput<typeof UpdateDatasetRequestSchema>;
export type UploadDatasetRequest = v.InferInput<typeof UploadDatasetRequestSchema>;
export type ListFormatsRequest = v.InferInput<typeof ListFormatsRequestSchema>;
export type ListDataRequest = v.InferInput<typeof ListDataRequestSchema>;
export type CreateDataRequest = v.InferInput<typeof CreateDataRequestSchema>;
export type UpdateDataRequest = v.InferInput<typeof UpdateDataRequestSchema>;
export type UploadDataRequest = v.InferInput<typeof UploadDataRequestSchema>;

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

export const validateListDataRequest = (data: unknown): ListDataRequest =>
  v.parse(ListDataRequestSchema, data);

export const validateCreateDataRequest = (data: unknown): CreateDataRequest =>
  v.parse(CreateDataRequestSchema, data);

export const validateUpdateDataRequest = (data: unknown): UpdateDataRequest =>
  v.parse(UpdateDataRequestSchema, data);

export const validateUploadDataRequest = (data: unknown): UploadDataRequest =>
  v.parse(UploadDataRequestSchema, data);
