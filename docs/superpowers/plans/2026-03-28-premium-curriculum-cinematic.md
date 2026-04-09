# PremiumCurriculum Cinematic Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the existing `PremiumCurriculum` component with the cinematic scroll design from the approved mockup — giant ghost module numbers, atmospheric lesson thumbnails, progress rings, and a CTA — while keeping the hero section above completely untouched.

**Architecture:** Single-file rewrite of `components/course/premium-curriculum.tsx`. Same props interface so `app/courses/[courseId]/page.tsx` needs zero changes. All visual logic (colour cycling, progress ring geometry) is self-contained in the component. No new dependencies.

**Tech Stack:** React 19, TypeScript, Tailwind CSS, inline styles for per-module colour values, SVG for progress rings.

---

## Module colour cycle

| Index | Name | Hex |
|-------|------|-----|
| 0 | pulse (teal) | `#00FFB3` |
| 1 | iris (purple) | `#9B8FFF` |
| 2 | amber | `#FFB347` |
| 3 | nova (red) | `#FF6B6B` |

---

## File Structure

| File | Action | Purpose |
|------|--------|---------|
| `components/course/premium-curriculum.tsx` | **Rewrite** | Full cinematic redesign |
| `components/course/premium-curriculum.tsx.bak` | **Create** | Backup of current implementation |

---

### Task 1: Back up current component

**Files:**
- Create: `components/course/premium-curriculum.tsx.bak`

- [ ] **Step 1: Copy current file to backup**

```bash
cp "components/course/premium-curriculum.tsx" "components/course/premium-curriculum.tsx.bak"
```

- [ ] **Step 2: Verify backup exists**

```bash
ls -la components/course/premium-curriculum.tsx.bak
```
Expected: file exists with same size as original.

- [ ] **Step 3: Commit backup**

```bash
git add components/course/premium-curriculum.tsx.bak
git commit -m "chore: back up premium-curriculum before cinematic redesign"
```

---

### Task 2: Rewrite PremiumCurriculum with cinematic design

**Files:**
- Modify: `components/course/premium-curriculum.tsx`

This is a full rewrite. The component keeps the exact same props interface:

```ts
interface PremiumCurriculumProps {
    course: Course;
    hasAccess: boolean;
    completedLessons?: string[];
    completedQuizzes?: string[];
}
```

- [ ] **Step 1: Replace the entire file with the cinematic implementation**

```tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Lesson {
    id: string;
    title: string;
    order_index: number;
    estimated_duration_minutes?: number;
    key_takeaways?: string[];
    thumbnail_url?: string;
    description?: string;
    micro_objective?: string;
    lesson_action?: string;
}

interface Topic {
    id: string;
    title: string;
    description?: string;
    order_index: number;
    course_lessons: Lesson[];
    course_quizzes: { id: string; title: string }[];
    thumbnail_url?: string;
    video_url?: string;
    intro_video_job_id?: string;
    intro_video_status?: string;
}

interface Course {
    id: string;
    title: string;
    description?: string;
    course_topics: Topic[];
    price: number;
}

interface PremiumCurriculumProps {
    course: Course;
    hasAccess: boolean;
    completedLessons?: string[];
    completedQuizzes?: string[];
}

// ── Colour cycle ──────────────────────────────────────────────────────────────

const MODULE_COLOURS = ['#00FFB3', '#9B8FFF', '#FFB347', '#FF6B6B'] as const;
type ModuleColour = typeof MODULE_COLOURS[number];

// ── Progress ring SVG ─────────────────────────────────────────────────────────

function ProgressRing({ pct, colour }: { pct: number; colour: string }) {
    const r = 17;
    const circ = 2 * Math.PI * r; // ≈ 106.8
    const offset = circ * (1 - pct / 100);
    return (
        <div className="relative" style={{ width: 44, height: 44 }}>
            <svg width="44" height="44" viewBox="0 0 44 44" style={{ display: 'block' }}>
                <circle cx="22" cy="22" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="2.5" />
                <circle
                    cx="22" cy="22" r={r}
                    fill="none"
                    stroke={colour}
                    strokeWidth="2.5"
                    strokeDasharray={circ}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    transform="rotate(-90 22 22)"
                    style={{ transition: 'stroke-dashoffset 0.4s ease' }}
                />
            </svg>
            <span style={{
                position: 'absolute', top: '50%', left: '50%',
                transform: 'translate(-50%,-50%)',
                fontFamily: 'Consolas, monospace',
                fontSize: 10, fontWeight: 700,
                color: 'rgba(255,255,255,0.9)',
                lineHeight: 1,
            }}>
                {pct}%
            </span>
        </div>
    );
}

// ── Main component ────────────────────────────────────────────────────────────

export function PremiumCurriculum({
    course,
    hasAccess,
    completedLessons = [],
    completedQuizzes = [],
}: PremiumCurriculumProps) {

    // First module open by default; rest collapsed
    const [open, setOpen] = useState<Record<string, boolean>>(() => {
        const s: Record<string, boolean> = {};
        course.course_topics.forEach((t, i) => { s[t.id] = i === 0; });
        return s;
    });

    const toggle = (id: string) => setOpen(prev => ({ ...prev, [id]: !prev[id] }));

    // Stats
    const totalLessons = course.course_topics.reduce((a, t) => a + (t.course_lessons?.length || 0), 0);
    const totalModules = course.course_topics.length;
    const totalMinutes = course.course_topics.reduce((a, t) =>
        a + (t.course_lessons?.reduce((b, l) => b + (l.estimated_duration_minutes || 15), 0) || 0), 0);
    const totalQuizzes = course.course_topics.reduce((a, t) => a + (t.course_quizzes?.length || 0), 0);
    const hrs = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    const durationLabel = hrs > 0 ? `${hrs}h ${mins > 0 ? `${mins}m` : ''}`.trim() : `${mins}m`;

    const firstLessonId = course.course_topics[0]?.course_lessons?.[0]?.id;

    return (
        <section style={{ maxWidth: 960, margin: '0 auto', padding: '0 0 80px' }}>

            {/* ── Section eyebrow ─────────────────────────────────── */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#00FFB3', boxShadow: '0 0 8px #00FFB3' }} />
                <span style={{
                    fontFamily: 'Consolas, monospace', fontSize: 13, fontWeight: 700,
                    letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.7)',
                }}>
                    Curriculum
                </span>
                <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg,rgba(255,255,255,0.1),transparent)' }} />
            </div>

            {/* ── Stats pills ─────────────────────────────────────── */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 32, flexWrap: 'wrap' }}>
                {[
                    { icon: '⬡', label: `${totalModules} modules` },
                    { icon: '◈', label: `${totalLessons} lessons` },
                    { icon: '◷', label: durationLabel + ' total' },
                    ...(totalQuizzes > 0 ? [{ icon: '◎', label: `${totalQuizzes} knowledge checks` }] : []),
                ].map((p, i) => (
                    <div key={i} style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '7px 14px', borderRadius: 20,
                        background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                        fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.8)',
                    }}>
                        <span style={{ fontSize: 14 }}>{p.icon}</span>
                        <span>{p.label}</span>
                    </div>
                ))}
            </div>

            {/* ── Module accordion ────────────────────────────────── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {course.course_topics.map((topic, idx) => {
                    const colour: ModuleColour = MODULE_COLOURS[idx % MODULE_COLOURS.length];
                    const isOpen = open[topic.id];
                    const lessonCount = topic.course_lessons?.length || 0;
                    const completedInModule = topic.course_lessons?.filter(l => completedLessons.includes(l.id)).length || 0;
                    const quizPassed = topic.course_quizzes?.some(q => completedQuizzes.includes(q.id)) || false;
                    const totalItems = lessonCount + (topic.course_quizzes?.length || 0);
                    const completedItems = completedInModule + (quizPassed ? 1 : 0);
                    const pct = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
                    const topicDuration = topic.course_lessons?.reduce((a, l) => a + (l.estimated_duration_minutes || 15), 0) || 0;
                    const numLabel = String(idx + 1).padStart(2, '0');
                    const isLocked = !hasAccess && idx > 0;
                    const displayDesc = topic.description?.replace(/\[gemma\]/gi, '').replace(/\[sarah\]/gi, '').trim();

                    return (
                        <div key={topic.id} style={{
                            borderRadius: 16, overflow: 'hidden',
                            border: `1px solid ${isOpen ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.06)'}`,
                            transition: 'border-color 0.3s',
                        }}>
                            {/* Module header */}
                            <div
                                onClick={() => toggle(topic.id)}
                                style={{
                                    position: 'relative', display: 'flex', alignItems: 'center',
                                    gap: 0, cursor: 'pointer', overflow: 'hidden', minHeight: 80,
                                }}
                            >
                                {/* Colour wash */}
                                <div style={{
                                    position: 'absolute', inset: 0, pointerEvents: 'none',
                                    background: `linear-gradient(105deg,${colour}17 0%,${colour}07 45%,transparent 70%)`,
                                }} />

                                {/* Ghost number */}
                                <div style={{
                                    position: 'absolute', right: 20, top: '50%', transform: 'translateY(-50%)',
                                    fontFamily: '"Arial Black", Arial, sans-serif', fontWeight: 900,
                                    fontSize: 110, letterSpacing: '-0.06em', lineHeight: 1,
                                    color: colour, opacity: 0.055, pointerEvents: 'none', userSelect: 'none',
                                }}>
                                    {numLabel}
                                </div>

                                {/* Number badge */}
                                <div style={{
                                    width: 80, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    padding: '24px 0', flexShrink: 0, position: 'relative', zIndex: 2,
                                }}>
                                    <span style={{
                                        fontFamily: '"Arial Black", Arial, sans-serif', fontWeight: 900,
                                        fontSize: 34, letterSpacing: '-0.04em', lineHeight: 1, color: colour,
                                    }}>
                                        {numLabel}
                                    </span>
                                </div>

                                {/* Divider */}
                                <div style={{ width: 1, height: 40, background: 'rgba(255,255,255,0.08)', flexShrink: 0, position: 'relative', zIndex: 2 }} />

                                {/* Module info */}
                                <div style={{ flex: 1, padding: '20px 20px', position: 'relative', zIndex: 2, minWidth: 0 }}>
                                    <div style={{
                                        fontFamily: 'Consolas, monospace', fontSize: 12, fontWeight: 700,
                                        letterSpacing: '0.22em', textTransform: 'uppercase', color: colour,
                                        marginBottom: 7,
                                    }}>
                                        {topic.title.split(':')[0] || `Module ${numLabel}`}
                                    </div>
                                    <div style={{
                                        fontFamily: '"Arial Black", Arial, sans-serif', fontWeight: 900,
                                        fontSize: 22, letterSpacing: '-0.03em', color: '#fff',
                                        marginBottom: 10, lineHeight: 1.15,
                                    }}>
                                        {topic.title}
                                    </div>
                                    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                                        {[
                                            `${lessonCount} lesson${lessonCount !== 1 ? 's' : ''}`,
                                            `${topicDuration} min`,
                                            ...(topic.course_quizzes?.length > 0 ? ['Quiz included'] : []),
                                            ...(isLocked ? ['🔒 Locked'] : []),
                                        ].map((chip, ci) => (
                                            <span key={ci} style={{
                                                fontSize: 12, fontWeight: 700, padding: '5px 12px', borderRadius: 5,
                                                background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.14)',
                                                color: 'rgba(255,255,255,0.85)',
                                            }}>
                                                {chip}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {/* Progress ring + arrow */}
                                <div style={{
                                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                                    padding: '16px 20px 16px 12px', flexShrink: 0, position: 'relative', zIndex: 2,
                                }}>
                                    <ProgressRing pct={pct} colour={colour} />
                                    <span style={{
                                        fontSize: 14, color: 'rgba(255,255,255,0.6)',
                                        transition: 'transform 0.3s',
                                        transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                                        display: 'inline-block',
                                    }}>
                                        ▾
                                    </span>
                                </div>
                            </div>

                            {/* Lessons panel */}
                            {isOpen && (
                                <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                    {topic.course_lessons?.map((lesson, lIdx) => {
                                        const bgImg = lesson.thumbnail_url || topic.thumbnail_url;
                                        const LessonWrapper = hasAccess && !isLocked
                                            ? ({ children }: { children: React.ReactNode }) => (
                                                <Link href={`/courses/${course.id}/lessons/${lesson.id}`} style={{ textDecoration: 'none', display: 'block' }}>
                                                    {children}
                                                </Link>
                                            )
                                            : ({ children }: { children: React.ReactNode }) => <div>{children}</div>;

                                        return (
                                            <LessonWrapper key={lesson.id}>
                                                <LessonRow
                                                    lesson={lesson}
                                                    lIdx={lIdx}
                                                    colour={colour}
                                                    bgImg={bgImg}
                                                    completed={completedLessons.includes(lesson.id)}
                                                    isLocked={isLocked}
                                                />
                                            </LessonWrapper>
                                        );
                                    })}

                                    {/* Quiz row */}
                                    {topic.course_quizzes?.length > 0 && (
                                        <div style={{
                                            display: 'flex', alignItems: 'center', gap: 12,
                                            padding: '12px 20px',
                                            background: 'rgba(255,255,255,0.02)',
                                            borderTop: '1px solid rgba(255,255,255,0.05)',
                                        }}>
                                            <div style={{
                                                width: 32, height: 32, borderRadius: 8,
                                                background: quizPassed ? 'rgba(0,255,179,0.15)' : `${colour}22`,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontSize: 14,
                                            }}>
                                                {quizPassed ? '✓' : '?'}
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.75)', marginBottom: 2 }}>
                                                    Knowledge Check
                                                </div>
                                                <div style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>
                                                    {topic.course_quizzes[0].title}
                                                </div>
                                            </div>
                                            {!isLocked && (
                                                <Link
                                                    href={`/courses/${course.id}/topics/${topic.id}/quiz/${topic.course_quizzes[0].id}`}
                                                    onClick={e => e.stopPropagation()}
                                                    style={{
                                                        padding: '7px 16px', borderRadius: 6, fontSize: 13, fontWeight: 700,
                                                        border: `1px solid rgba(255,255,255,0.18)`,
                                                        background: quizPassed ? 'rgba(0,255,179,0.1)' : 'transparent',
                                                        color: quizPassed ? '#00FFB3' : 'rgba(255,255,255,0.85)',
                                                        textDecoration: 'none',
                                                        transition: 'all 0.2s',
                                                    }}
                                                >
                                                    {quizPassed ? 'Retake' : 'Start Quiz →'}
                                                </Link>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* ── CTA section ─────────────────────────────────────── */}
            {firstLessonId && (
                <div style={{
                    marginTop: 40, position: 'relative', borderRadius: 20, overflow: 'hidden',
                    padding: '40px 40px', border: '1px solid rgba(75,152,173,0.18)',
                    textAlign: 'center',
                }}>
                    <div style={{
                        position: 'absolute', inset: 0,
                        background: 'linear-gradient(135deg,rgba(75,152,173,0.08) 0%,rgba(75,152,173,0.02) 50%,rgba(155,143,255,0.04) 100%)',
                    }} />
                    <div style={{
                        position: 'absolute', top: -60, left: -60, width: 300, height: 300,
                        borderRadius: '50%', background: 'radial-gradient(circle,rgba(75,152,173,0.12),transparent 70%)',
                        filter: 'blur(40px)', pointerEvents: 'none',
                    }} />
                    <div style={{ position: 'relative', zIndex: 2 }}>
                        <div style={{
                            fontFamily: 'Consolas, monospace', fontSize: 13, fontWeight: 700,
                            letterSpacing: '0.25em', textTransform: 'uppercase',
                            color: '#4b98ad', marginBottom: 14,
                        }}>
                            Ready when you are
                        </div>
                        <div style={{
                            fontFamily: '"Arial Black", Arial, sans-serif', fontWeight: 900,
                            fontSize: 32, letterSpacing: '-0.04em', color: '#fff',
                            marginBottom: 10, lineHeight: 1.1,
                        }}>
                            Start learning today.<br />It takes 15 minutes.
                        </div>
                        <div style={{
                            fontSize: 16, fontWeight: 600, color: 'rgba(255,255,255,0.78)',
                            maxWidth: 380, margin: '0 auto 28px', lineHeight: 1.6,
                        }}>
                            Everything above is yours the moment you sign up. No card required to start.
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
                            <Link
                                href={hasAccess
                                    ? `/courses/${course.id}/lessons/${firstLessonId}`
                                    : '/pricing'}
                                style={{
                                    display: 'inline-flex', alignItems: 'center', gap: 8,
                                    height: 52, padding: '0 28px', borderRadius: 14,
                                    background: '#4b98ad', color: '#07070e',
                                    fontFamily: '"Arial Black", Arial, sans-serif', fontWeight: 800,
                                    fontSize: 14, textDecoration: 'none', border: 'none',
                                    boxShadow: '0 0 30px rgba(75,152,173,0.25)',
                                    transition: 'box-shadow 0.3s, transform 0.2s',
                                }}
                            >
                                {hasAccess ? '▶ Continue Learning' : '+ Start Free Today'}
                            </Link>
                            <Link
                                href={`/courses/${course.id}#curriculum`}
                                style={{
                                    display: 'inline-flex', alignItems: 'center', gap: 8,
                                    height: 52, padding: '0 24px', borderRadius: 14,
                                    background: 'transparent', color: 'rgba(255,255,255,0.85)',
                                    fontFamily: 'Arial, sans-serif', fontWeight: 700,
                                    fontSize: 14, textDecoration: 'none',
                                    border: '1px solid rgba(255,255,255,0.18)',
                                }}
                            >
                                View full syllabus →
                            </Link>
                        </div>
                        <div style={{
                            marginTop: 16, fontFamily: 'Consolas, monospace', fontSize: 12,
                            fontWeight: 600, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.15em',
                            textTransform: 'uppercase',
                        }}>
                            Free to start · No credit card · Cancel anytime
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}

// ── LessonRow (hover state managed locally) ───────────────────────────────────

function LessonRow({
    lesson, lIdx, colour, bgImg, completed, isLocked,
}: {
    lesson: Lesson;
    lIdx: number;
    colour: string;
    bgImg?: string;
    completed: boolean;
    isLocked: boolean;
}) {
    const [hovered, setHovered] = useState(false);

    return (
        <div
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                position: 'relative', display: 'flex', alignItems: 'center',
                gap: 16, padding: '18px 24px', overflow: 'hidden',
                borderBottom: '1px solid rgba(255,255,255,0.04)',
                background: hovered ? 'rgba(255,255,255,0.015)' : 'transparent',
                transition: 'background 0.25s',
                opacity: isLocked ? 0.5 : 1,
                cursor: isLocked ? 'default' : 'pointer',
            }}
        >
            {/* Atmospheric bg image */}
            {bgImg && (
                <div style={{
                    position: 'absolute', inset: 0,
                    backgroundImage: `url(${bgImg})`,
                    backgroundSize: 'cover', backgroundPosition: 'center',
                    opacity: hovered ? 0.18 : 0,
                    transition: 'opacity 0.35s ease',
                    pointerEvents: 'none',
                }} />
            )}
            {/* Gradient overlay */}
            <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(105deg,rgba(7,7,14,0.92) 0%,rgba(7,7,14,0.70) 45%,rgba(7,7,14,0.88) 100%)',
                pointerEvents: 'none',
            }} />

            {/* Lesson number */}
            <span style={{
                fontFamily: 'Consolas, monospace', fontSize: 13, fontWeight: 700,
                color: completed ? colour : 'rgba(255,255,255,0.65)',
                flexShrink: 0, width: 24, textAlign: 'center', position: 'relative', zIndex: 2,
            }}>
                {String(lIdx + 1).padStart(2, '0')}
            </span>

            {/* Body */}
            <div style={{ flex: 1, minWidth: 0, position: 'relative', zIndex: 2 }}>
                <div style={{
                    fontSize: 16, fontWeight: 800, color: completed ? 'rgba(255,255,255,0.7)' : '#fff',
                    marginBottom: 5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                    {lesson.title}
                    {completed && (
                        <span style={{
                            marginLeft: 8, fontSize: 10, fontWeight: 800, padding: '2px 6px',
                            borderRadius: 4, background: 'rgba(0,255,179,0.1)', color: '#00FFB3',
                            border: '1px solid rgba(0,255,179,0.2)', textTransform: 'uppercase', letterSpacing: '0.1em',
                        }}>Done</span>
                    )}
                </div>
                {lesson.micro_objective && (
                    <div style={{
                        fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.72)',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                        {lesson.micro_objective}
                    </div>
                )}
            </div>

            {/* Duration */}
            <span style={{
                fontFamily: 'Consolas, monospace', fontSize: 13, fontWeight: 600,
                color: 'rgba(255,255,255,0.62)', flexShrink: 0, position: 'relative', zIndex: 2,
            }}>
                {lesson.estimated_duration_minutes || 15}m
            </span>

            {/* Thumbnail */}
            {bgImg && (
                <div style={{
                    width: 68, height: 46, borderRadius: 7, overflow: 'hidden', flexShrink: 0,
                    position: 'relative', zIndex: 2,
                    border: `1px solid ${hovered ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.08)'}`,
                    transition: 'transform 0.25s, border-color 0.25s',
                    transform: hovered ? 'scale(1.05)' : 'scale(1)',
                }}>
                    <img src={bgImg} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
            )}

            {/* Play button */}
            <div style={{
                width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                border: `1.5px solid ${hovered ? colour : 'rgba(255,255,255,0.12)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 9, color: hovered ? colour : 'rgba(255,255,255,0.35)',
                background: hovered ? `${colour}14` : 'transparent',
                transition: 'all 0.25s', position: 'relative', zIndex: 2,
            }}>
                ▶
            </div>
        </div>
    );
}

export default PremiumCurriculum;
```

- [ ] **Step 2: Start dev server and open course page**

```bash
# In browser navigate to:
# http://localhost:3000/courses/834
```

Expected: Cinematic module accordion visible with ghost numbers, progress rings, atmospheric lesson rows, CTA at bottom.

- [ ] **Step 3: Verify no TypeScript errors**

```bash
npx tsc --noEmit 2>&1 | head -30
```

Expected: No errors related to `premium-curriculum.tsx`.

- [ ] **Step 4: Commit**

```bash
git add components/course/premium-curriculum.tsx
git commit -m "feat: cinematic scroll curriculum — ghost numbers, progress rings, atmospheric lesson rows"
```

---

### Task 3: Smoke-test against both courses

- [ ] **Step 1: Check course 831 renders**

Navigate to `http://localhost:3000/courses/831`
Expected: Curriculum section renders without errors, module colours cycle correctly.

- [ ] **Step 2: Check course 834 renders**

Navigate to `http://localhost:3000/courses/834`
Expected: Same. Multiple modules expand/collapse cleanly.

- [ ] **Step 3: Verify lesson links work**

Click a lesson row on course 834.
Expected: Navigates to `/courses/834/lessons/[id]`.

- [ ] **Step 4: Verify quiz links work**

Click "Start Quiz →" on any module with a quiz.
Expected: Navigates to quiz page without 404.

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "chore: verify cinematic curriculum against courses 831 and 834"
```

---

## Self-Review

**Spec coverage:**
- ✅ Giant ghost module numbers
- ✅ Module colour cycling (teal → iris → amber → nova)
- ✅ Module tag, title, chips, expand arrow
- ✅ Progress ring SVG
- ✅ Atmospheric thumbnail hover on lesson rows
- ✅ Lesson number, title, objective, duration, thumbnail, play button
- ✅ Quiz row with pass state
- ✅ CTA section
- ✅ Hero section untouched (changes are inside PremiumCurriculum only)
- ✅ Same props interface — no changes to page.tsx

**Placeholder scan:** None found — all code is complete.

**Type consistency:** `Lesson`, `Topic`, `Course`, `PremiumCurriculumProps` defined once and used consistently throughout. `LessonRow` props match usage.
