import { OpenAI } from "openai";

export interface AccuracyAuditResult {
    score: number; // 0-100
    findings: Array<{
        type: "contradiction" | "omission" | "oversimplification" | "improvement";
        severity: "low" | "medium" | "high";
        description: string;
        quoteFromLesson: string;
        quoteFromNarration: string;
    }>;
    summary: string;
}

export class ContentAccuracyService {
    private static openai = new OpenAI({
        baseURL: "https://openrouter.ai/api/v1",
        apiKey: process.env.OPENROUTER_API_KEY || "",
    });

    /**
     * Audit a lesson's text against its AI overview narration
     */
    static async audit(lessonText: string, narrationTranscript: string): Promise<AccuracyAuditResult> {
        const prompt = `
            You are a technical editor and educational integrity auditor for AI Bytes Learning.
            Your task is to compare a LESSON TEXT against an AI-GENERATED NARRATION (Transcript).
            
            GOAL: Ensure the narration is faithful to the lesson. It should be engaging but NOT contradict or excessively oversimplify the core educational concepts.
            
            ### LESSON TEXT:
            ${lessonText}
            
            ### NARRATION TRANSCRIPT:
            ${narrationTranscript}
            
            ### AUDIT CRITERIA:
            1. CONTRADICTION: Does the narration say something logically opposite or different from the text? (HIGH SEVERITY)
            2. OMISSION: Did the narration skip a CRITICAL concept defined in the lesson? (MEDIUM SEVERITY)
            3. OVERSIMPLIFICATION: Did the narration water down a complex concept to the point of being technically inaccurate? (MEDIUM SEVERITY)
            4. TONE: Does the narration feel premium and visionary as per the brand?
            
            Return a JSON object with:
            - score: 0-100 (100 is perfect fidelity)
            - findings: Array of { type, severity, description, quoteFromLesson, quoteFromNarration }
            - summary: A 2-sentence executive summary of the audit.
        `;

        try {
            const result = await this.openai.chat.completions.create({
                model: "deepseek/deepseek-v3.2",
                messages: [{ role: "user", content: prompt }],
                response_format: { type: "json_object" }
            });
            const text = result.choices[0].message.content;
            if (!text) throw new Error("Empty response from OpenRouter");
            return JSON.parse(text);
        } catch (error) {
            console.error("Accuracy Audit Failed:", error);
            return {
                score: 0,
                findings: [],
                summary: "Audit engine failed to initialize signal: " + (error as Error).message
            };
        }
    }
}
