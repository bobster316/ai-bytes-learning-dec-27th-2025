/**
 * AI Bytes Thumbnail System v2.0
 * Implements the 6-category brand design from AI_Bytes_Thumbnail_Brief_for_Antigravity.docx
 *
 * System flow:
 *   1. classifyCategory()       — maps course to one of 6 topic categories
 *   2. buildBackgroundPrompt()  — builds DALL-E 3 prompt for gradient + abstract art (no text)
 *   3. compositeThumb()         — sharp/SVG layer applies all 7 brand zones on top
 */

export type ThumbnailCategory =
    | 'ai-foundations'
    | 'prompting'
    | 'agents'
    | 'safety'
    | 'business'
    | 'research';

export interface CategoryConfig {
    label: string;
    slug: ThumbnailCategory;
    gradient: { dark: string; vivid: string };
    accentColour: string;
    artStyle: string;
    glyph: string;
    radialGlow: string;
    keywords: string[];
}

// ─── Section 4: Colour System — Topic Ownership ───────────────────────────────

export const THUMBNAIL_CATEGORIES: Record<ThumbnailCategory, CategoryConfig> = {
    'ai-foundations': {
        label: 'FOUNDATIONS',
        slug: 'ai-foundations',
        gradient: { dark: '#3C3489', vivid: '#7F77DD' },
        accentColour: '#9B8FFF',
        radialGlow: '#1D9E75',
        artStyle: 'sparse neural network node-and-edge graph — small white circles connected by fine white lines at 18% opacity, purely geometric and mathematical, absolutely no human or animal shapes',
        glyph: 'large abstract geometric node cluster — concentric diamond rings nested inside each other at 22% opacity, purely abstract and mathematical, fills two-thirds of canvas height at far right, NOT a brain, NOT a head, NOT a human shape',
        keywords: [
            'foundations', 'how ai works', 'llm', 'large language model', 'model internals',
            'mathematics', 'transformer', 'architecture', 'deep learning', 'neural network',
            'machine learning', 'backpropagation', 'gradient descent', 'embeddings', 'tokens',
            'what is ai', 'introduction to ai', 'understand ai', 'generative ai', 'nlp',
            'natural language', 'language processing', 'essentials', 'beginner', 'introduction',
            'explained', 'practical introduction', 'for everyone',
        ],
    },
    'prompting': {
        label: 'PROMPTING',
        slug: 'prompting',
        gradient: { dark: '#085041', vivid: '#1D9E75' },
        accentColour: '#1D9E75',
        radialGlow: '#9B8FFF',
        artStyle: 'wave interference pattern — overlapping sine curves radiating from the right, suggesting tokens or thought chains flowing across space, fine white strokes at 18% opacity',
        glyph: 'lightning bolt glyph, abstract and purely geometric, at 20% opacity, fills two-thirds of canvas height at far right',
        keywords: [
            'prompt', 'prompting', 'chain-of-thought', 'few-shot', 'rlhf', 'instruction',
            'chatgpt', 'claude', 'gemini', 'system prompt', 'zero-shot',
            'prompt engineering', 'jailbreak', 'context window',
        ],
    },
    'agents': {
        label: 'AGENTS & TOOLS',
        slug: 'agents',
        gradient: { dark: '#042C53', vivid: '#378ADD' },
        accentColour: '#378ADD',
        radialGlow: '#1D9E75',
        artStyle: 'abstract tool-call graph — boxes connected by directional arrows suggesting workflow and agentic loops, white lines on transparent at 16% opacity',
        glyph: 'hexagon mesh pattern, geometric and abstract, at 20% opacity, fills two-thirds of canvas height at far right',
        keywords: [
            'agent', 'agentic', 'tool use', 'mcp', 'automation', 'workflow', 'function calling',
            'autonomous', 'multi-agent', 'orchestration', 'plugin', 'code interpreter',
        ],
    },
    'safety': {
        label: 'SAFETY',
        slug: 'safety',
        gradient: { dark: '#4A1B0C', vivid: '#D85A30' },
        accentColour: '#D85A30',
        radialGlow: '#FFB347',
        artStyle: 'abstract topology contour lines — fine curved contours, dense clusters at corners suggesting uncertainty and risk zones, at 18% opacity',
        glyph: 'shield outline, minimal and purely geometric, at 22% opacity, fills two-thirds of canvas height at far right',
        keywords: [
            'safety', 'ethics', 'hallucination', 'bias', 'governance', 'responsible',
            'alignment', 'risk', 'trust', 'fairness', 'misinformation', 'deepfake',
            'regulation', 'compliance', 'privacy',
        ],
    },
    'business': {
        label: 'BUSINESS AI',
        slug: 'business',
        gradient: { dark: '#412402', vivid: '#EF9F27' },
        accentColour: '#EF9F27',
        radialGlow: '#FF6B6B',
        artStyle: 'subtle perspective grid — receding squares suggesting organisation, structure, and business systems, fine white lines at 15% opacity',
        glyph: 'upward arrow enclosed in a circle, abstract and minimal, at 20% opacity, fills two-thirds of canvas height at far right',
        keywords: [
            'business', 'roi', 'enterprise', 'strategy', 'productivity', 'adoption',
            'organisation', 'leadership', 'team', 'workforce', 'cost', 'revenue',
            'digital transformation', 'use case', 'competitive', 'market',
        ],
    },
    'research': {
        label: 'RESEARCH',
        slug: 'research',
        gradient: { dark: '#26215C', vivid: '#AFA9EC' },
        accentColour: '#AFA9EC',
        radialGlow: '#378ADD',
        artStyle: 'abstract particle scatter — small geometric dots at varying opacities suggesting high-dimensional space or latent embeddings, fine white dots at 18% opacity',
        glyph: 'atom orbit rings, abstract and geometric, at 20% opacity, fills two-thirds of canvas height at far right',
        keywords: [
            'research', 'paper', 'frontier', 'gpt-4', 'gpt-5', 'cutting-edge', 'academic',
            'technique', 'new model', 'benchmark', 'sota', 'arxiv', 'preprint',
            'scaling', 'emergent', 'multimodal', 'reasoning',
        ],
    },
};

