import { describe, it, expect } from 'vitest';
import { validateLessonPedagogy } from '../index';

const VALID_BLOCKS = [
  { type: 'lesson_header', id: 'h', order: 0 },
  { type: 'hook',             id: 'b1', order: 1, content: 'What if?', hook_style: 'question', analytics_tag: 'hook' },
  { type: 'prediction',       id: 'b2', order: 2, question: 'What do you predict?', options: ['A','B','C'], correctIndex: 0, reveal: 'A is correct.' },
  { type: 'core_explanation', id: 'b3', order: 3, paragraphs: ['Core content here.'], analytics_tag: 'core_explanation' },
  { type: 'flow_diagram',     id: 'b4', order: 4, steps: [] },
  { type: 'applied_case',     id: 'b5', order: 5, scenario: 'Real case', challenge: 'c', resolution: 'r' },
  { type: 'mental_checkpoint',id: 'b6', order: 6, prompt: 'How confident?', checkpoint_style: 'confidence_pick', response_mode: 'confidence', options: ['Got it','Mostly','Lost me'], analytics_tag: 'mental_checkpoint' },
  { type: 'quiz',             id: 'b7', order: 7, title: 'Quiz', questions: [] },
  { type: 'teaching_line',    id: 'b8', order: 8, line: 'The model learns from patterns, not rules.', support: 'This is why it generalises.', analytics_tag: 'teaching_line' },
  { type: 'recap',            id: 'b9', order: 9, title: 'Recap', points: [] },
];

describe('validateLessonPedagogy — required presence', () => {
  it('returns valid for a correctly structured lesson', () => {
    const result = validateLessonPedagogy(VALID_BLOCKS as any, 'standard');
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('errors when hook is missing', () => {
    const blocks = VALID_BLOCKS.filter(b => b.type !== 'hook');
    const result = validateLessonPedagogy(blocks as any, 'standard');
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.constraint === 'hook_exists')).toBe(true);
  });

  it('errors when core_explanation is missing', () => {
    const blocks = VALID_BLOCKS.filter(b => b.type !== 'core_explanation');
    const result = validateLessonPedagogy(blocks as any, 'standard');
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.constraint === 'core_explanation_exists')).toBe(true);
  });

  it('errors when teaching_line is missing', () => {
    const blocks = VALID_BLOCKS.filter(b => b.type !== 'teaching_line');
    const result = validateLessonPedagogy(blocks as any, 'standard');
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.constraint === 'teaching_line_exists')).toBe(true);
  });

  it('errors when mental_checkpoint is missing', () => {
    const blocks = VALID_BLOCKS.filter(b => b.type !== 'mental_checkpoint');
    const result = validateLessonPedagogy(blocks as any, 'standard');
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.constraint === 'mental_checkpoint_exists')).toBe(true);
  });
});

describe('validateLessonPedagogy — dependency ordering', () => {
  it('errors when hook appears after position 2 (standard arc)', () => {
    const blocks = [
      { type: 'lesson_header', id: 'h', order: 0 },
      { type: 'text', id: 't', order: 1, paragraphs: [] },
      { type: 'text', id: 't2', order: 2, paragraphs: [] },
      { type: 'hook', id: 'b1', order: 3, content: 'Late hook', hook_style: 'question', analytics_tag: 'hook' },
      { type: 'core_explanation', id: 'b3', order: 4, paragraphs: ['Core.'], analytics_tag: 'core_explanation' },
      { type: 'mental_checkpoint', id: 'b6', order: 5, prompt: 'Check?', checkpoint_style: 'reflection', response_mode: 'reflective', analytics_tag: 'mental_checkpoint' },
      { type: 'teaching_line', id: 'b8', order: 6, line: 'One key idea here.', support: 'Support text.', analytics_tag: 'teaching_line' },
    ];
    const result = validateLessonPedagogy(blocks as any, 'standard');
    expect(result.errors.some(e => e.constraint === 'hook_position_limit')).toBe(true);
  });

  it('allows hook at position 3 for tension_first arc', () => {
    const blocks = [
      { type: 'lesson_header', id: 'h', order: 0 },
      { type: 'concept_illustration', id: 'c', order: 1, concept: 'contrast', description: 'desc', style: 'cycle' },
      { type: 'text', id: 't', order: 2, paragraphs: [] },
      { type: 'hook', id: 'b1', order: 3, content: 'Hook after contrast', hook_style: 'contradiction', analytics_tag: 'hook' },
      { type: 'core_explanation', id: 'b3', order: 4, paragraphs: ['Core.'], analytics_tag: 'core_explanation' },
      { type: 'mental_checkpoint', id: 'b6', order: 5, prompt: 'Check?', checkpoint_style: 'reflection', response_mode: 'reflective', analytics_tag: 'mental_checkpoint' },
      { type: 'teaching_line', id: 'b8', order: 6, line: 'One key idea here.', support: 'Support text.', analytics_tag: 'teaching_line' },
    ];
    const result = validateLessonPedagogy(blocks as any, 'tension_first');
    expect(result.errors.some(e => e.constraint === 'hook_position_limit')).toBe(false);
  });

  it('warns when teaching_line.line exceeds 25 words', () => {
    const blocks = [
      ...VALID_BLOCKS.filter(b => b.type !== 'teaching_line'),
      { type: 'teaching_line', id: 'b8', order: 8,
        line: 'This is a teaching line that is far too long and exceeds the maximum word count of twenty five words allowed by the spec.',
        support: 'Support text.', analytics_tag: 'teaching_line' },
    ];
    const result = validateLessonPedagogy(blocks as any, 'standard');
    expect(result.warnings.some(w => w.constraint === 'teaching_line_length')).toBe(true);
  });

  it('errors when mental_checkpoint uses confidence_pick without options', () => {
    const blocks = [
      ...VALID_BLOCKS.filter(b => b.type !== 'mental_checkpoint'),
      { type: 'mental_checkpoint', id: 'b6', order: 6,
        prompt: 'How confident?', checkpoint_style: 'confidence_pick',
        response_mode: 'confidence', analytics_tag: 'mental_checkpoint' },
    ];
    const result = validateLessonPedagogy(blocks as any, 'standard');
    expect(result.errors.some(e => e.constraint === 'mental_checkpoint_options')).toBe(true);
  });
});
