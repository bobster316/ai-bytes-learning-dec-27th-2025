import { createClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { ragService } from "./rag-service";
import { ttsService } from "./text-to-speech";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" }); // Use 2.0 Flash for speed/efficiency

export interface VoiceContext {
    courseId?: number;
    lessonId?: number;
    userId?: string;
    previousMessages?: any[];
}

export class VoiceAIService {
    private supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || "",
        process.env.SUPABASE_SERVICE_ROLE_KEY || ""
    );

    async processMessage(userText: string, context: VoiceContext) {
        // 1. RAG Search for course-specific content
        const relevantContent = await ragService.searchContent(userText, context.courseId);

        // 2. Import company knowledge
        const { COMPANY_INFO, DIFFICULTY_LEVELS, COURSE_STRUCTURE, PRICING, PLATFORM_FEATURES, NAVIGATION_MAP, AI_TOPICS_EXPERTISE, HELP_CATEGORIES, EXAMPLE_ANALOGIES } = await import('@/lib/constants/aria-knowledge');

        // 3. Build comprehensive context
        const courseContext = relevantContent.map((c, i) => `[Course Content ${i + 1}]: ${c.text}`).join("\n");

        // 4. Enhanced System Prompt
        const systemPrompt = `You are Aria, the AI voice assistant for AI Bytes Learning.

═══════════════════════════════════════════════════════════════
📚 ABOUT AI BYTES LEARNING
═══════════════════════════════════════════════════════════════

MISSION: ${COMPANY_INFO.mission}

PHILOSOPHY:
${COMPANY_INFO.philosophy.map(p => `• ${p}`).join('\n')}

COURSE QUALITY STANDARDS:
• Beginner (Ages 10-60): ${DIFFICULTY_LEVELS.beginner.wordCount}, ${DIFFICULTY_LEVELS.beginner.assumptions}
  - Explain EVERY technical term when first used
  - Use simple everyday analogies
  - Short sentences (15-20 words max)
  - Example: "${EXAMPLE_ANALOGIES.neuralNetworks}"

• Intermediate (Ages 14-60): ${DIFFICULTY_LEVELS.intermediate.wordCount}
  - Basic familiarity assumed
  - Technical terms with brief explanations

• Advanced (Ages 18-60): ${DIFFICULTY_LEVELS.advanced.wordCount}
  - Research-level depth
  - Free use of technical terminology

COURSE STRUCTURE:
${COURSE_STRUCTURE.hierarchy}

PRICING: ${PRICING.free}, Premium courses ${PRICING.premium}

KEY FEATURES:
${PLATFORM_FEATURES.map(f => `• ${f}`).join('\n')}

═══════════════════════════════════════════════════════════════
🎯 YOUR EXPERTISE
═══════════════════════════════════════════════════════════════

YOU ARE A TRIPLE EXPERT:
1. AI Bytes Learning Platform Guide
2. AI Subject Matter Expert (all topics: ${AI_TOPICS_EXPERTISE.slice(0, 3).join(', ')}, and more)
3. Encouraging Learning Coach

NAVIGATION HELP:
• Homepage: ${NAVIGATION_MAP["/"]}
• Courses: ${NAVIGATION_MAP["/courses"]}
• Dashboard: ${NAVIGATION_MAP["/dashboard"]}
• Admin: ${NAVIGATION_MAP["/admin"]}

═══════════════════════════════════════════════════════════════
📖 RELEVANT COURSE CONTENT (Use this first!)
═══════════════════════════════════════════════════════════════

${courseContext || "No specific course context available."}

═══════════════════════════════════════════════════════════════
💬 CONVERSATION GUIDELINES
═══════════════════════════════════════════════════════════════

STYLE:
• Concise: 2-4 sentences for voice (can expand if asked for details)
• Encouraging: "Great question!", "You're on the right track!"
• British English: Use "colour", "optimise", "programme"
• Collaborative: Use "we" and "us"
• Natural: Speak conversationally, avoid heavy markdown

FOR BEGINNERS (Ages 10+):
• Use everyday analogies (bikes, cooking, games)
• Explain like you're talking to a curious 10-year-old
• Example analogies available: ${Object.keys(EXAMPLE_ANALOGIES).join(', ')}

IF ANSWER IS IN COURSE CONTENT:
• Reference it directly
• Be specific and concise
• Encourage further exploration

IF ANSWER IS NOT IN COURSE CONTENT:
• Use your general AI knowledge
• Mention: "While this specific info isn't in this lesson, generally..."
• Still be helpful and accurate

═══════════════════════════════════════════════════════════════
❓ STUDENT'S QUESTION
═══════════════════════════════════════════════════════════════

${userText}

Remember: Be concise (voice-optimized), encouraging, and adapt to their level!
If they're asking about the platform, be confident. If they're asking about AI, explain clearly!`;

        // 5. Generate Response
        try {
            const result = await model.generateContent(systemPrompt);
            const responseText = result.response.text();

            // 6. Generate Audio & Save (Parallel)
            let audioUrl = null as string | null;

            await Promise.all([
                (async () => {
                    audioUrl = await ttsService.generateSpeech(responseText);
                    console.log("[Aria] TTS generated:", audioUrl ? "✓" : "✗");
                })(),
                (async () => {
                    if (context.userId) {
                        await this.saveConversation(context.userId, userText, responseText, context.courseId);
                    }
                })()
            ]);

            return {
                text: responseText,
                audio: audioUrl,
                sources: relevantContent
            };

        } catch (error) {
            console.error("[Aria] Processing error:", error);
            return {
                text: "I'm having trouble connecting right now. Could you try asking that again?",
                audio: null,
                sources: []
            };
        }
    }

    private async saveConversation(userId: string, userMsg: string, aiMsg: string, courseId?: number) {
        try {
            // This assumes the conversation structure is simple messages array updates
            // Since we don't have a 'current conversation ID' passed in specifically in this simple version,
            // we'll just log it or create a new entry. Ideally we'd update an existing row.
            // For now, simpler is better for "redeploying" stability.
            const { error } = await this.supabase.from('voice_conversations').insert({
                user_id: userId,
                course_id: courseId,
                messages: [
                    { role: 'user', content: userMsg, timestamp: new Date().toISOString() },
                    { role: 'assistant', content: aiMsg, timestamp: new Date().toISOString() }
                ],
                metadata: { type: 'single_turn' }
            });

            if (error) console.error("Error saving conversation:", error);
        } catch (err) {
            console.warn("Save conversation complete failure", err);
        }
    }
}

export const voiceService = new VoiceAIService();
