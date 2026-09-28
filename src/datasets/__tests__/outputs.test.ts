import {
  validateListDatasetsResults,
  validateListFormatsResults,
  validateListDataResults,
} from '../outputs';

describe('Datasets Outputs Validation', () => {
  describe('ListDatasetsResultsSchema', () => {
    it('should parse server payload containing "data" array and short_description', () => {
      const serverPayload = {
        total: 1,
        data: [
          {
            id: '6babd48a-2256-4466-b16b-9fd45ba59688',
            name: 'Comprehend-it Dataset',
            type: 'comprehend-it',
            format: 'json',
            short_description: 'Dataset short description',
            created_by: 'user_123',
            created_at: '2026-07-29T09:31:41Z',
            updated_at: '2026-07-29T09:31:41Z',
            examples_count: 100,
            status: 'valid',
          },
        ],
      };

      const result = validateListDatasetsResults(serverPayload);
      expect(result.total).toBe(1);
      expect(result.offset).toBe(0);
      expect(result.limit).toBe(100);
      expect(result.datasets).toHaveLength(1);
      expect(result.datasets[0].id).toBe('6babd48a-2256-4466-b16b-9fd45ba59688');
      expect(result.datasets[0].description).toBe('Dataset short description');
    });

    it('should parse legacy payload containing "datasets" array', () => {
      const legacyPayload = {
        total: 1,
        offset: 0,
        limit: 20,
        datasets: [
          {
            id: 'ds-123',
            name: 'Test Dataset',
            type: 'text-classification',
            format: 'jsonl',
            status: 'ready',
            description: 'Explicit description',
            created_at: '2026-01-01T00:00:00Z',
            updated_at: '2026-01-01T00:00:00Z',
          },
        ],
      };

      const result = validateListDatasetsResults(legacyPayload);
      expect(result.total).toBe(1);
      expect(result.datasets[0].description).toBe('Explicit description');
    });
  });

  describe('ListFormatsResultsSchema', () => {
    it('should parse server payload containing string array in "data"', () => {
      const serverPayload = {
        total: 1,
        data: ['json', 'csv'],
      };

      const result = validateListFormatsResults(serverPayload);
      expect(result.total).toBe(1);
      expect(result.formats).toEqual([{ name: 'json' }, { name: 'csv' }]);
    });

    it('should parse legacy payload containing FormatTag objects in "formats"', () => {
      const legacyPayload = {
        total: 2,
        offset: 0,
        limit: 10,
        formats: [{ name: 'json', description: 'JSON format' }, { name: 'parquet' }],
      };

      const result = validateListFormatsResults(legacyPayload);
      expect(result.total).toBe(2);
      expect(result.formats[0]).toEqual({ name: 'json', description: 'JSON format' });
    });
  });

  describe('ListDataResultsSchema', () => {
    it('should parse server payload containing data items with short_description and files', () => {
      const serverPayload = {
        total: 1,
        data: [
          {
            id: 'data-xyz',
            name: 'Sample Raw Data',
            type: 'comprehend-it',
            format: 'json',
            short_description: 'Raw data short description',
            created_by_oauth_id: 'oauth-user-123',
            created_at: '2026-09-01T00:00:00Z',
            updated_at: '2026-09-01T00:00:00Z',
            files: [
              {
                id: 'file-1',
                created_by_oauth_id: 'oauth-user-123',
                created_at: '2026-09-01T00:00:00Z',
                updated_at: '2026-09-01T00:00:00Z',
                size: 1024,
              },
            ],
          },
        ],
      };

      const result = validateListDataResults(serverPayload);
      expect(result.total).toBe(1);
      expect(result.offset).toBe(0);
      expect(result.limit).toBe(100);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe('data-xyz');
      expect(result.data[0].description).toBe('Raw data short description');
      expect(result.data[0].files).toHaveLength(1);
      expect(result.data[0].files![0].size).toBe(1024);
    });
  });
});
