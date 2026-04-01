import { describe, it, expect } from 'vitest';
import { repairLessonSequence } from '../index';

describe('repairLessonSequence', () => {
  it('moves summary to last position if out of place', () => {
    const blocks: any[] = [
      { type: 'hook', id: 'h', order: 0, content: 'Q', hook_style: 'question', analytics_tag: 'hook' },
      { type: 'recap', id: 'r', order: 1, title: 'Recap', points: [] },
      { type: 'core_explanation', id: 'c', order: 2, paragraphs: ['Core.'], analytics_tag: 'core_explanation' },
      { type: 'mental_checkpoint', id: 'm', order: 3, prompt: 'P', checkpoint_style: 'reflection', response_mode: 'reflective', analytics_tag: 'mental_checkpoint' },
      { type: 'teaching_line', id: 't', order: 4, line: 'Key insight in one sentence.', support: 'Support.', analytics_tag: 'teaching_line' },
    ];
    const result = repairLessonSequence(blocks, 'standard');
    expect(result.riskLevel).toBe('low');
    expect(result.blocks[result.blocks.length - 1].type).toBe('recap');
    expect(result.changes.some(c => c.action === 'move' && c.blockType === 'recap')).toBe(true);
  });

  it('injects placeholder hook at position 0 if missing', () => {
    const blocks: any[] = [
      { type: 'core_explanation', id: 'c', order: 0, paragraphs: ['Core.'], analytics_tag: 'core_explanation' },
      { type: 'mental_checkpoint', id: 'm', order: 1, prompt: 'P', checkpoint_style: 'reflection', response_mode: 'reflective', analytics_tag: 'mental_checkpoint' },
      { type: 'teaching_line', id: 't', order: 2, line: 'Key insight here exactly.', support: 'Support.', analytics_tag: 'teaching_line' },
    ];
    const result = repairLessonSequence(blocks, 'standard');
    expect(result.riskLevel).toBe('low');
    expect(result.blocks[0].type).toBe('hook');
    expect((result.blocks[0] as any).is_placeholder).toBe(true);
    expect((result.blocks[0] as any).placeholder_reason).toBe('missing_hook');
    expect((result.blocks[0] as any).repair_injected).toBe(true);
  });

  it('marks high-risk when core_explanation is entirely absent', () => {
    const blocks: any[] = [
      { type: 'hook', id: 'h', order: 0, content: 'Q', hook_style: 'question', analytics_tag: 'hook' },
      { type: 'mental_checkpoint', id: 'm', order: 1, prompt: 'P', checkpoint_style: 'reflection', response_mode: 'reflective', analytics_tag: 'mental_checkpoint' },
      { type: 'teaching_line', id: 't', order: 2, line: 'Key insight here exactly.', support: 'Support.', analytics_tag: 'teaching_line' },
    ];
    const result = repairLessonSequence(blocks, 'standard');
    expect(result.riskLevel).toBe('high');
  });

  it('marks high-risk when more than 3 blocks need reordering', () => {
    const blocks: any[] = [
      { type: 'recap',            id: 'r', order: 0, title: 'Recap', points: [] },
      { type: 'teaching_line',    id: 't', order: 1, line: 'Key insight here.', support: 'Support.', analytics_tag: 'teaching_line' },
      { type: 'mental_checkpoint',id: 'm', order: 2, prompt: 'P', checkpoint_style: 'reflection', response_mode: 'reflective', analytics_tag: 'mental_checkpoint' },
      { type: 'core_explanation', id: 'c', order: 3, paragraphs: ['Core.'], analytics_tag: 'core_explanation' },
      { type: 'hook',             id: 'h', order: 4, content: 'Q', hook_style: 'question', analytics_tag: 'hook' },
    ];
    const result = repairLessonSequence(blocks, 'standard');
    expect(result.riskLevel).toBe('high');
  });
});
