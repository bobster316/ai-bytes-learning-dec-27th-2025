import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
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

function isPlatformQuery(text: string): boolean {
  const t = text.toLowerCase();
  if (t.includes("ai bytes") || t.includes("byte pass") || t.includes("sterling")) return true;
  if (
    t.includes("this site") ||
    t.includes("this website") ||
    t.includes("this platform") ||
    t.includes("our platform") ||
    t.includes("your platform") ||
    t.includes("what is this called") ||
    t.includes("what's this called") ||
    t.includes("what is the site") ||
    t.includes("what is the platform") ||
    t.includes("name of this") ||
    t.includes("called ai bytes")
  ) {
    return true;
  }
  const platformTerms = [
    "pricing",
    "subscription",
    "plan",
    "course",
    "lesson",
    "module",
    "catalog",
    "catalogue",
    "track",
    "tier",
  ];
  const hasPlatformSignal =
    t.includes("ai bytes") || t.includes("byte") || t.includes("platform") || t.includes("website");
  if (hasPlatformSignal && platformTerms.some((term) => t.includes(term))) return true;
  return false;
}


function needsFreshness(text: string): boolean {
  const t = text.toLowerCase();
  return (
    t.includes("latest") ||
    t.includes("today") ||
    t.includes("yesterday") ||
    t.includes("current") ||
    t.includes("news") ||
    t.includes("release") ||
    t.includes("version") ||
    t.includes("price") ||
    t.includes("rate") ||
    t.includes("schedule") ||
    t.includes("score") ||
    t.includes("who won") ||
    t.includes("what happened")
  );
}

function shouldSearch(mode: SearchMode, text: string): boolean {
  if (mode === "off") return false;
  if (mode === "on") return true;
  if (isPlatformQuery(text)) return false;
  // Only use search for queries that genuinely need real-time data.
  // For everything else, Gemini's base knowledge is fast and sufficient.
  return needsFreshness(text);
}

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

function extractTextFromInteraction(interaction: any): string {
  if (!interaction) return "";
  if (typeof interaction.text === "string") return interaction.text;
  if (typeof interaction.output_text === "string") return interaction.output_text;
  const outputs = interaction.outputs;
  if (Array.isArray(outputs)) {
    const texts = outputs
      .filter((o) => o && o.type === "text" && typeof o.text === "string")
      .map((o) => o.text);
    if (texts.length) return texts.join(" ").trim();
  }
  return "";
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const input = typeof body?.text === "string" ? body.text : "";
    const contextPrompt = typeof body?.contextPrompt === "string" ? body.contextPrompt : "";
    const history = typeof body?.history === "string" ? body.history : "";
    const searchMode = (body?.searchMode || "auto") as SearchMode;
    const timeoutMsRaw = Number(body?.timeoutMs);
    const timeoutMs = Number.isFinite(timeoutMsRaw) ? Math.max(500, timeoutMsRaw) : DEFAULT_TIMEOUT_MS;

    if (!input.trim()) {
      return NextResponse.json({ text: "" }, { status: 200 });
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Missing Gemini API key." }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey });

    // Fetch course content ONLY when student clearly asks about a named course/lesson.
    // Using a tight trigger avoids unnecessary DB round-trips on conversational messages.
    const courseNamePattern = /\b(course|lesson|module)\s+["']?([a-z]{4,})/i;
    const courseContext = courseNamePattern.test(input) ? await fetchRelevantCourseContent(input) : '';

    const enrichedContext = contextPrompt + courseContext;
    const prompt = buildPrompt(input, enrichedContext, history);

    // 1) Try live search (if needed) via Interactions + google_search tool
    if (shouldSearch(searchMode, input)) {
      try {
        const interactionPromise = (ai as any).interactions.create({
          model: "gemini-2.5-flash",
          input: prompt,
          tools: [{ type: "google_search" }],
        });
        const timeoutPromise = new Promise<null>((resolve) =>
          setTimeout(() => resolve(null), timeoutMs)
        );
        const interaction = await Promise.race([interactionPromise, timeoutPromise]);
        if (interaction) {
          const text = extractTextFromInteraction(interaction);
          if (text) {
            const cleaned = sanitize(enforceBrevity(text));
            return NextResponse.json({
              text: applyPricingCurrency(cleaned, input),
              usedSearch: true,
            });
          }
        }
      } catch (e) {
        // fall through to non-search model call
      }
    }

    // 2) Fast path: direct generateContent — no search, no round-trip delay
    const res = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: { temperature: 0.65, topP: 0.95, maxOutputTokens: 80 } as any,
    });
    const parts = res?.candidates?.[0]?.content?.parts || [];
    const text = parts
      .map((p: any) => p.text)
      .filter(Boolean)
      .join(" ")
      .trim();
    const cleaned = sanitize(enforceBrevity(text));

    return NextResponse.json({
      text:
        applyPricingCurrency(cleaned, input) ||
        "Hmm. Something seems off. Try that again, will you?",
      usedSearch: false,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to generate response." },
      { status: 500 }
    );
  }
}
