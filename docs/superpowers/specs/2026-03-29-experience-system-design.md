# AI Bytes Learning — Experience System Design

> Status: APPROVED — 29 March 2026
> Approved by: Product owner (see brainstorming session)

## Vision

Transform AI Bytes Learning from a **design system** (what should this look like?) into an **experience system** (what should the learner feel right now?). Every visual decision is subordinate to a pedagogical and emotional intent. The platform conducts learners through scored experiences — not templated pages.

---

## Architecture: Five Nested Levels

```
Course DNA (the universe)
    └── Module DNA (the district)            ← NEW
            └── The Conductor (the journey)  ← NEW
                    └── Lesson DNA (the moment)
                            └── Block Expression (the instruments)
```

Each level is **subordinate** to the one above. A Stark lesson personality cannot override a Warm archetype course. A climax module cannot override a futuristic course's contemplative pacing. Hierarchy is law.

---

## Level 1: Course DNA (Expanded)

### Purpose
The course's permanent visual universe. Deterministic from `SHA-256(courseId:title:difficulty)`, optionally biased by topic tags.

### Dimensions (expanded from current)

| Dimension | Current | Target |
|-----------|---------|--------|
| Archetypes | 6 | 18 |
| Colour palettes | 12 | 48 |
| Typography systems | 3 | 10 |
| Background treatments | 4 | 8 |
| Layout densities | 3 | 6 |
| Section dividers | 3 | 7 |
| **Total combinations** | **7,776** | **~1.7 billion** |

### New Archetypes (additions to existing 6)
`quantum_terminal`, `editorial_noir`, `thermal_amber`, `arctic_glass`, `void_minimal`, `neon_bloom`, `narrative_arc`, `data_dense`, `scientific`, `story_world`, `expressive`, `modular`

### New Palettes (additions to existing 12)
4 families: Neon Dark (8 palettes), Deep Earth (8), Pastel Night (8), Mono Accent (8). All contrast-tested, accessibility-verified.

### New Typography Systems (additions to existing 3)
`kinetic`, `brutalist`, `editorial`, `geometric`, `humanist`, `cinematic_title`, `technical_mono`, `expressive_variable` — 7 additions.

### New Background Treatments (additions to existing 4)
`noise_film`, `aurora_glow`, `topographic_lines`, `void_particle` — 4 additions.

### Semantic Bias (NEW)
When a course has `topic_tags`, the DNA generation biases (not forces) archetype/palette selection:

| Domain | Archetype bias | Palette bias | Personality bias |
|--------|---------------|-------------|----------------|
| AI Safety / Cybersecurity | quantum_terminal | arctic_blue, slate_mono | technical, stark |
| Leadership / Strategy | editorial_noir | gold_ink, iris_violet | cinematic, warm |
| Data / Analytics | scientific | arctic_blue, slate_mono | calm, technical |
| Futures / Innovation | futuristic, neon_bloom | pulse_teal, rose_glass | electric, cinematic |
| Ethics / Policy | provocateur | amber_fire, nova_crimson | stark |
| Engineering / Code | modular, void_minimal | lime_tech, arctic_blue | calm, technical |

Bias weight: 40% toward the biased archetypes/palettes, 60% still random from full pool. Never deterministic — just nudged.

---

## Level 2: Module DNA (NEW)

### Purpose
Each module has its own visual district within the course universe. Learners feel they are moving through chapters of a world, not clicking identical wrappers.

### Dimensions

| Dimension | Options | Derivation |
|-----------|---------|-----------|
| Module mood | opening / building / climax / resolution | `moduleIndex / totalModules` position |
| Hue shift | ±0°, ±12°, ±24° from course primary | `moduleIndex % 3` |
| Header style | 5 variants | `moduleIndex % 5` |
| Diagram complexity bias | simple / standard / complex | module mood |
| Interaction density | low / medium / high | module mood |
| Animation speed | slow / normal / fast | module mood |
| Copy tone | accessible / precise / dense | module mood |

### Module Mood Mapping
```
Module position 0–25%  → opening    (airy, spacious, welcoming)
Module position 25–55% → building   (denser, more complex)
Module position 55–80% → climax     (high contrast, maximum complexity)
Module position 80–100% → resolution (warm, settled, reflective)
```

### Behavioural Influence (not just visual)
- **opening**: `interaction_density: low`, `animation_speed: slow`, `diagram_complexity: simple`
- **building**: `interaction_density: medium`, `animation_speed: normal`, `diagram_complexity: standard`
- **climax**: `interaction_density: high`, `animation_speed: fast`, `diagram_complexity: complex`
- **resolution**: `interaction_density: low`, `animation_speed: slow`, `diagram_complexity: standard`

