import { NextResponse } from "next/server";
import { OpenAI } from "openai";
import { createClient } from "@supabase/supabase-js";
import { STERLING_SYSTEM_INSTRUCTION } from "@/lib/voice/sterling-knowledge";

/**
 * On-demand course/lesson content lookup.
 * When a student asks about a specific course or lesson, Sterling fetches
 * its full content from Supabase and injects it into the prompt.
 * This avoids loading all lessons upfront (too large) while still giving
 * Sterling accurate, detailed answers about specific content.
 */
async function fetchRelevantCourseContent(input: string): Promise<string> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Search courses by title keyword match
    const keywords = input.toLowerCase().replace(/[^\w\s]/g, ' ').split(/\s+/).filter(w => w.length > 3);
    if (keywords.length === 0) return '';

    const { data: courses } = await supabase
      .from('courses')
      .select('id, title, description, category, learning_objectives')
      .eq('published', true)
      .ilike('title', `%${keywords[0]}%`)
      .limit(2);

    if (!courses || courses.length === 0) return '';

    // For each matching course, get up to 3 lesson titles and content summaries
    const courseDetails = await Promise.all(
      courses.map(async (course) => {
        const { data: lessons } = await supabase
          .from('course_lessons')
          .select('title, content_markdown')
          .eq('course_id', course.id)
          .limit(3);

        return {
          course: course.title,
          category: course.category,
          description: course.description,
          objectives: course.learning_objectives,
          lessons: (lessons || []).map(l => ({
            title: l.title,
            preview: l.content_markdown?.substring(0, 400) || ''
          }))
        };
      })
    );

    return `\nRELEVANT COURSE CONTENT (fetched live):\n${JSON.stringify(courseDetails, null, 2)}\n`;
  } catch {
    return '';
  }
}

export const dynamic = "force-dynamic";

type SearchMode = "auto" | "on" | "off";

const DEFAULT_TIMEOUT_MS = 2000; // Keep search fast — 2s max before falling back

function enforceBrevity(text: string): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return clean;
  const sentences = clean.match(/[^.!?]+[.!?]+|\S+$/g) || [clean];
  let line = sentences.slice(0, 2).join(" ").trim();
  const words = line.split(/\s+/);
  if (words.length > 40) {
    line = words.slice(0, 40).join(" ").replace(/[,\s]+$/g, "");
    if (!/[.!?]$/.test(line)) line += ".";
  }
  return line;
}

function sanitize(text: string): string {
  if (!text) return text;
  let c = text;
  c = c.replace(/(^|\n)\s*ah[,.]?\s+/gi, "$1Right, ");
  c = c.replace(/\bAh[,.]?\b/gi, "Right");
  return c;
}

function applyPricingCurrency(text: string, input: string): string {
  if (!text) return text;
  const wantsPricing = /\b(price|pricing|cost|plan|subscription|byte pass|pro|unlimited|free|tier)\b/i.test(
    input
  );
  if (!wantsPricing) return text;
  let t = text;
  t = t.replace(/\$\s?(\d+(?:\.\d+)?)/g, "$1 pounds");
  t = t.replace(/\bUSD\b/gi, "pounds");
  t = t.replace(/\bGBP\b/gi, "pounds");
  t = t.replace(/\bdollars?\b/gi, "pounds");
  return t;
}

function buildPrompt(input: string, contextPrompt?: string, history?: string): string {
  const safeInput = input?.trim() || "";
  const safeContext = contextPrompt?.trim() || "";
  const safeHistory = history?.trim() || "";
  return `${STERLING_SYSTEM_INSTRUCTION}\n${safeContext}\n\nCONVERSATION:\n${safeHistory || "(none)"
    }\n\nUser: ${safeInput}\nSterling:`;
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const input = typeof body?.text === "string" ? body.text : "";
    const contextPrompt = typeof body?.contextPrompt === "string" ? body.contextPrompt : "";
    const history = typeof body?.history === "string" ? body.history : "";

    if (!input.trim()) {
      return NextResponse.json({ text: "" }, { status: 200 });
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Missing OpenRouter API key." }, { status: 500 });
    }

    const openai = new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: apiKey,
    });

    // Fetch course content ONLY when student clearly asks about a named course/lesson.
    const courseNamePattern = /\b(course|lesson|module)\s+["']?([a-z]{4,})/i;
    const courseContext = courseNamePattern.test(input) ? await fetchRelevantCourseContent(input) : '';

    const enrichedContext = contextPrompt + courseContext;
    const prompt = buildPrompt(input, enrichedContext, history);

    // DeepSeek Fast path: direct completion — no search, no round-trip delay
    const res = await openai.chat.completions.create({
      model: "deepseek/deepseek-v3.2",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.65,
      top_p: 0.95,
      max_tokens: 80,
    });
    
    const text = res?.choices?.[0]?.message?.content || "";
    const cleaned = sanitize(enforceBrevity(text));

    return NextResponse.json({
      text:
        applyPricingCurrency(cleaned, input) ||
        "Hmm. Something seems off. Try that again, will you?",
      usedSearch: false, // Disabling pseudo-search
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to generate response." },
      { status: 500 }
    );
  }
}
