import { createClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004" });

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

    /**
     * Search for relevant course content using vector similarity
     */
    async searchContent(query: string, courseId?: number): Promise<ContentChunk[]> {
        if (!process.env.GEMINI_API_KEY) {
            console.warn("GEMINI_API_KEY is not set");
            return [];
        }

        try {
            // 1. Generate embedding for the query
            const result = await embeddingModel.embedContent(query);
            const embedding = result.embedding.values;

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
