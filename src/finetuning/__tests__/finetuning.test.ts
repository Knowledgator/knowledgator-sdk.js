import { describe, it, expect } from '@jest/globals';

import {
  type CreateBaseModelRequest,
  type ListModelsRequest,
  type StartTrainingRequest,
  type ListTrainingsRequest,
  type ListEventsRequest,
  type GetMetricsRequest,
  validateCreateBaseModelRequest,
  validateListModelsRequest,
  validateStartTrainingRequest,
  validateListTrainingsRequest,
  validateListEventsRequest,
  validateGetMetricsRequest,
  validateTrainingModel,
  validateListModelsResults,
  validateObjectCreation,
  validateTrainingObject,
  validateListTrainingsResults,
  validateListTagsResults,
  validateListEventsResults,
  validateListMetricsResults,
} from '../index';

describe('Fine-tuning Module', () => {
  describe('Input Validation', () => {
    describe('CreateBaseModelRequest', () => {
      it('should validate valid create base model request', () => {
        const request: CreateBaseModelRequest = {
          name: 'my-base-model',
          type: 'ner',
          description: 'Test model',
        };

        expect(() => validateCreateBaseModelRequest(request)).not.toThrow();
      });

      it('should reject invalid name pattern', () => {
        const request = {
          name: 'invalid@name',
          type: 'ner',
        };

        expect(() => validateCreateBaseModelRequest(request)).toThrow();
      });

      it('should reject invalid service type', () => {
        const request = {
          name: 'my-model',
          type: 'invalid-type',
        };

        expect(() => validateCreateBaseModelRequest(request)).toThrow();
      });
    });

    describe('ListModelsRequest', () => {
      it('should validate valid list models request', () => {
        const request: ListModelsRequest = {
          offset: 0,
          limit: 100,
          name: 'test-model',
          type: 'ner',
          include_base: true,
        };

        expect(() => validateListModelsRequest(request)).not.toThrow();
      });

      it('should accept empty request', () => {
        const request = {};

        expect(() => validateListModelsRequest(request)).not.toThrow();
      });

      it('should reject negative offset', () => {
        const request = {
          offset: -1,
        };

        expect(() => validateListModelsRequest(request)).toThrow();
      });

      it('should reject limit exceeding maximum', () => {
        const request = {
          limit: 10001,
        };

        expect(() => validateListModelsRequest(request)).toThrow();
      });
    });

    describe('StartTrainingRequest', () => {
      it('should validate valid start training request', () => {
        const request: StartTrainingRequest = {
          model_id: 'model-123',
          dataset_id: 'dataset-456',
          hyperparameters: {
            learning_rate: 0.001,
            epochs: 10,
          },
        };

        expect(() => validateStartTrainingRequest(request)).not.toThrow();
      });

      it('should reject invalid model_id pattern', () => {
        const request = {
          model_id: 'a',
          dataset_id: 'dataset-456',
        };

        expect(() => validateStartTrainingRequest(request)).toThrow();
      });

      it('should accept request without hyperparameters', () => {
        const request: StartTrainingRequest = {
          model_id: 'model-123',
          dataset_id: 'dataset-456',
        };

        expect(() => validateStartTrainingRequest(request)).not.toThrow();
      });
    });

    describe('ListTrainingsRequest', () => {
      it('should validate valid list trainings request', () => {
        const request: ListTrainingsRequest = {
          offset: 0,
          limit: 50,
          status: 'completed',
          type: 'ner',
        };

        expect(() => validateListTrainingsRequest(request)).not.toThrow();
      });

      it('should accept null status and type', () => {
        const request: ListTrainingsRequest = {
          status: null,
          type: null,
        };

        expect(() => validateListTrainingsRequest(request)).not.toThrow();
      });
    });

    describe('ListEventsRequest', () => {
      it('should validate valid list events request', () => {
        const request: ListEventsRequest = {
          offset: 10,
          limit: 20,
        };

        expect(() => validateListEventsRequest(request)).not.toThrow();
      });
    });

    describe('GetMetricsRequest', () => {
      it('should validate valid get metrics request', () => {
        const request: GetMetricsRequest = {
          metric: 'loss',
          offset: 0,
          limit: 100,
        };

        expect(() => validateGetMetricsRequest(request)).not.toThrow();
      });

      it('should reject invalid metric value', () => {
        const request = {
          metric: 'accuracy',
        };

        expect(() => validateGetMetricsRequest(request)).toThrow();
      });
    });
  });

  describe('Output Validation', () => {
    describe('TrainingModel', () => {
      it('should validate valid training model', () => {
        const model = {
          id: 'model-123',
          name: 'my-model',
          type: 'ner',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        };

        expect(() => validateTrainingModel(model)).not.toThrow();
      });

      it('should validate model with optional fields', () => {
        const model = {
          id: 'model-123',
          name: 'my-model',
          type: 'ner',
          description: 'Test model',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          is_base: true,
        };

        expect(() => validateTrainingModel(model)).not.toThrow();
      });
    });

    describe('ListModelsResults', () => {
      it('should validate valid list models results', () => {
        const results = {
          models: [
            {
              id: 'model-1',
              name: 'model-1',
              type: 'ner',
              created_at: '2024-01-01T00:00:00Z',
              updated_at: '2024-01-01T00:00:00Z',
            },
          ],
          total: 1,
          offset: 0,
          limit: 100,
        };

        expect(() => validateListModelsResults(results)).not.toThrow();
      });
    });

    describe('ObjectCreation', () => {
      it('should validate valid object creation', () => {
        const creation = {
          id: 'obj-123',
          created_at: '2024-01-01T00:00:00Z',
        };

        expect(() => validateObjectCreation(creation)).not.toThrow();
      });
    });

    describe('TrainingObject', () => {
      it('should validate valid training object', () => {
        const training = {
          id: 'training-123',
          model_id: 'model-456',
          dataset_id: 'dataset-789',
          status: 'completed',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        };

        expect(() => validateTrainingObject(training)).not.toThrow();
      });

      it('should validate training with all optional fields', () => {
        const training = {
          id: 'training-123',
          model_id: 'model-456',
          dataset_id: 'dataset-789',
          status: 'completed',
          hyperparameters: { lr: 0.001 },
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          started_at: '2024-01-01T01:00:00Z',
          completed_at: '2024-01-01T02:00:00Z',
        };

        expect(() => validateTrainingObject(training)).not.toThrow();
      });
    });

    describe('ListTrainingsResults', () => {
      it('should validate valid list trainings results', () => {
        const results = {
          trainings: [
            {
              id: 'training-1',
              model_id: 'model-1',
              dataset_id: 'dataset-1',
              status: 'completed',
              created_at: '2024-01-01T00:00:00Z',
              updated_at: '2024-01-01T00:00:00Z',
            },
          ],
          total: 1,
          offset: 0,
          limit: 100,
        };

        expect(() => validateListTrainingsResults(results)).not.toThrow();
      });
    });

    describe('ListTagsResults', () => {
      it('should validate valid list tags results', () => {
        const results = {
          tags: [
            { name: 'ner', description: 'Named Entity Recognition' },
            { name: 'text-classification' },
          ],
          total: 2,
        };

        expect(() => validateListTagsResults(results)).not.toThrow();
      });
    });

    describe('ListEventsResults', () => {
      it('should validate valid list events results', () => {
        const results = {
          events: [
            {
              id: 'event-1',
              training_id: 'training-123',
              event_type: 'started',
              message: 'Training started',
              created_at: '2024-01-01T00:00:00Z',
            },
          ],
          total: 1,
          offset: 0,
          limit: 100,
        };

        expect(() => validateListEventsResults(results)).not.toThrow();
      });

      it('should validate events with metadata', () => {
        const results = {
          events: [
            {
              id: 'event-1',
              training_id: 'training-123',
              event_type: 'progress',
              message: 'Epoch completed',
              created_at: '2024-01-01T00:00:00Z',
              metadata: { epoch: 1, loss: 0.5 },
            },
          ],
          total: 1,
          offset: 0,
          limit: 100,
        };

        expect(() => validateListEventsResults(results)).not.toThrow();
      });
    });

    describe('ListMetricsResults', () => {
      it('should validate valid list metrics results', () => {
        const results = {
          metric: 'loss',
          data: [
            { step: 1, value: 0.5, timestamp: '2024-01-01T00:00:00Z' },
            { step: 2, value: 0.4, timestamp: '2024-01-01T00:01:00Z' },
          ],
          total: 2,
          offset: 0,
          limit: 100,
        };

        expect(() => validateListMetricsResults(results)).not.toThrow();
      });
    });

    describe('Resilient Aliases and Backend Key Variations', () => {
      it('should parse TrainingObject with training_id, parent_model_id, last_updated_at, args, and nested training.dataset_id', () => {
        const rawBackendData = {
          training_id: 'tr-999',
          name: 'my-training-run',
          parent_model_id: 'm-base-1',
          training: {
            dataset_id: 'ds-nested-888',
            args: { lr: 0.0001, batch_size: 16 },
          },
          status: 'running',
          created_at: '2024-02-01T10:00:00Z',
          last_updated_at: '2024-02-01T10:05:00Z',
        };

        const parsed = validateTrainingObject(rawBackendData);
        expect(parsed.id).toBe('tr-999');
        expect(parsed.model_id).toBe('m-base-1');
        expect(parsed.dataset_id).toBe('ds-nested-888');
        expect(parsed.updated_at).toBe('2024-02-01T10:05:00Z');
        expect(parsed.hyperparameters).toEqual({ lr: 0.0001, batch_size: 16 });
      });

      it('should parse TrainingModel with model_id alias', () => {
        const rawModel = {
          model_id: 'm-custom-42',
          name: 'custom-ner-model',
          type: 'ner',
          created_at: '2024-01-01T00:00:00Z',
        };

        const parsed = validateTrainingModel(rawModel);
        expect(parsed.id).toBe('m-custom-42');
        expect(parsed.name).toBe('custom-ner-model');
      });

      it('should parse ObjectCreation with training_id alias', () => {
        const rawCreation = {
          training_id: 'tr-created-1',
        };

        const parsed = validateObjectCreation(rawCreation);
        expect(parsed.id).toBe('tr-created-1');
      });

      it('should parse ListModelsResults with results alias', () => {
        const rawList = {
          results: [{ model_id: 'm-1', name: 'model 1' }],
        };

        const parsed = validateListModelsResults(rawList);
        expect(parsed.models.length).toBe(1);
        expect(parsed.models[0].id).toBe('m-1');
        expect(parsed.total).toBe(1);
      });

      it('should parse ListTrainingsResults with results alias', () => {
        const rawList = {
          results: [{ training_id: 'tr-1', status: 'completed' }],
        };

        const parsed = validateListTrainingsResults(rawList);
        expect(parsed.trainings.length).toBe(1);
        expect(parsed.trainings[0].id).toBe('tr-1');
        expect(parsed.total).toBe(1);
      });

      it('should parse ListTagsResults with types alias', () => {
        const rawList = {
          types: [{ name: 'ner' }, { name: 'comprehend' }],
        };

        const parsed = validateListTagsResults(rawList);
        expect(parsed.tags.length).toBe(2);
        expect(parsed.total).toBe(2);
      });

      it('should parse TrainingEvent with type and timestamp aliases', () => {
        const rawEvent = {
          id: 'ev-1',
          training_id: 'tr-1',
          type: 'checkpoint_saved',
          message: 'Saved model weights',
          timestamp: '2024-01-01T12:00:00Z',
        };

        const parsed = validateListEventsResults({ events: [rawEvent] });
        expect(parsed.events[0].event_type).toBe('checkpoint_saved');
        expect(parsed.events[0].created_at).toBe('2024-01-01T12:00:00Z');
      });

      it('should parse ListMetricsResults with values alias', () => {
        const rawMetrics = {
          metric: 'loss',
          values: [{ step: 10, value: 0.12 }],
        };

        const parsed = validateListMetricsResults(rawMetrics);
        expect(parsed.data.length).toBe(1);
        expect(parsed.data[0].step).toBe(10);
        expect(parsed.data[0].value).toBe(0.12);
      });
    });
  });
});
