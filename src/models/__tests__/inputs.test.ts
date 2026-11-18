import {
  validateComprehendRequest,
  validateExtractRequest,
  validateExtractRelationsRequest,
  validateExtractSummaryRequest,
  validateInstructItRequest,
} from '../inputs';
import { type AnalyzeTaskClassify, type AnalyzeTaskSpan } from '../models';

describe('Inputs Validation', () => {
  describe('validateComprehendRequest', () => {
    it('should validate valid comprehend request with tasks', () => {
      const parsed = validateComprehendRequest({
        text: 'Apple reported record quarterly revenue.',
        tasks: {
          topic: {
            type: 'classify',
            labels: ['finance', 'sports', 'entertainment'],
          },
        },
      });

      expect(parsed.input).toBe('Apple reported record quarterly revenue.');
      expect(parsed.tasks.topic.type).toBe('classify');
      expect((parsed.tasks.topic as AnalyzeTaskClassify).labels).toEqual([
        'finance',
        'sports',
        'entertainment',
      ]);
    });

    it('should accept optional adapter_id, model_id, and options', () => {
      const parsed = validateComprehendRequest({
        text: 'Sample input',
        tasks: {
          topic: {
            type: 'classify',
            labels: ['label1'],
            threshold: 0.85,
          },
        },
        model_id: 'base-model-v1',
        adapter_id: 'adapter-lora-v2',
        options: { include_usage: true },
      });

      expect((parsed.tasks.topic as AnalyzeTaskClassify).threshold).toBe(0.85);
      expect(parsed.model_id).toBe('base-model-v1');
      expect(parsed.adapter_id).toBe('adapter-lora-v2');
      expect(parsed.options?.include_usage).toBe(true);
    });

    it('should throw TypeError when old "labels" property is passed', () => {
      expect(() =>
        validateComprehendRequest({
          text: 'Some text',
          labels: ['finance'],
        } as unknown),
      ).toThrow(TypeError);

      expect(() =>
        validateComprehendRequest({
          text: 'Some text',
          labels: ['finance'],
        } as unknown),
      ).toThrow(
        "The 'labels' argument has been removed from comprehend.it. Please pass 'tasks' instead.",
      );
    });

    it('should throw when tasks is missing', () => {
      expect(() => validateComprehendRequest({ text: 'Some text' } as unknown)).toThrow();
    });

    it('should throw when threshold is out of range', () => {
      expect(() =>
        validateComprehendRequest({
          text: 'Test',
          tasks: { topic: { type: 'classify', labels: ['test'], threshold: 1.5 } },
        }),
      ).toThrow();
      expect(() =>
        validateComprehendRequest({
          text: 'Test',
          tasks: { topic: { type: 'classify', labels: ['test'], threshold: -0.1 } },
        }),
      ).toThrow();
    });
  });

  describe('validateExtractRequest', () => {
    it('should validate valid extract request with tasks', () => {
      const parsed = validateExtractRequest({
        text: 'Satya Nadella is the CEO of Microsoft.',
        tasks: {
          entities: {
            type: 'span',
            labels: ['person', 'organization'],
          },
        },
      });

      expect(parsed.input).toBe('Satya Nadella is the CEO of Microsoft.');
      expect(parsed.tasks.entities.type).toBe('span');
      expect((parsed.tasks.entities as AnalyzeTaskSpan).labels).toEqual(['person', 'organization']);
    });

    it('should accept optional adapter_id, model_id, and options', () => {
      const parsed = validateExtractRequest({
        text: 'Sample input',
        tasks: {
          entities: {
            type: 'span',
            labels: ['entity1'],
            threshold: 0.7,
            instruction: 'Custom extract instruction',
          },
        },
        adapter_id: 'adapter-extract-lora',
        model_id: 'model-base',
        options: { include_usage: true },
      });

      expect(parsed.adapter_id).toBe('adapter-extract-lora');
      expect(parsed.model_id).toBe('model-base');
      expect((parsed.tasks.entities as AnalyzeTaskSpan).instruction).toBe(
        'Custom extract instruction',
      );
      expect((parsed.tasks.entities as AnalyzeTaskSpan).threshold).toBe(0.7);
    });

    it('should throw TypeError when old "entities" or "labels" property is passed', () => {
      expect(() =>
        validateExtractRequest({
          text: 'Some text',
          entities: ['person'],
        } as unknown),
      ).toThrow(TypeError);

      expect(() =>
        validateExtractRequest({
          text: 'Some text',
          entities: ['person'],
        } as unknown),
      ).toThrow(
        "The 'labels' and 'entities' arguments have been removed from extract.it. Please pass 'tasks' instead.",
      );

      expect(() =>
        validateExtractRequest({
          text: 'Some text',
          labels: ['person'],
        } as unknown),
      ).toThrow(TypeError);
    });

    it('should throw when tasks is missing', () => {
      expect(() =>
        validateExtractRequest({
          text: 'Some text',
        } as unknown),
      ).toThrow();
    });
  });

  describe('validateExtractRelationsRequest', () => {
    it('should validate valid relations request with entities and relations', () => {
      const parsed = validateExtractRelationsRequest({
        text: 'Tim Cook leads Apple located in Cupertino.',
        relations: ['leads', 'located_in'],
        entities: ['person', 'company', 'location'],
      });

      expect(parsed.text).toBe('Tim Cook leads Apple located in Cupertino.');
      expect(parsed.relations).toEqual(['leads', 'located_in']);
      expect(parsed.entities).toEqual(['person', 'company', 'location']);
      expect(parsed.threshold).toBe(0.5);
    });

    it('should accept optional adapter_id, rules, and prompt', () => {
      const parsed = validateExtractRelationsRequest({
        text: 'Tim Cook leads Apple.',
        relations: ['leads'],
        entities: ['person', 'company'],
        adapter_id: 'adapter-relations-1',
        rules: [
          {
            relation: 'leads',
            pairs_filter: [['person', 'company']],
            distance: 10,
          },
        ],
        prompt: 'Extract leadership relations',
      });

      expect(parsed.adapter_id).toBe('adapter-relations-1');
      expect(parsed.rules).toHaveLength(1);
      expect(parsed.rules?.[0].relation).toBe('leads');
      expect(parsed.prompt).toBe('Extract leadership relations');
    });

    it('should throw when entities or relations are missing or empty', () => {
      expect(() =>
        validateExtractRelationsRequest({
          text: 'Some text',
          relations: ['rel1'],
          entities: [],
        }),
      ).toThrow();

      expect(() =>
        validateExtractRelationsRequest({
          text: 'Some text',
          relations: [],
          entities: ['ent1'],
        }),
      ).toThrow();

      expect(() =>
        validateExtractRelationsRequest({
          text: 'Some text',
          relations: ['rel1'],
        }),
      ).toThrow();
    });

    it('should throw when old "labels" property is passed instead of "entities"', () => {
      expect(() =>
        validateExtractRelationsRequest({
          text: 'Some text',
          relations: ['rel1'],
          labels: ['person', 'company'],
        } as unknown),
      ).toThrow();
    });
  });

  describe('validateExtractSummaryRequest', () => {
    it('should validate summary request and accept adapter_id', () => {
      const parsed = validateExtractSummaryRequest({
        text: 'Long document text...',
        adapter_id: 'adapter-summary-v1',
        threshold: 0.6,
      });

      expect(parsed.text).toBe('Long document text...');
      expect(parsed.adapter_id).toBe('adapter-summary-v1');
      expect(parsed.threshold).toBe(0.6);
    });

    it('should throw on empty text', () => {
      expect(() => validateExtractSummaryRequest({ text: '' })).toThrow();
    });
  });

  describe('validateInstructItRequest', () => {
    it('should validate instruct request with text and optional fields', () => {
      const parsed = validateInstructItRequest({
        text: 'Summarize the following document',
        template: 'Standard QA',
        output_type: 'json',
        adapter_id: 'instruct-lora',
        files: [{ name: 'doc.txt' }],
      });

      expect(parsed.text).toBe('Summarize the following document');
      expect(parsed.template).toBe('Standard QA');
      expect(parsed.output_type).toBe('json');
      expect(parsed.adapter_id).toBe('instruct-lora');
      expect(parsed.files).toHaveLength(1);
    });

    it('should accept object template', () => {
      const templateObj = { summary: '', key_points: [] };
      const parsed = validateInstructItRequest({
        text: 'Summarize the following document',
        template: templateObj,
      });

      expect(parsed.text).toBe('Summarize the following document');
      expect(parsed.template).toEqual(templateObj);
    });

    it('should throw when template is missing', () => {
      expect(() =>
        validateInstructItRequest({
          text: 'Summarize the following document',
        } as unknown),
      ).toThrow();
    });

    it('should throw on empty text', () => {
      expect(() => validateInstructItRequest({ text: '', template: 'Standard QA' })).toThrow();
    });
  });
});
