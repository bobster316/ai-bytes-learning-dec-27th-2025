/**
 * Canonical AI Bytes category list.
 * Single source of truth used by:
 *  - Home page category cards (app/page.tsx)
 *  - Course catalogue filter (components/course-catalog.tsx)
 *  - Course generation prompt (lib/ai/agent-system-v2.ts)
 *  - DB writes in generate-v2 route
 */

export const CANONICAL_CATEGORIES = [
    { id: "ai-foundations",    label: "AI Foundations & Fundamentals" },
    { id: "generative-ai",     label: "Generative AI & LLMs" },
    { id: "prompt-engineering",label: "Prompt Engineering" },
    { id: "ai-tools",          label: "AI Tools & Applications" },
    { id: "business-ai",       label: "AI for Business & Strategy" },
    { id: "ai-ethics",         label: "AI Ethics & Governance" },
    { id: "ai-agents",         label: "AI Agents & Automation" },
    { id: "nlp",               label: "NLP & Conversational AI" },
    { id: "computer-vision",   label: "Computer Vision & Image AI" },
    { id: "industry-ai",       label: "AI in Industry Applications" },
    { id: "data-ai",           label: "Data & AI Fundamentals" },
    { id: "ai-product",        label: "AI Product Development" },
] as const;

export type CategoryId = typeof CANONICAL_CATEGORIES[number]["id"] | "all";

/** Comma-separated label list for injecting into AI prompts */
export const CATEGORY_LABELS_FOR_PROMPT = CANONICAL_CATEGORIES
    .map(c => `"${c.label}"`)
    .join(", ");