### Module Entry Transition
When navigating between modules: 400ms dark-field fade (bg → #000 → new module bg). The atmospheric shift makes the district change perceptible without exposition.

### DB Change
`course_topics` table: add `module_dna JSONB` column.

---

## Level 3: The Conductor — Lesson Rhythm Engine (NEW)

### Purpose
The orchestration intelligence. Sits between Module DNA and Lesson DNA. Reads context, selects arc type, enforces anti-chaos rules, places signature moments, builds the `conductorNotes` string injected into the LessonExpanderAgent prompt.

### Arc Types (4 variants — conductor selects per lesson)

| Arc | Beat Sequence | Use Case |
|-----|--------------|---------|
| **Micro** | Calm → Insight → Reward | Short lessons, post-heavy lessons, opening module |
| **Standard** | Calm → Building → Tension → Insight → Reward | Default — most lessons |
| **Tension-First** | Tension → Building → Insight → Reward | Advanced lessons, climax module, provocateur archetype |
| **Exploratory** | Calm → Building → Building → Insight | Discovery-focused lessons, early module, no hard friction |

### Arc Selection Logic
1. If previous lesson ended at intensity > 0.7 → Micro or Exploratory (decompress)
2. Module mood = opening → Micro
3. Module mood = climax + provocateur archetype → Tension-First
4. Module mood = resolution → Exploratory
5. Lesson position < 30% in module → Exploratory
6. Lesson position > 70% in building module → Tension-First
7. Default → Standard

### Block Emotional Weights

| Beat | Intensity | Block Types |
|------|-----------|------------|
| Calm | 0.1 | lesson_header, objective, text |
| Building | 0.4 | type_cards, flow_diagram, image_text_row, instructor_insight, industry_tabs, perspective_toggle, world_stage |
| Tension | 0.8 | signal_interrupt, tension_arc, contrast_duel, myth_buster, prediction |
| Insight | 0.7 | cinematic_moment, neural_map, applied_case, depth_charge, punch_quote, animated_stat |
| Reward | 0.3 | recap, quiz, key_terms, completion, time_capsule, go_deeper |

### Anti-Chaos Rules (Hard Constraints)

1. **Dramatic budget**: Max 2 blocks with intensity ≥ 0.7 per lesson
2. **No consecutive drama**: Blocks with intensity ≥ 0.7 must have ≥ 2 lower-intensity blocks between them
3. **Block count**: Minimum 8 blocks, maximum 16, target 10–13
4. **No back-to-back attention hijackers**: `signal_interrupt`, `cinematic_moment`, `tension_arc` cannot be adjacent
5. **Typography lock**: Typography system is course-level — never changes
6. **Colour volatility cap**: Lesson accent stays within ±15° hue of module accent
7. **Personality hierarchy**: Lesson personality must be compatible with course archetype (see compatibility matrix)
8. **Neural Map**: Maximum 1 per course — must be in insight beat of a building/climax module
9. **Time Capsule**: Maximum 1 per course — must be in lesson 1–4 (globally)
10. **Cinematic Moment**: Maximum 1 per course — climax module only

### Lesson Personality Compatibility Matrix

| Course Archetype | Allowed Personalities |
|-----------------|----------------------|
| clinical | calm, technical |
| bold | electric, stark, technical |
| warm | warm, calm |
| futuristic | electric, cinematic, technical |
| story_driven | cinematic, warm |
| provocateur | stark, electric |
| quantum_terminal | technical, stark |
| editorial_noir | cinematic, warm |
| void_minimal | calm, stark |
| neon_bloom | electric, cinematic |
| (others) | calm, electric, cinematic, technical, warm, stark |

### Signature Moment System

Each course has 2–4 reserved signature moment **slots**. The Conductor decides if/when each fires.

| Moment Type | Beat | Earliest Global Lesson | Module Mood | Max Per Course | Purpose |
|-------------|------|----------------------|------------|----------------|---------|
| `time_capsule` | reward | 0 | opening / building | 1 | Create expectation early |
| `neural_map` | insight | 2 | building / climax | 1 | Mid-course consolidation |
| `cinematic_moment` | insight | 1 | climax | 1 | Breakthrough concept dramatisation |
| `signal_interrupt` | tension | 2 | building / climax | 1 | Force comprehension at a critical moment |

Signature moments feel like **events**, not components. They are withheld from all other lessons to preserve impact.

### Conductor Memory Model

The Conductor remembers across lessons within a single course generation run. Memory is also persisted to `course_lessons.conductor_memory JSONB` for future regeneration.

```typescript
interface ConductorMemory {
  previousLessonEndIntensity: number;        // 0–1 scale
  firedSignatureMoments: SignatureMomentType[];
  recentBlockTypeHistory: string[][];        // last 3 lessons' block types (prevents type repetition)
}
```

Memory updates after each lesson:
- `previousLessonEndIntensity` ← intensity of last block in previous lesson
- `firedSignatureMoments` ← append if a signature moment was placed
- `recentBlockTypeHistory` ← shift (keep last 3 only)

### ConductorNotes (Prompt Injection)

The Conductor builds a `conductorNotes` string injected into the LessonExpanderAgent system prompt:

```
LESSON RHYTHM DIRECTIVE:
Arc type: [arcType] — [description]
Emotional sequence: [beat1] → [beat2] → ...
Lesson personality: [personality]
Dramatic budget: max [n] high-intensity blocks
[If signature moment]: Place a [type] block at the [beat] beat. This is a course-level signature moment — treat it with exceptional care.
Do not use these block types (used in recent lessons): [list]
The previous lesson ended at intensity [n]. This lesson should open [quieter/at similar energy].
```

---

## Level 4: Lesson DNA (Expanded)

### Lesson Accent Cycle (expanded from 4 to 12)
```typescript
const LESSON_ACCENT_CYCLE = [
  "#00FFB3", // pulse teal
  "#9B8FFF", // iris violet
  "#FFB347", // amber
  "#FF6B6B", // nova red
  "#5BC8F5", // arctic blue
  "#D4A840", // gold
  "#7EC8A4", // sage
  "#FF8C69", // coral
  "#B8E840", // lime
  "#F8A4C8", // rose
  "#2EC4F0", // deep ocean
  "#8B94B8", // slate
] as const;
```

### Lesson Visual Personalities (6)
Each personality modulates the visual character of ALL 10 rotating block components:

| Personality | Block Mode Bias | Spacing | Animation | Typography Weight |
|------------|----------------|---------|-----------|-----------------|
| calm | mode 0 (understated) | spacious | slow, gentle | light |
| electric | mode 1 (high-contrast) | tight | fast, sharp | heavy |
| cinematic | mode 2 (dramatic) | spacious | sweeping | variable |
| technical | mode 0 (precise) | balanced | minimal | mono |
| warm | mode 1 (approachable) | balanced | soft | medium |
| stark | mode 2 (minimal) | tight | none | bold |

### Block Layout Modes (expanded from 3 to 8)
All 10 rotating block components gain 8 genuinely distinct visual layouts. Each layout is a completely different design approach to the same content — not a variation of the same template.

### Micro-Variation Seeding
Each lesson gets a `microVariationSeed` integer (derived from course ID + lesson position). This drives:
- Border-radius noise: 8–20px range
- Glow intensity: 0.06–0.18 range
- Spacing offsets: ±4px on non-critical padding
- SectionDivider opacity: 0.08–0.18 range

---

## Level 5: Block Expression (Expanded)

### New Block Types (15 additions — 22 → 37 total)

| Block Type | Beat | Category | Priority |
|-----------|------|----------|----------|
| `cinematic_moment` | insight | Cinematic | Tier 1 (signature) |
| `neural_map` | insight | Cinematic | Tier 1 (signature) |
| `signal_interrupt` | tension | Interactive | Tier 1 (signature) |
| `time_capsule` | reward | Interactive | Tier 1 (signature) |
| `tension_arc` | tension | Cinematic | Tier 2 |
| `depth_charge` | insight | Interactive | Tier 2 |
| `contrast_duel` | tension | Interactive | Tier 2 |
| `myth_buster` | tension | Interactive | Tier 2 |
| `perspective_toggle` | building | Interactive | Tier 2 |
| `animated_stat` | insight | Data | Tier 3 |
| `reality_anchor` | building | Data | Tier 3 |
| `code_cinema` | building | Cinematic | Tier 3 |
| `quote_mosaic` | insight | Cinematic | Tier 3 |
| `scroll_story` | building | Cinematic | Tier 3 |
| `world_stage` | building | Data | Tier 3 |

### DB Change
All 15 new block types added to `lesson-blocks.ts` union type and `content-sanitizer.ts` TYPE_MAP.

---

## Performance Budget

Performance is a **Phase 1 constraint**, not Phase 5 afterthought.

| Rule | Constraint |
|------|-----------|
| Simultaneously animated elements | Max 3 per viewport |
| Heavy blocks (Neural Map, Scroll Story, World Stage, Code Cinema) | Dynamic import(), never in initial bundle |
| All animated blocks | Intersection Observer activated — no off-screen animation |
| CLS | All blocks declare min-height before content loads |
| Next lesson preload | Idle-time prefetch of next lesson's heavy block JS |
| Conductor DNA computation | All decisions made at generation time, stored to DB — never computed at render time |
| Reduced motion | `prefers-reduced-motion` disables all non-essential animations globally |

---

## Implementation Phases

| Phase | Name | Delivers |
|-------|------|---------|
| 1 | The Conductor | Rhythm engine, arc types, anti-chaos rules, signature moments, memory model, prompt injection |
| 2 | Module DNA | Missing middle — module mood, hue shift, header variants, behavioural influence, entry transition |
| 3 | Semantic Matching + DNA Expansion | Topic tag bias, 48 palettes, 18 archetypes, 10 typography, 8 bg treatments |
| 4 | New Block Types | All 15 new components, 8 layout modes per existing block, micro-variation seeding |
| 5 | Performance | Code-splitting, lazy activation, animation budget, next-lesson preload |

Each phase ships independently and is testable in production without the next phase being complete.

---

## Files Overview (All Phases)

### Phase 1: Conductor
| File | Action | Purpose |
|------|--------|---------|
| `lib/ai/conductor/types.ts` | Create | All Conductor TypeScript types |
| `lib/ai/conductor/arc-definitions.ts` | Create | Beat sequences for all 4 arc types |
| `lib/ai/conductor/block-weights.ts` | Create | Block type → intensity mapping |
| `lib/ai/conductor/arc-selector.ts` | Create | selectArcType() logic |
| `lib/ai/conductor/signature-moments.ts` | Create | Signature moment rules + selector |
| `lib/ai/conductor/personality.ts` | Create | Lesson personality selector + compatibility matrix |
| `lib/ai/conductor/index.ts` | Create | Main conduct() function |
| `lib/ai/agent-system-v2.ts` | Modify | Inject ConductorContext + wire conductorNotes into LessonExpanderAgent |
| `supabase/migrations/20260329_conductor_fields.sql` | Create | Add arc_type, lesson_personality, micro_variation_seed to course_lessons |

### Phase 2: Module DNA
| File | Action | Purpose |
|------|--------|---------|
| `lib/ai/generate-module-dna.ts` | Create | generateModuleDNA() |
| `components/course/module-dna-provider.tsx` | Create | ModuleDNAContext |
| `supabase/migrations/20260329_module_dna.sql` | Create | Add module_dna JSONB to course_topics |
| `app/courses/[courseId]/layout.tsx` | Modify | Fetch + provide module DNA |
| `components/course/module-entry-transition.tsx` | Create | Dark-field transition between modules |

### Phase 3: DNA Expansion
| File | Action | Purpose |
|------|--------|---------|
| `lib/ai/course-dna-catalogue.ts` | Modify | Expand to 18 archetypes, 48 palettes, 10 typography, 8 bg treatments |
| `lib/ai/generate-course-dna.ts` | Modify | Add semantic bias logic |
| `supabase/migrations/20260329_topic_tags.sql` | Create | Add topic_tags TEXT[] to courses |

### Phase 4: New Blocks
| File | Action | Purpose |
|------|--------|---------|
| `lib/types/lesson-blocks.ts` | Modify | Add 15 new block type definitions |
| `lib/ai/content-sanitizer.ts` | Modify | Add new types to TYPE_MAP + repair rules |
| `components/course/blocks/cinematic-moment.tsx` | Create | Signature — full-viewport takeover |
| `components/course/blocks/neural-map.tsx` | Create | Signature — live concept graph |
| `components/course/blocks/signal-interrupt.tsx` | Create | Signature — forced reflection gate |
| `components/course/blocks/time-capsule.tsx` | Create | Signature — cross-lesson prediction |
| `components/course/blocks/tension-arc.tsx` | Create | Tier 2 |
| `components/course/blocks/depth-charge.tsx` | Create | Tier 2 |
| `components/course/blocks/contrast-duel.tsx` | Create | Tier 2 |
| `components/course/blocks/myth-buster.tsx` | Create | Tier 2 |
| `components/course/blocks/perspective-toggle.tsx` | Create | Tier 2 |
| `components/course/blocks/animated-stat.tsx` | Create | Tier 3 |
| `components/course/blocks/reality-anchor.tsx` | Create | Tier 3 |
| `components/course/blocks/code-cinema.tsx` | Create | Tier 3 |
| `components/course/blocks/quote-mosaic.tsx` | Create | Tier 3 |
| `components/course/blocks/scroll-story.tsx` | Create | Tier 3 |
| `components/course/blocks/world-stage.tsx` | Create | Tier 3 |
| `components/course/block-renderer.tsx` | Modify | Register all 15 + wire micro-variation seed |
| `supabase/migrations/20260329_time_capsule.sql` | Create | user_predictions table for Time Capsule |