// ─── Category Classifier ──────────────────────────────────────────────────────

// DB category strings → thumbnail category mapping
const DB_CATEGORY_MAP: Record<string, ThumbnailCategory> = {
    'ai foundations':           'ai-foundations',
    'ai foundations & fundamentals': 'ai-foundations',
    'machine learning':         'ai-foundations',
    'deep learning':            'ai-foundations',
    'generative ai':            'ai-foundations',
    'generative ai & llms':     'ai-foundations',
    'llms':                     'ai-foundations',
    'nlp':                      'ai-foundations',
    'nlp & conversational ai':  'ai-foundations',
    'natural language processing': 'ai-foundations',
    'ai tools & applications':  'agents',
    'agents':                   'agents',
    'agents & tools':           'agents',
    'automation':               'agents',
    'prompting':                'prompting',
    'prompt engineering':       'prompting',
    'safety':                   'safety',
    'ai safety':                'safety',
    'ethics':                   'safety',
    'ai ethics':                'safety',
    'responsible ai':           'safety',
    'business ai':              'business',
    'business':                 'business',
    'enterprise ai':            'business',
    'research':                 'research',
    'ai research':              'research',
    'frontier ai':              'research',
};

/**
 * Maps a course to one of the 6 topic categories.
 * Priority: DB category string → keyword scoring → default 'ai-foundations'.
 */
export function classifyCategory(
    title: string,
    description: string,
    dbCategory?: string,
): ThumbnailCategory {
    // 1. Try the DB category field first — most reliable signal
    if (dbCategory) {
        const mapped = DB_CATEGORY_MAP[dbCategory.toLowerCase().trim()];
        if (mapped) return mapped;
    }

    // 2. Keyword scoring on title + description
    const text = `${title} ${description}`.toLowerCase();
    const scores: Record<ThumbnailCategory, number> = {
        'ai-foundations': 0,
        'prompting': 0,
        'agents': 0,
        'safety': 0,
        'business': 0,
        'research': 0,
    };

    for (const [slug, config] of Object.entries(THUMBNAIL_CATEGORIES)) {
        for (const kw of config.keywords) {
            if (text.includes(kw)) {
                scores[slug as ThumbnailCategory]++;
            }
        }
    }

    const sorted = Object.entries(scores).sort(([, a], [, b]) => b - a);
    return sorted[0][1] > 0 ? (sorted[0][0] as ThumbnailCategory) : 'ai-foundations';
}

// ─── Section 7: AI Background Prompt Builder ──────────────────────────────────

/**
 * Builds a DALL-E 3 prompt for the background art layer ONLY.
 * All text and brand elements are composited programmatically by sharp — never by the AI.
 */
