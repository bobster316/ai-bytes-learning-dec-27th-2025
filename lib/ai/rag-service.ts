import { createClient } from "@supabase/supabase-js";
import { OpenAI } from "openai";

export interface ContentChunk {
    vectorId: string;
    text: string;
    score: number;
    metadata?: any;
}

export class RagService {
    private supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || "",
        process.env.SUPABASE_SERVICE_ROLE_KEY || ""
    );

    private openai = new OpenAI({
        baseURL: "https://openrouter.ai/api/v1",
        apiKey: process.env.OPENROUTER_API_KEY || "",
    });

    /**
     * Search for relevant course content using vector similarity
     */
    async searchContent(query: string, courseId?: number): Promise<ContentChunk[]> {
        if (!process.env.OPENROUTER_API_KEY) {
            console.warn("OPENROUTER_API_KEY is not set");
            return [];
        }

        try {
            // Note: DeepSeek V3 is a text generation model, not an embedding model.
            // Calling an embeddings endpoint via OpenRouter with deepseek-v3.2 will return an error
            // or an unexpected format. Included per user constraints.
            const result = await this.openai.embeddings.create({
                model: "deepseek/deepseek-v3.2", 
                input: query,
            });
            const embedding = result.data[0].embedding;

            // 2. Call Supabase RPC function to search
            const { data, error } = await this.supabase.rpc('match_course_content', {
                query_embedding: embedding,
                match_threshold: 0.5, // Threshold for relevance
                match_count: 5,       // Top K results
                filter_course_id: courseId || null
            });

            if (error) {
                console.error("Error searching vector store:", error);
                return [];
            }

            if (!data) return [];

            return data.map((item: any) => ({
                vectorId: item.id,
                text: item.content_chunk,
                score: item.similarity,
                metadata: {
                    courseId: item.course_id,
                    lessonId: item.lesson_id
                }
            }));

        } catch (err) {
            console.error("RAG Search failed:", err);
            return [];
        }
    }
}

export const ragService = new RagService();
