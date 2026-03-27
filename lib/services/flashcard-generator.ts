
import { createClient } from "@/lib/supabase/server";
import Anthropic from "@anthropic-ai/sdk";

export interface GeneratedFlashcard {
    front: string;
    back: string;
    cardType: "concept" | "code" | "application" | "definition";
    difficulty: number;
    hint?: string;
    explanation?: string;
    codeExample?: string;
}

export class FlashcardGenerator {
    private anthropic: Anthropic;

    constructor() {
        this.anthropic = new Anthropic({
            apiKey: process.env.ANTHROPIC_API_KEY!,
        });
    }

    /**
     * Generate flashcards for a lesson
     */
    async generateFlashcardsForLesson(lessonId: string): Promise<void> {
        const supabase = await createClient(true);
        console.log(`🃏 Generating flashcards for lesson: ${lessonId}`);

        // Fetch lesson content
        const { data: lesson, error } = await supabase
            .from("course_lessons")
            .select(`
        *,
        topic:course_topics (
          title,
          course:courses (
            id,
            title
          )
        )
      `)
            .eq("id", lessonId)
            .single();

        if (error || !lesson) {
            throw new Error(`Lesson ${lessonId} not found`);
        }

        // Extract content
        const content = this.extractContent(lesson);

        // Generate cards using Claude
        const flashcards = await this.generateCards({
            lessonTitle: lesson.title,
            content,
            courseName: lesson.topic.course.title
        });

        console.log(`[Flashcards] Saving ${flashcards.length} cards for lesson ${lessonId}`);

        // Save to database
        for (const card of flashcards) {
            await supabase.from("flashcards").insert({
                lesson_id: lessonId,
                course_id: lesson.topic.course.id,
                front: card.front,
                back: card.back,
                card_type: card.cardType,
                difficulty: card.difficulty,
                hint: card.hint,
                explanation: card.explanation,
                code_example: card.codeExample,
            });
        }
    }

    private async generateCards(input: {
        lessonTitle: string;
        content: string;
        courseName: string;
    }): Promise<GeneratedFlashcard[]> {
        const response = await this.anthropic.messages.create({
            model: "claude-3-5-sonnet-20240620",
            max_tokens: 3000,
            system: "You are an expert educational designer specializing in spaced repetition and memory retention. Your goal is to create highly atomic, effective flashcards for complex AI concepts.",
            messages: [
                {
                    role: "user",
                    content: `Create 5-8 atomic flashcards for the lesson "${input.lessonTitle}" in the course "${input.courseName}".

CONTENT:
${input.content}

PRINCIPLES:
1. Atomic: Each card tests one single fact or concept.
2. Clear: Front should be a specific prompt. Back should be concise.
3. Diverse: Use concept, code, and application types.

Return JSON array only:
[
  {
    "front": "string",
    "back": "string",
    "cardType": "concept|code|application|definition",
    "difficulty": 1-5,
    "hint": "optional",
    "explanation": "optional",
    "codeExample": "optional"
  }
]`,
                },
            ],
        });

        const content: any = response.content[0];
        try {
            return JSON.parse(content.text);
        } catch (e) {
            console.error("Flashcard JSON parse failed:", content.text);
            return [];
        }
    }

    private extractContent(lesson: any): string {
        try {
            const data = JSON.parse(lesson.content_markdown);
            return (data.contentBlocks || [])
                .map((b: any) => typeof b.content === 'string' ? b.content : JSON.stringify(b.content))
                .join("\n\n");
        } catch {
            return lesson.content_html || "";
        }
    }
}
