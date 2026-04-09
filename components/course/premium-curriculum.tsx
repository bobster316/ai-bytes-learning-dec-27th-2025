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

// ── Progress ring ─────────────────────────────────────────────────────────────

function ProgressRing({ pct, colour }: { pct: number; colour: string }) {
    const r = 17;
    const circ = 2 * Math.PI * r;
    const offset = circ * (1 - pct / 100);
    return (
        <div style={{ position: 'relative', width: 44, height: 44 }}>
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
                lineHeight: 1, whiteSpace: 'nowrap',
            }}>
                {pct}%
            </span>
        </div>
    );
}

// ── Lesson row (hover-aware) ───────────────────────────────────────────────────

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
            {/* Dark gradient overlay */}
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
                    fontSize: 16, fontWeight: 800,
                    color: completed ? 'rgba(255,255,255,0.7)' : '#fff',
                    marginBottom: lesson.micro_objective ? 4 : 0,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                    {lesson.title}
                    {completed && (
                        <span style={{
                            marginLeft: 8, fontSize: 10, fontWeight: 800,
                            padding: '2px 6px', borderRadius: 4,
                            background: 'rgba(0,255,179,0.1)', color: '#00FFB3',
                            border: '1px solid rgba(0,255,179,0.2)',
                            textTransform: 'uppercase', letterSpacing: '0.1em',
                        }}>Done</span>
                    )}
                </div>
                {(lesson.micro_objective || lesson.description) && (
                    <div style={{
                        fontSize: 13, fontWeight: 500,
                        color: 'rgba(255,255,255,0.6)',
                        lineHeight: 1.6, marginTop: 5,
                        overflow: 'hidden',
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical' as const,
                    }}>
                        {[lesson.micro_objective, lesson.description].filter(Boolean).join(' ')}
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
                    width: 200, height: 130, borderRadius: 10, overflow: 'hidden', flexShrink: 0,
                    position: 'relative', zIndex: 10,
                    border: `1px solid ${hovered ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.14)'}`,
                    transition: 'transform 0.25s, border-color 0.25s',
                    transform: hovered ? 'scale(1.03)' : 'scale(1)',
                    boxShadow: '0 4px 24px rgba(0,0,0,0.6)',
                }}>
                    <img src={bgImg} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                </div>
            )}

            {/* Play / lock icon */}
            <div style={{
                width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                border: `1.5px solid ${hovered && !isLocked ? colour : 'rgba(255,255,255,0.12)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: isLocked ? 11 : 9,
                color: hovered && !isLocked ? colour : 'rgba(255,255,255,0.35)',
                background: hovered && !isLocked ? `${colour}14` : 'transparent',
                transition: 'all 0.25s', position: 'relative', zIndex: 2,
            }}>
                {isLocked ? '🔒' : '▶'}
            </div>
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

    const [open, setOpen] = useState<Record<string, boolean>>(() => {
        const s: Record<string, boolean> = {};
        course.course_topics.forEach((t) => { s[t.id] = false; });
        return s;
    });

    const toggle = (id: string) => setOpen(prev => ({ ...prev, [id]: !prev[id] }));

    const totalLessons = course.course_topics.reduce((a, t) => a + (t.course_lessons?.length || 0), 0);
    const totalModules = course.course_topics.length;
    const totalMinutes = course.course_topics.reduce((a, t) =>
        a + (t.course_lessons?.reduce((b, l) => b + (l.estimated_duration_minutes || 15), 0) || 0), 0);
    const totalQuizzes = course.course_topics.reduce((a, t) => a + (t.course_quizzes?.length || 0), 0);
    const hrs = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    const durationLabel = hrs > 0 ? `${hrs}h${mins > 0 ? ` ${mins}m` : ''}` : `${mins}m`;
    const firstLessonId = course.course_topics[0]?.course_lessons?.[0]?.id;

    return (
        <section style={{ width: '90%', margin: '0 auto' }}>

            {/* ── Header ──────────────────────────────────────────── */}
            <div style={{ marginBottom: 40 }}>
                <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    padding: '4px 12px', borderRadius: 20,
                    background: 'rgba(0,255,179,0.1)', border: '1px solid rgba(0,255,179,0.2)',
                    color: '#00FFB3', fontSize: 11, fontWeight: 700,
                    textTransform: 'uppercase', letterSpacing: '0.2em',
                    marginBottom: 16,
                }}>
                    Course Curriculum
                </span>
                <h2 style={{
                    fontFamily: '"Arial Black", Arial, sans-serif', fontWeight: 900,
                    fontSize: 40, letterSpacing: '-0.03em', color: '#fff',
                    marginBottom: 20, lineHeight: 1.1,
                }}>
                    What you&apos;ll learn
                </h2>

                {/* Stats pills */}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {[
                        { dot: '#9B8FFF', label: `${totalModules} Module${totalModules !== 1 ? 's' : ''}` },
                        { dot: '#00FFB3', label: `${totalLessons} Lesson${totalLessons !== 1 ? 's' : ''}` },
                        { dot: '#FFB347', label: `~${durationLabel} total` },
                        ...(totalQuizzes > 0 ? [{ dot: '#9B8FFF', label: `${totalQuizzes} Knowledge Check${totalQuizzes !== 1 ? 's' : ''}` }] : []),
                    ].map((p, i) => (
                        <div key={i} style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            padding: '6px 12px', borderRadius: 8,
                            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
                            fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.8)',
                        }}>
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: p.dot, display: 'inline-block', flexShrink: 0 }} />
                            {p.label}
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Module accordion ────────────────────────────────── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
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
                            background: '#0d0d1a',
                        }}>
                            {/* ── Module header ── */}
                            <div
                                role="button"
                                onClick={() => toggle(topic.id)}
                                style={{
                                    position: 'relative', display: 'flex', alignItems: 'center',
                                    cursor: 'pointer', overflow: 'hidden', minHeight: 88,
                                }}
                            >
                                {/* Colour wash */}
                                <div style={{
                                    position: 'absolute', inset: 0, pointerEvents: 'none',
                                    background: `linear-gradient(105deg,${colour}17 0%,${colour}07 45%,transparent 70%)`,
                                }} />

                                {/* Ghost number */}
                                <div style={{
                                    position: 'absolute', right: 24, top: '50%',
                                    transform: 'translateY(-50%)',
                                    fontFamily: '"Arial Black", Arial, sans-serif',
                                    fontWeight: 900, fontSize: 110,
                                    letterSpacing: '-0.06em', lineHeight: 1,
                                    color: colour, opacity: 0.06,
                                    pointerEvents: 'none', userSelect: 'none',
                                }}>
                                    {numLabel}
                                </div>

                                {/* Number badge */}
                                <div style={{
                                    width: 88, display: 'flex', alignItems: 'center',
                                    justifyContent: 'center', padding: '24px 0',
                                    flexShrink: 0, position: 'relative', zIndex: 2,
                                }}>
                                    <span style={{
                                        fontFamily: '"Arial Black", Arial, sans-serif',
                                        fontWeight: 900, fontSize: 36,
                                        letterSpacing: '-0.04em', color: colour,
                                    }}>
                                        {numLabel}
                                    </span>
                                </div>

                                {/* Vertical divider */}
                                <div style={{
                                    width: 1, height: 44,
                                    background: 'rgba(255,255,255,0.08)',
                                    flexShrink: 0, position: 'relative', zIndex: 2,
                                }} />

                                {/* Module info */}
                                <div style={{
                                    flex: 1, padding: '20px 24px',
                                    position: 'relative', zIndex: 2, minWidth: 0,
                                }}>
                                    <div style={{
                                        fontFamily: 'Consolas, monospace',
                                        fontSize: 11, fontWeight: 700,
                                        letterSpacing: '0.25em', textTransform: 'uppercase',
                                        color: colour, marginBottom: 6,
                                    }}>
                                        Module {numLabel}
                                    </div>
                                    <div style={{
                                        fontFamily: '"Arial Black", Arial, sans-serif',
                                        fontWeight: 900, fontSize: 22,
                                        letterSpacing: '-0.03em', color: '#fff',
                                        marginBottom: displayDesc ? 8 : 10, lineHeight: 1.15,
                                    }}>
                                        {topic.title}
                                    </div>
                                    {displayDesc && (
                                        <div style={{
                                            fontSize: 13, fontWeight: 500,
                                            color: 'rgba(255,255,255,0.55)',
                                            lineHeight: 1.55, marginBottom: 10,
                                            overflow: 'hidden',
                                            display: '-webkit-box',
                                            WebkitLineClamp: 3,
                                            WebkitBoxOrient: 'vertical' as const,
                                        }}>
                                            {displayDesc}
                                        </div>
                                    )}
                                    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                                        {[
                                            `${lessonCount} lesson${lessonCount !== 1 ? 's' : ''}`,
                                            `${topicDuration} min`,
                                            ...(topic.course_quizzes?.length > 0 ? ['Quiz included'] : []),
                                        ].map((chip, ci) => (
                                            <span key={ci} style={{
                                                fontSize: 12, fontWeight: 700,
                                                padding: '4px 12px', borderRadius: 6,
                                                background: 'rgba(255,255,255,0.07)',
                                                border: '1px solid rgba(255,255,255,0.12)',
                                                color: 'rgba(255,255,255,0.85)',
                                            }}>
                                                {chip}
                                            </span>
                                        ))}
                                        {isLocked && (
                                            <span style={{
                                                fontSize: 12, fontWeight: 700,
                                                padding: '4px 12px', borderRadius: 6,
                                                background: 'rgba(255,255,255,0.04)',
                                                border: '1px solid rgba(255,255,255,0.08)',
                                                color: 'rgba(255,255,255,0.4)',
                                            }}>
                                                🔒 Locked
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Progress ring + chevron */}
                                <div style={{
                                    display: 'flex', flexDirection: 'column',
                                    alignItems: 'center', gap: 8,
                                    padding: '16px 24px 16px 12px',
                                    flexShrink: 0, position: 'relative', zIndex: 2,
                                }}>
                                    <ProgressRing pct={pct} colour={colour} />
                                    <span style={{
                                        fontSize: 14, color: 'rgba(255,255,255,0.55)',
                                        display: 'inline-block',
                                        transition: 'transform 0.3s',
                                        transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                                    }}>▾</span>
                                </div>
                            </div>

                            {/* ── Lessons panel ── */}
                            {isOpen && (
                                <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                    {topic.course_lessons?.map((lesson, lIdx) => {
                                        const bgImg = lesson.thumbnail_url || topic.thumbnail_url;

                                        if (hasAccess && !isLocked) {
                                            return (
                                                <Link
                                                    key={lesson.id}
                                                    href={`/courses/${course.id}/lessons/${lesson.id}`}
                                                    style={{ textDecoration: 'none', display: 'block' }}
                                                >
                                                    <LessonRow
                                                        lesson={lesson}
                                                        lIdx={lIdx}
                                                        colour={colour}
                                                        bgImg={bgImg}
                                                        completed={completedLessons.includes(lesson.id)}
                                                        isLocked={false}
                                                    />
                                                </Link>
                                            );
                                        }

                                        return (
                                            <LessonRow
                                                key={lesson.id}
                                                lesson={lesson}
                                                lIdx={lIdx}
                                                colour={colour}
                                                bgImg={bgImg}
                                                completed={completedLessons.includes(lesson.id)}
                                                isLocked={true}
                                            />
                                        );
                                    })}

                                    {/* Quiz row */}
                                    {topic.course_quizzes?.length > 0 && (
                                        <div style={{
                                            display: 'flex', alignItems: 'center', gap: 12,
                                            padding: '14px 24px',
                                            background: 'rgba(255,255,255,0.02)',
                                            borderTop: '1px solid rgba(255,255,255,0.05)',
                                        }}>
                                            <div style={{
                                                width: 36, height: 36, borderRadius: 9, flexShrink: 0,
                                                background: quizPassed ? 'rgba(0,255,179,0.15)' : `${colour}22`,
                                                display: 'flex', alignItems: 'center',
                                                justifyContent: 'center', fontSize: 16,
                                            }}>
                                                {quizPassed ? '✓' : '?'}
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{
                                                    fontSize: 11, fontWeight: 700,
                                                    color: 'rgba(255,255,255,0.6)',
                                                    textTransform: 'uppercase', letterSpacing: '0.15em',
                                                    marginBottom: 2,
                                                }}>
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
                                                        padding: '8px 18px', borderRadius: 8,
                                                        fontSize: 13, fontWeight: 700,
                                                        border: `1px solid ${quizPassed ? 'rgba(0,255,179,0.3)' : 'rgba(255,255,255,0.18)'}`,
                                                        background: quizPassed ? 'rgba(0,255,179,0.1)' : 'transparent',
                                                        color: quizPassed ? '#00FFB3' : 'rgba(255,255,255,0.85)',
                                                        textDecoration: 'none',
                                                        whiteSpace: 'nowrap',
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

            {/* ── CTA ─────────────────────────────────────────────── */}
            {firstLessonId && (
                <div style={{
                    marginTop: 40, position: 'relative', borderRadius: 20,
                    overflow: 'hidden', padding: '48px 40px',
                    border: '1px solid rgba(75,152,173,0.2)',
                    textAlign: 'center',
                }}>
                    {/* Background video */}
                    <video
                        autoPlay muted loop playsInline
                        style={{
                            position: 'absolute', inset: 0,
                            width: '100%', height: '100%',
                            objectFit: 'cover',
                            pointerEvents: 'none',
                        }}
                    >
                        <source src="/videos/cta-neural-network.mp4" type="video/mp4" />
                    </video>
                    {/* Dark overlay so text stays readable */}
                    <div style={{
                        position: 'absolute', inset: 0, pointerEvents: 'none',
                        background: 'linear-gradient(135deg,rgba(7,7,14,0.82) 0%,rgba(7,7,14,0.70) 50%,rgba(7,7,14,0.82) 100%)',
                    }} />
                    <div style={{ position: 'relative', zIndex: 2 }}>
                        <div style={{
                            fontFamily: 'Consolas, monospace', fontSize: 12, fontWeight: 700,
                            letterSpacing: '0.25em', textTransform: 'uppercase',
                            color: '#00FFB3', marginBottom: 16,
                        }}>
                            Ready when you are
                        </div>
                        <div style={{
                            fontFamily: '"Arial Black", Arial, sans-serif', fontWeight: 900,
                            fontSize: 34, letterSpacing: '-0.04em', color: '#fff',
                            marginBottom: 12, lineHeight: 1.1,
                        }}>
                            Start learning today.<br />It takes 15 minutes.
                        </div>
                        <div style={{
                            fontSize: 16, fontWeight: 600, color: 'rgba(255,255,255,0.72)',
                            maxWidth: 400, margin: '0 auto 32px', lineHeight: 1.65,
                        }}>
                            Everything above is yours the moment you sign up. No card required to start.
                        </div>
                        <div style={{
                            display: 'flex', alignItems: 'center',
                            justifyContent: 'center', gap: 12, flexWrap: 'wrap',
                        }}>
                            <Link
                                href={hasAccess
                                    ? `/courses/${course.id}/lessons/${firstLessonId}`
                                    : '/pricing'}
                                style={{
                                    display: 'inline-flex', alignItems: 'center', gap: 8,
                                    height: 52, padding: '0 28px', borderRadius: 14,
                                    background: '#00FFB3', color: '#07070e',
                                    fontFamily: '"Arial Black", Arial, sans-serif',
                                    fontWeight: 800, fontSize: 14,
                                    textDecoration: 'none',
                                    boxShadow: '0 0 30px rgba(0,255,179,0.3)',
                                }}
                            >
                                {hasAccess ? '▶  Continue Learning' : '+ Start Free Today'}
                            </Link>
                            <Link
                                href={`/courses/${course.id}#curriculum`}
                                style={{
                                    display: 'inline-flex', alignItems: 'center', gap: 8,
                                    height: 52, padding: '0 24px', borderRadius: 14,
                                    background: 'transparent', color: 'rgba(255,255,255,0.8)',
                                    fontFamily: 'Arial, sans-serif', fontWeight: 700, fontSize: 14,
                                    textDecoration: 'none',
                                    border: '1px solid rgba(255,255,255,0.18)',
                                }}
                            >
                                View full syllabus →
                            </Link>
                        </div>
                        <div style={{
                            marginTop: 20, fontFamily: 'Consolas, monospace',
                            fontSize: 11, fontWeight: 600,
                            color: 'rgba(255,255,255,0.4)', letterSpacing: '0.15em',
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

export default PremiumCurriculum;
