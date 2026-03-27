
import { createClient } from "@/lib/supabase/server";
import { initializePineconeIndex } from "@/lib/pinecone";
import { generateEmbedding } from "@/lib/voyage";
import Anthropic from "@anthropic-ai/sdk";

interface TutorMessage {
    role: "user" | "assistant";
    content: string;
    timestamp: string;
}

interface TutorResponse {
    answer: string;
    sources: Array<{
        lessonTitle: string;
        lessonId: string;
        relevance: number;
    }>;
    suggestedFollowUp: string[];
}

export class AITutorService {
    private pineconeIndex: any;
    private anthropic: Anthropic;

    constructor() {
        this.anthropic = new Anthropic({
            apiKey: process.env.ANTHROPIC_API_KEY!,
        });
    }

    async initialize() {
        this.pineconeIndex = await initializePineconeIndex();
    }

    /**
     * Answer a student question using Agentic RAG (Router -> Search -> Answer)
     */
    async answerQuestion(input: {
        courseId: string;
        userId: string;
        lessonId?: string;
        question: string;
        conversationHistory?: TutorMessage[];
    }): Promise<TutorResponse> {
        const supabase = await createClient(true);
        if (!this.pineconeIndex) {
            await this.initialize();
        }

        console.log(`💬 Processing tutor question: "${input.question.substring(0, 50)}..."`);

        // --- STEP 0: ROUTING AGENT ---
        // Decide intent and optimize query
        const { tutorRouter } = await import("@/lib/ai/tutor-router");
        const routingDecision = await tutorRouter.route(input.question, input.conversationHistory);

        console.log(`🧭 Router Decision:`, routingDecision);

        // FAST PATH: Handle Greetings / Off-Topic instantly
        if (routingDecision.intent === "GREETING" || routingDecision.intent === "OFF_TOPIC" || routingDecision.intent === "GENERAL_ASSISTANCE") {
            const instantReply = routingDecision.immediateResponse || "How can I help you with the course content?";

            // Save interaction (lightweight)
            await this.saveConversation({
                userId: input.userId,
                courseId: input.courseId,
                lessonId: input.lessonId,
                question: input.question,
                answer: instantReply,
                sources: [] // No sources used
            });

            return {
                answer: instantReply,
                sources: [],
                suggestedFollowUp: []
            };
        }

        // --- STEP 1: CONTENT RETRIEVAL (RAG) ---
        // Use the OPTIMIZED query from the router, not the raw input
        const searchString = routingDecision.searchQuery || input.question;

        // Get course metadata
        const { data: course } = await supabase
            .from("courses")
            .select("title, difficulty")
            .eq("id", input.courseId)
            .single();

        // Generate query embedding for the optimized search string
        const questionEmbedding = await generateEmbedding(searchString, "query");

        // Retrieve relevant context from Pinecone
        const queryResponse = await this.pineconeIndex.query({
            vector: questionEmbedding,
            topK: 5,
            filter: {
                courseId: { "$eq": input.courseId },
            },
            includeMetadata: true,
        });

        // Boost current lesson if provided
        const rankedMatches = (queryResponse.matches || [])
            .map((match: any) => ({
                ...match,
                score:
                    match.metadata?.lessonId === input.lessonId
                        ? match.score! * 1.3 // 30% boost for current lesson
                        : match.score!,
            }))
            .sort((a: any, b: any) => b.score - a.score)
            .slice(0, 5);

        // Build context from retrieved chunks
        const context = rankedMatches
            .map((match: any, idx: number) =>
                `[Source ${idx + 1}] (${match.metadata?.lessonTitle}, relevance: ${(match.score * 100).toFixed(0)}%)
${match.metadata?.text}
`
            )
            .join("\n---\n");

        // --- STEP 2: GENERATION ---

        // Build conversation context
        const conversationContext = this.buildConversationContext(
            input.conversationHistory || []
        );

        // Generate response with Claude
        const systemPrompt = this.buildSystemPrompt(course);
        const userPrompt = this.buildUserPrompt({
            question: input.question,
            context,
            conversationContext,
            currentLesson: input.lessonId,
        });

        const response = await this.anthropic.messages.create({
            model: "claude-3-5-sonnet-20240620", // Use latest stable
            max_tokens: 2000,
            temperature: 0.7,
            system: systemPrompt,
            messages: [
                {
                    role: "user",
                    content: userPrompt,
                },
            ],
        });

        const content = response.content[0];
        if (content.type !== "text") {
            throw new Error("Invalid response type from Claude");
        }

        // Parse response
        const parsed = this.parseResponse(content.text);

        // Save conversation
        await this.saveConversation({
            userId: input.userId,
            courseId: input.courseId,
            lessonId: input.lessonId,
            question: input.question,
            answer: parsed.answer,
            sources: rankedMatches.map((m: any) => ({
                lessonTitle: m.metadata?.lessonTitle as string,
                lessonId: m.metadata?.lessonId as string,
                relevance: m.score,
            })),
        });

        // Track analytics
        await this.trackInteraction({
            userId: input.userId,
            courseId: input.courseId,
            lessonId: input.lessonId,
            eventType: "tutor_question_asked",
        });

        return {
            answer: parsed.answer,
            sources: rankedMatches.map((m: any) => ({
                lessonTitle: m.metadata?.lessonTitle as string,
                lessonId: m.metadata?.lessonId as string,
                relevance: m.score,
            })),
            suggestedFollowUp: parsed.followUpQuestions,
        };
    }

