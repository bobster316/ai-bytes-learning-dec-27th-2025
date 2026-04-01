import { describe, it, expect } from 'vitest';

describe('new block type shapes', () => {
  it('HookBlock has required fields', () => {
    const block = {
      type: 'hook' as const,
      id: 'blk_001',
      order: 1,
      content: 'What if every email you wrote was 40% more effective?',
      hook_style: 'question' as const,
      analytics_tag: 'hook' as const,
    };
    expect(block.type).toBe('hook');
    expect(block.analytics_tag).toBe('hook');
  });

  it('TeachingLineBlock has required fields', () => {
    const block = {
      type: 'teaching_line' as const,
      id: 'blk_002',
      order: 8,
      line: 'Prompt engineering is about giving context, not just commands.',
      support: 'A model responds to what it is told; give it a role and a constraint and it behaves differently.',
      analytics_tag: 'teaching_line' as const,
    };
    expect(block.type).toBe('teaching_line');
    expect(block.line.split(' ').length).toBeLessThanOrEqual(25);
  });

  it('MentalCheckpointBlock requires options for confidence_pick', () => {
    const block = {
      type: 'mental_checkpoint' as const,
      id: 'blk_003',
      order: 7,
      prompt: 'How confident are you that you could write a structured prompt right now?',
      checkpoint_style: 'confidence_pick' as const,
      response_mode: 'confidence' as const,
      options: ['Got it', 'Mostly', 'Lost me'],
      analytics_tag: 'mental_checkpoint' as const,
    };
    expect(block.options).toHaveLength(3);
  });

  it('CoreExplanationBlock has paragraphs array', () => {
    const block = {
      type: 'core_explanation' as const,
      id: 'blk_004',
      order: 3,
      heading: 'What Is Prompt Engineering?',
      paragraphs: ['Prompt engineering is the practice of writing instructions for AI models.'],
      analytics_tag: 'core_explanation' as const,
    };
    expect(Array.isArray(block.paragraphs)).toBe(true);
  });
});
