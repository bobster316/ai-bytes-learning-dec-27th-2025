import { describe, it, expect } from 'vitest';
import { ARC_DEFINITIONS } from '../arc-definitions';

describe('arc override integrity', () => {
  it('only tension_first and exploratory have sequenceOverride', () => {
    const overrideArcs = Object.entries(ARC_DEFINITIONS)
      .filter(([, def]) => def.sequenceOverride && def.sequenceOverride.length > 0)
      .map(([name]) => name);
    expect(overrideArcs.sort()).toEqual(['exploratory', 'tension_first']);
  });

  it('tension_first override allows contrast_before_hook', () => {
    const overrides = ARC_DEFINITIONS.tension_first.sequenceOverride ?? [];
    const cbh = overrides.find(o => o.constraint === 'contrast_before_hook');
    expect(cbh).toBeDefined();
    expect((cbh as any).newParams.allowed).toBe(true);
  });

  it('tension_first sets hook max position to 3', () => {
    const overrides = ARC_DEFINITIONS.tension_first.sequenceOverride ?? [];
    const hpl = overrides.find(o => o.constraint === 'hook_position_limit');
    expect(hpl).toBeDefined();
    expect((hpl as any).newParams.maxPosition).toBe(3);
  });

  it('exploratory sets hook max position to 4', () => {
    const overrides = ARC_DEFINITIONS.exploratory.sequenceOverride ?? [];
    const hpl = overrides.find(o => o.constraint === 'hook_position_limit');
    expect(hpl).toBeDefined();
    expect((hpl as any).newParams.maxPosition).toBe(4);
  });

  it('all arcs have beats array', () => {
    for (const [name, def] of Object.entries(ARC_DEFINITIONS)) {
      expect(Array.isArray(def.beats), `${name} must have beats array`).toBe(true);
    }
  });
});
