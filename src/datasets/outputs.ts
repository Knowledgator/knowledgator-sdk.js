import * as v from 'valibot';

// Response schemas
const DatasetSchema = v.object({
  id: v.string(),
  name: v.string(),
  type: v.string(),
  format: v.string(),
  status: v.string(),
  description: v.optional(v.string()),
  created_at: v.string(),
  updated_at: v.string(),
  file_count: v.optional(v.number()),
  total_size: v.optional(v.number()),
});

const ListDatasetsResultsSchema = v.object({
  datasets: v.array(DatasetSchema),
  total: v.number(),
  offset: v.number(),
  limit: v.number(),
});

const DatasetCreationResultsSchema = v.object({
  id: v.string(),
  name: v.string(),
  type: v.string(),
  format: v.string(),
  status: v.string(),
  created_at: v.string(),
});

const FormatTagSchema = v.object({
  name: v.string(),
  description: v.optional(v.string()),
});

const ListFormatsResultsSchema = v.object({
  formats: v.array(FormatTagSchema),
  total: v.number(),
  offset: v.number(),
  limit: v.number(),
});

// Response types
export type Dataset = v.InferOutput<typeof DatasetSchema>;
export type ListDatasetsResults = v.InferOutput<typeof ListDatasetsResultsSchema>;
export type DatasetCreationResults = v.InferOutput<typeof DatasetCreationResultsSchema>;
export type ListFormatsResults = v.InferOutput<typeof ListFormatsResultsSchema>;

// Validators
export const validateDataset = (data: unknown): Dataset => v.parse(DatasetSchema, data);

export const validateListDatasetsResults = (data: unknown): ListDatasetsResults =>
  v.parse(ListDatasetsResultsSchema, data);

export const validateDatasetCreationResults = (data: unknown): DatasetCreationResults =>
  v.parse(DatasetCreationResultsSchema, data);

export const validateListFormatsResults = (data: unknown): ListFormatsResults =>
  v.parse(ListFormatsResultsSchema, data);
