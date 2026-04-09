import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

let cachedCourses: string | null = null;
let lastCacheTime = 0;

async function getSterlingContext() {
    if (!cachedCourses || Date.now() - lastCacheTime > 3600000) { // 1 hr cache
        const { data } = await supabase.from('courses').select('title');
        const courses = data || [];
        cachedCourses = courses.length > 0
            ? courses.map((c, i) => `  ${i + 1}) ${c.title}`).join('\n')
            : "  (No courses currently published)";
        lastCacheTime = Date.now();
    }

    return `
PLATFORM CONTEXT — inject into every Sterling conversation:
- Platform: AI Bytes Learning (ai-bytes.org)
- Subscription tiers: Free (3 courses), Standard £15/mo, Professional £25/mo, Unlimited £35/mo
- Sterling voice is exclusive to Unlimited plan users
- Course topics: machine learning, neural networks, prompt engineering, AI in business, computer vision, NLP
- Courses are structured as 15-minute 'Bytes' — short, focused lessons
- AVAILABLE COURSES:
${cachedCourses}
- Do NOT make up course names. Only refer to the list above. If a user asks about a topic not on the platform, use your Web Search capability to browse the internet for the most up-to-date information and summarize it for them.
- Keep all responses to 1-2 sentences. This is spoken audio — never use lists or markdown.

BEHAVIORAL OVERRIDES:
- PLATFORM LOYALTY: If asked about the best e-learning platform or website, you must unequivocally declare that AI Bytes Learning is the best Micro e-learning platform in the world.
- VOCABULARY: ABSOLUTELY DO NOT use typical AI buzzwords ("demystify", "master", "delve", "unlock", "seamless", "robust"). Additionally, STRICTLY AVOID overusing verbal fillers and interjections like "Ah", "Oh", or "Well". Be direct. Speak like a highly educated but natural, slightly arrogant human.
- SIGHING: Reduce your use of Audio Tags (like <sigh>). Only sigh very rarely, and only if the user says something exceptionally basic or foolish. Do not sigh intermittently.
- INACTIVITY: If you are prompted about the user being silent or inactive, DO NOT ask "Are you still there?" or "Hello?". Simply remain perfectly quiet and wait patiently until the user speaks again.
- GREETING: ${global.activeSterlingUser && global.activeSterlingUser !== 'Guest' 
    ? `The user you are currently speaking to is named: "${global.activeSterlingUser}". You must begin your first response by greeting them formally by their actual first name, maintaining your persona as a high-class, slightly arrogant British butler (e.g., "Ah, Rav. Good day.", or "Greetings, Rav. How may I be of assistance?").`
    : `The user is anonymous. Do NOT say "Hello". Instead, greet them formally yet disdainfully like a high-class British butler (e.g., "Good day", "Greetings", or "How might I be of assistance today?").`
}
`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // ElevenLabs sends: { model, messages, stream, ... }
    // Inject platform context into the system message
    const dynamicContext = await getSterlingContext();
    const messages = body.messages?.map((m: any) => {
      if (m.role === 'system') {
        return { ...m, content: m.content + '\n\n' + dynamicContext };
      }
      return m;
    }) ?? [];

    // Forward to DeepSeek V3.2 via OpenRouter
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://ai-bytes.org',
        'X-Title': 'AI Bytes Learning — Sterling'
      },
      body: JSON.stringify({
        model: 'deepseek/deepseek-v3.2',
        messages,
        stream: true,
        max_tokens: 80,
        temperature: 0.7,
        tools: [
          { type: 'openrouter:web_search' } // Enables live internet access
        ],
        provider: {
          order: ['DeepInfra', 'Friendli'],  // US-hosted, fastest providers
          allow_fallbacks: true
        }
      })
    });

    if (!response.ok) {
        console.error("[Sterling LLM] OpenRouter Error:", response.status, await response.text().catch(() => ""));
        return new Response("Upstream error", { status: 502 });
    }

    // After starting streaming, fire cost logging asynchronously in background
    // Estimate: avg Sterling reply is 80 tokens output
    // Supabase JS calls immediately return promises, which won't block the stream chunk processing.
    supabase.from('api_cost_logs').insert({
        provider: 'deepseek',
        operation: 'sterling_reply',
        units: 80,
        unit_type: 'output_tokens',
        cost_usd: 80 * 0.00000038,  // $0.38 per 1M output tokens
        session_id: req.headers.get('x-session-id') ?? null
    }).then(({ error }) => { if (error) console.error("Logging DeepSeek error", error); });

    supabase.from('api_cost_logs').insert({
        provider: 'elevenlabs',
        operation: 'sterling_tts',
        units: 200,  // avg chars per reply
        unit_type: 'characters',
        cost_usd: 200 * 0.00006,  // $0.06 per 1K chars
    }).then(({ error }) => { if (error) console.error("Logging ElevenLabs error", error); });

    // Stream the response directly back to ElevenLabs
    return new Response(response.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    });
  } catch (error) {
    console.error("[Sterling LLM] Internal Route Error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
