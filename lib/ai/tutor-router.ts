
import { GoogleGenerativeAI } from "@google/generative-ai";

interface RouterOutput {
    intent: "COURSE_CONTENT" | "GREETING" | "GENERAL_ASSISTANCE" | "OFF_TOPIC";
    searchQuery?: string;
    reasoning: string;
    immediateResponse?: string;
}

export class TutorRouter {
    private model: any;

    constructor() {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
        // Use Flash for speed and low cost
        this.model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash-lite-preview-02-05", // Or the latest flash model available
            generationConfig: { responseMimeType: "application/json" }
        });
    }

    /**
     * Analyzes user input and conversation history to determine the best action.
     */
    async route(
        userQuestion: string,
        conversationHistory: { role: string; content: string }[] = []
    ): Promise<RouterOutput> {

        const recentHistory = conversationHistory.slice(-4).map(m => `${m.role}: ${m.content}`).join("\n");

        const prompt = `
        You are the "Cortex" of an AI Tutor. Your job is to route user queries (DO NOT answer them yourself unless it's a simple greeting).
        
        ANALYZE the user's latest input based on the context.

        CONTEXT:
        ${recentHistory}

        USER INPUT:
        "${userQuestion}"

        DECISION LOGIC:
        1. "GREETING": If user says "Hi", "Thanks", "Bye" -> Set intent to GREETING. Provide a friendly \`immediateResponse\`.
        2. "COURSE_CONTENT": If user asks a specific question about AI, Code, Concepts, or the Course -> Set intent to COURSE_CONTENT.
           - REWRITE the \`searchQuery\` to be a standalone, keyword-optimized search string.
           - Example: "How does that work?" (Context: Vector DBs) -> "Vector Database technical implementation details"
        3. "GENERAL_ASSISTANCE": If user asks "How do I use this app?" or UI questions -> Set intent to GENERAL_ASSISTANCE.
        4. "OFF_TOPIC": If user asks about cooking/politics -> Set intent to OFF_TOPIC.

        OUTPUT JSON:
        {
            "intent": "COURSE_CONTENT" | "GREETING" | "GENERAL_ASSISTANCE" | "OFF_TOPIC",
            "searchQuery": "string (optimized for vector search, required if COURSE_CONTENT)",
            "reasoning": "brief explanation",
            "immediateResponse": "string (only for GREETING or OFF_TOPIC)"
        }
        `;

        try {
            const result = await this.model.generateContent(prompt);
            const response = result.response;
            const text = response.text();

            return JSON.parse(text) as RouterOutput;
        } catch (error) {
            console.error("Router failed, defaulting to search:", error);
            // Fail-safe: Default to searching for the exact user question
            return {
                intent: "COURSE_CONTENT",
                searchQuery: userQuestion,
                reasoning: "Router fallback error"
            };
        }
    }
}

export const tutorRouter = new TutorRouter();
