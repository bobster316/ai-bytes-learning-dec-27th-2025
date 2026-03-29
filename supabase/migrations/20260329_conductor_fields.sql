-- supabase/migrations/20260329_conductor_fields.sql
-- Adds Conductor output fields to course_lessons.
-- arc_type and lesson_personality are used by the renderer.
-- micro_variation_seed drives seeded noise in block components.
-- conductor_memory stores the memory snapshot used to generate this lesson
-- (useful for debugging and lesson regeneration with correct context).

ALTER TABLE course_lessons
    ADD COLUMN IF NOT EXISTS arc_type TEXT,
    ADD COLUMN IF NOT EXISTS lesson_personality TEXT,
    ADD COLUMN IF NOT EXISTS micro_variation_seed INTEGER,
    ADD COLUMN IF NOT EXISTS conductor_memory JSONB;

-- Indexes for potential future filtering/analytics
CREATE INDEX IF NOT EXISTS idx_course_lessons_arc_type
    ON course_lessons (arc_type);

CREATE INDEX IF NOT EXISTS idx_course_lessons_personality
    ON course_lessons (lesson_personality);

COMMENT ON COLUMN course_lessons.arc_type IS
    'Conductor arc type: micro | standard | tension_first | exploratory';

COMMENT ON COLUMN course_lessons.lesson_personality IS
    'Conductor lesson personality: calm | electric | cinematic | technical | warm | stark';

COMMENT ON COLUMN course_lessons.micro_variation_seed IS
    'Seeded integer for deterministic micro-variation in block border-radius, glow, spacing';

COMMENT ON COLUMN course_lessons.conductor_memory IS
    'Snapshot of ConductorMemory at the time this lesson was generated';