export function buildBackgroundPrompt(category: ThumbnailCategory): string {
    const cfg = THUMBNAIL_CATEGORIES[category];
    return [
        `Pure abstract digital background art. No text of any kind.`,
        `Dark gradient from ${cfg.gradient.dark} at bottom-left to ${cfg.gradient.vivid} at top-right, 135-degree diagonal.`,
        `Soft radial light glow in ${cfg.radialGlow} at top-right at 30% opacity.`,
        `${cfg.artStyle}.`,
        `${cfg.glyph}.`,
        `16:9 landscape canvas. Modern, clean, flat aesthetic.`,
        `IMPORTANT: Do NOT include any text, letters, words, numbers, labels, badges, titles, watermarks, or typography of any kind anywhere in the image.`,
        `Do NOT include any human body parts, faces, heads, brain shapes, skull shapes, silhouettes, portraits, or humanoid figures.`,
        `Do NOT include robots, androids, circuit boards, keyboards, laptops, computer hardware, or any recognisable real-world objects.`,
    ].join(' ');
}

// ─── Section 8: Negative Prompt ───────────────────────────────────────────────

export const BACKGROUND_NEGATIVE_PROMPT =
    'text letters words numbers typography font label badge title watermark logo robot humanoid android cyborg human face person head skull brain anatomy silhouette portrait body hands keyboard laptop server circuit board PCB traces neon hacker matrix binary stock photo photorealistic lens flare bokeh blur drop shadow glossy 3D render cluttered busy copyright ugly deformed noisy grainy JPEG artifacts';

// ─── Title Utilities ──────────────────────────────────────────────────────────

/**
 * Rewrites a raw course title into curiosity-gap thumbnail copy via OpenRouter/DeepSeek.
 * Returns max 8 words total across 2 lines.
 * Falls back to the original title if the API call fails.
 */
export async function rewriteTitleForThumbnail(title: string): Promise<string> {
    const key = process.env.OPENROUTER_API_KEY;
    if (!key) return title;

    try {
        const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${key}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'deepseek/deepseek-v3.2',
                messages: [
                    {
                        role: 'system',
                        content: `You write short thumbnail titles for an AI micro-learning platform. Rewrite course titles to use curiosity-gap language.

RULES (strictly enforced):
- Maximum 8 words total
- No more than 4 words on any single line
- Use hooks: "How X really works", "Why X is harder than it looks", "What nobody tells you about X", "The truth about X"
- Power words that work: actually, really, finally, secretly, already
- NEVER use: Introduction, Specialization, Beginner's Guide, Practical, Fundamentals, Overview, Comprehensive, Complete, Course, Training
- Return ONLY the rewritten title — no quotes, no explanation, no punctuation at the end`,
                    },
                    {
                        role: 'user',
                        content: `Rewrite for thumbnail: "${title}"`,
                    },
                ],
                max_tokens: 25,
                temperature: 0.75,
            }),
        });

        if (!res.ok) return title;
        const data = await res.json();
        const rewritten = data.choices?.[0]?.message?.content?.trim().replace(/^["']|["']$/g, '');
        if (rewritten && rewritten.length > 3 && rewritten.length < 70) {
            return rewritten;
        }
    } catch {
        // silent fallback
    }

    return title;
}

/**
 * Splits a title into exactly 2 thumbnail lines of max 4 words each.
 * Truncates gracefully if the title is still too long after LLM rewriting.
 */
export function splitTitleLines(title: string): { line1: string; line2: string } {
    const words = title.split(' ');

    if (words.length <= 3) {
        return { line1: title, line2: '' };
    }

    // Hard cap: max 3 words per line, max 6 words total — keeps lines short for large font sizes
    const capped = words.slice(0, 6);

    // Try to break at a natural connector word at position 2-3
    const BREAK_AT = new Set(['the', 'a', 'an', 'of', 'for', 'in', 'on', 'and', 'with', 'about', 'is', 'are', 'was', 'your', 'my', 'our']);
    let breakAt = Math.min(3, capped.length - 1);

    for (let i = 2; i <= 3 && i < capped.length; i++) {
        if (BREAK_AT.has(capped[i].toLowerCase())) {
            breakAt = i;
            break;
        }
    }

    return {
        line1: capped.slice(0, breakAt).join(' '),
        line2: capped.slice(breakAt, breakAt + 3).join(' '),
    };
}
