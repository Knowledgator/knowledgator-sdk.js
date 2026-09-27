import * as v from 'valibot';

// Response schemas
const DatasetSchema = v.pipe(
  v.object({
    id: v.string(),
    name: v.string(),
    type: v.string(),
    format: v.optional(v.string(), 'json'),
    status: v.optional(v.string(), 'ready'),
    description: v.optional(v.string()),
    short_description: v.optional(v.string()),
    created_at: v.optional(v.string(), ''),
    updated_at: v.optional(v.string(), ''),
    file_count: v.optional(v.number()),
    total_size: v.optional(v.number()),
    examples_count: v.optional(v.number()),
  }),
  v.transform((dataset) => ({
    ...dataset,
    description: dataset.description ?? dataset.short_description,
  })),
);

const ListDatasetsResultsSchema = v.pipe(
  v.object({
    data: v.optional(v.array(DatasetSchema)),
    datasets: v.optional(v.array(DatasetSchema)),
    total: v.number(),
    offset: v.optional(v.number(), 0),
    limit: v.optional(v.number(), 100),
  }),
  v.transform((raw) => ({
    datasets: raw.data ?? raw.datasets ?? [],
    total: raw.total,
    offset: raw.offset,
    limit: raw.limit,
  })),
);

const DatasetCreationResultsSchema = v.object({
  id: v.string(),
  name: v.optional(v.string()),
  type: v.optional(v.string()),
  format: v.optional(v.string()),
  status: v.optional(v.string()),
  created_at: v.optional(v.string()),
});

const FormatTagSchema = v.object({
  name: v.string(),
  description: v.optional(v.string()),
});

const FormatItemSchema = v.union([v.string(), FormatTagSchema]);

const ListFormatsResultsSchema = v.pipe(
  v.object({
    data: v.optional(v.array(FormatItemSchema)),
    formats: v.optional(v.array(FormatItemSchema)),
    total: v.number(),
    offset: v.optional(v.number(), 0),
    limit: v.optional(v.number(), 100),
  }),
  v.transform((raw) => {
    const items = raw.data ?? raw.formats ?? [];
    const formats = items.map((item) => (typeof item === 'string' ? { name: item } : item));
    return {
      formats,
      total: raw.total,
      offset: raw.offset,
      limit: raw.limit,
    };
  }),
);

const DataSchema = v.object({
  id: v.string(),
  name: v.string(),
  type: v.string(),
  format: v.string(),
  description: v.optional(v.string()),
  created_at: v.string(),
  updated_at: v.string(),
  file_count: v.optional(v.number()),
  total_size: v.optional(v.number()),
});

const ListDataResultsSchema = v.object({
  data: v.array(DataSchema),
  total: v.number(),
  offset: v.optional(v.number(), 0),
  limit: v.optional(v.number(), 100),
});

const DataCreationResultsSchema = v.object({
  id: v.string(),
  status: v.optional(v.string()),
});

// Response types
export type Dataset = v.InferOutput<typeof DatasetSchema>;
export type ListDatasetsResults = v.InferOutput<typeof ListDatasetsResultsSchema>;
export type DatasetCreationResults = v.InferOutput<typeof DatasetCreationResultsSchema>;
export type ListFormatsResults = v.InferOutput<typeof ListFormatsResultsSchema>;
export type Data = v.InferOutput<typeof DataSchema>;
export type ListDataResults = v.InferOutput<typeof ListDataResultsSchema>;
export type DataCreationResults = v.InferOutput<typeof DataCreationResultsSchema>;

// Validators
export const validateDataset = (data: unknown): Dataset => v.parse(DatasetSchema, data);

export const validateListDatasetsResults = (data: unknown): ListDatasetsResults =>
  v.parse(ListDatasetsResultsSchema, data);

export const validateDatasetCreationResults = (data: unknown): DatasetCreationResults =>
  v.parse(DatasetCreationResultsSchema, data);

export const validateListFormatsResults = (data: unknown): ListFormatsResults =>
  v.parse(ListFormatsResultsSchema, data);

export const validateData = (data: unknown): Data => v.parse(DataSchema, data);

export const validateListDataResults = (data: unknown): ListDataResults =>
  v.parse(ListDataResultsSchema, data);

export const validateDataCreationResults = (data: unknown): DataCreationResults =>
  v.parse(DataCreationResultsSchema, data);