    private buildSystemPrompt(course: any): string {
        return `You are an expert AI tutor for the course "${course?.title || 'Unknown Course'}" (${course?.difficulty || 'all'} level). Your role is to help students master AI concepts.

**Teaching Approach:**
- Use the Socratic method: Guide students to discover answers
- Provide clear explanations with concrete examples
- Encourage hands-on experimentation
- Build confidence and normalize mistakes
- Connect concepts to real-world applications

**Your Capabilities:**
- Answer questions using the course content provided (Sources)
- Debug code and explain errors conceptually
- Suggest practical exercises
- British English

**Critical Rules:**
- ALWAYS base answers on the provided course content (sources)
- Never just give answers - guide to understanding
- If uncertain, acknowledge it and suggest resources
- Tie explanations to practical applications

After your response, YOU MUST add a METADATA section in JSON format.`;
    }

    private buildUserPrompt(input: {
        question: string;
        context: string;
        conversationContext: string;
        currentLesson?: string;
    }): string {
        return `${input.conversationContext ? `PREVIOUS CONVERSATION:\n${input.conversationContext}\n\n` : ""}RELEVANT COURSE CONTENT:
${input.context}

${input.currentLesson ? `CURRENT LESSON ID: ${input.currentLesson}\n\n` : ""}STUDENT QUESTION:
${input.question}

Provide a helpful response using the sources. Then add:
METADATA:
{
  "followUpQuestions": ["question1", "question2", "question3"]
}`;
    }

    private buildConversationContext(history: TutorMessage[]): string {
        const recent = history.slice(-6); // Last 3 exchanges
        return recent
            .map((msg) => `${msg.role === "user" ? "Student" : "Tutor"}: ${msg.content}`)
            .join("\n\n");
    }

    private parseResponse(text: string): {
        answer: string;
        followUpQuestions: string[];
    } {
        const parts = text.split("METADATA:");
        const answer = parts[0].trim();

        let followUpQuestions: string[] = [];
        if (parts[1]) {
            try {
                const metadata = JSON.parse(parts[1].trim());
                followUpQuestions = metadata.followUpQuestions || [];
            } catch (e) {
                console.error("Failed to parse metadata:", e);
            }
        }

        return { answer, followUpQuestions };
    }

    private async saveConversation(data: {
        userId: string;
        courseId: string;
        lessonId?: string;
        question: string;
        answer: string;
        sources: any[];
    }): Promise<void> {
        const supabase = await createClient(true);
        let { data: conversation } = await supabase
            .from("tutor_conversations")
            .select("*")
            .eq("user_id", data.userId)
            .eq("course_id", data.courseId)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

        const timestamp = new Date().toISOString();
        const newMessages = [
            {
                role: "user",
                content: data.question,
                timestamp,
            },
            {
                role: "assistant",
                content: data.answer,
                timestamp,
                sources: data.sources,
            },
        ];

        if (!conversation) {
            await supabase.from("tutor_conversations").insert({
                user_id: data.userId,
                course_id: data.courseId,
                lesson_id: data.lessonId,
                conversation_history: newMessages,
                context_used: data.sources,
            });
        } else {
            const updated = [
                ...(conversation.conversation_history || []),
                ...newMessages,
            ];

            await supabase
                .from("tutor_conversations")
                .update({
                    conversation_history: updated,
                    updated_at: timestamp,
                })
                .eq("id", conversation.id);
        }
    }

    private async trackInteraction(data: {
        userId: string;
        courseId: string;
        lessonId?: string;
        eventType: string;
    }): Promise<void> {
        const supabase = await createClient(true);
        await supabase.from("learning_analytics").insert({
            user_id: data.userId,
            course_id: data.courseId,
            lesson_id: data.lessonId,
            event_type: data.eventType,
            event_data: {},
            created_at: new Date().toISOString(),
        });
    }
}
