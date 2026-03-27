
import { createClient } from "@/lib/supabase/server";
import { initializePineconeIndex } from "@/lib/pinecone";
import { generateEmbeddings } from "@/lib/voyage";

interface ContentChunk {
    id: string;
    text: string;
    metadata: {
        courseId: string;
        courseName: string;
        topicId: string;
        topicName: string;
        lessonId: string;
        lessonTitle: string;
        chunkType: "overview" | "concept" | "code" | "example" | "summary";
        order: number;
        text: string;
    };
}

export class CourseIndexer {
    private pineconeIndex: any;

    async initialize() {
        this.pineconeIndex = await initializePineconeIndex();
    }

    /**
     * Index a complete course into Pinecone
     */
    async indexCourse(courseId: string): Promise<void> {
        const supabase = await createClient(true);
        console.log(`📊 Indexing course: ${courseId}`);

        if (!this.pineconeIndex) {
            await this.initialize();
        }

        // Fetch complete course data with topics and lessons
        const { data: course, error } = await supabase
            .from("courses")
            .select(`
        id,
        title,
        description,
        topics:course_topics(
          id,
          title,
          description,
          lessons:course_lessons(
            id,
            title,
            content_markdown
          )
        )
      `)
            .eq("id", courseId)
            .single();

        if (error || !course) {
            throw new Error(`Course ${courseId} not found or error fetching data`);
        }

        // Create semantic chunks
        const chunks = this.createSemanticChunks(course);
        console.log(`  Created ${chunks.length} semantic chunks`);

        // Generate embeddings in batches
        const texts = chunks.map((c) => c.text);
        const embeddings = await generateEmbeddings(texts, "document");
        console.log(`  Generated ${embeddings.length} embeddings`);

        // Prepare vectors for Pinecone
        const vectors = chunks.map((chunk, idx) => ({
            id: chunk.id,
            values: embeddings[idx],
            metadata: {
                ...chunk.metadata,
            },
        }));

        // Upsert to Pinecone in batches
        const batchSize = 100;
        for (let i = 0; i < vectors.length; i += batchSize) {
            const batch = vectors.slice(i, i + batchSize);
            await this.pineconeIndex.upsert(batch);
            console.log(
                `  Indexed batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(vectors.length / batchSize)}`
            );
        }

        // Save indexing metadata in Supabase (assuming the table exists)
        try {
            await supabase.from("ai_tutors").upsert(
                {
                    course_id: courseId,
                    knowledge_base_vector_ids: vectors.map((v) => v.id),
                    embedding_model: "voyage-2",
                    indexed_at: new Date().toISOString(),
                },
                {
                    onConflict: "course_id",
                }
            );
        } catch (e) {
            console.warn("Could not update ai_tutors metadata. Ensure the table exists.");
        }

        console.log(`✅ Course ${courseId} indexed successfully`);
    }

    /**
     * Create semantic chunks from course content
     */
    private createSemanticChunks(course: any): ContentChunk[] {
        const chunks: ContentChunk[] = [];
        let chunkOrder = 0;

        // Course overview chunk
        chunks.push({
            id: `${course.id}-overview`,
            text: `Course: ${course.title}\n\nDescription: ${course.description}`,
            metadata: {
                courseId: course.id,
                courseName: course.title,
                topicId: "",
                topicName: "",
                lessonId: "",
                lessonTitle: "",
                chunkType: "overview",
                order: chunkOrder++,
                text: `Course: ${course.title}\n\nDescription: ${course.description}`
            },
        });

        // Process each topic
        for (const topic of course.topics || []) {
            // Topic overview
            chunks.push({
                id: `${course.id}-${topic.id}-overview`,
                text: `Topic: ${topic.title}\n\nDescription: ${topic.description}`,
                metadata: {
                    courseId: course.id,
                    courseName: course.title,
                    topicId: topic.id,
                    topicName: topic.title,
                    lessonId: "",
                    lessonTitle: "",
                    chunkType: "overview",
                    order: chunkOrder++,
                    text: `Topic: ${topic.title}\n\nDescription: ${topic.description}`
                },
            });

            // Process each lesson
            for (const lesson of topic.lessons || []) {
                const lessonChunks = this.chunkLessonContent(
                    lesson,
                    course,
                    topic,
                    chunkOrder
                );
                chunks.push(...lessonChunks);
                chunkOrder += lessonChunks.length;
            }
        }

        return chunks;
    }

    /**
     * Intelligently chunk lesson content
     */
    private chunkLessonContent(
        lesson: any,
        course: any,
        topic: any,
        startOrder: number
    ): ContentChunk[] {
        const chunks: ContentChunk[] = [];
        const maxChunkSize = 1000; // characters
        let currentChunk = "";
        let lessonData: any = null;

        try {
            lessonData = JSON.parse(lesson.content_markdown);
        } catch (e) {
            console.warn(`Failed to parse lesson content for ${lesson.id}`);
            return [];
        }

        const contentBlocks = lessonData?.contentBlocks || [];

        // Process content blocks
        for (const block of contentBlocks) {
            if (block.blockType === "text") {
                const text = block.content;
                const paragraphs = text.split("\n\n");

                for (const paragraph of paragraphs) {
                    if (currentChunk.length + paragraph.length > maxChunkSize) {
                        if (currentChunk) {
                            chunks.push({
                                id: `${course.id}-${topic.id}-${lesson.id}-${chunks.length}`,
                                text: `Lesson: ${lesson.title}\n\n${currentChunk}`,
                                metadata: {
                                    courseId: course.id,
                                    courseName: course.title,
                                    topicId: topic.id,
                                    topicName: topic.title,
                                    lessonId: lesson.id,
                                    lessonTitle: lesson.title,
                                    chunkType: "concept",
                                    order: startOrder + chunks.length,
                                    text: `Lesson: ${lesson.title}\n\n${currentChunk}`
                                },
                            });
                        }
                        currentChunk = paragraph;
                    } else {
                        currentChunk += (currentChunk ? "\n\n" : "") + paragraph;
                    }
                }
            } else if (block.blockType === "code") {
                const codeText = typeof block.content === 'string' ? block.content : (block.content.code || JSON.stringify(block.content));
                chunks.push({
                    id: `${course.id}-${topic.id}-${lesson.id}-${chunks.length}`,
                    text: `Lesson: ${lesson.title}\n\nCode Example:\n${codeText}`,
                    metadata: {
                        courseId: course.id,
                        courseName: course.title,
                        topicId: topic.id,
                        topicName: topic.title,
                        lessonId: lesson.id,
                        lessonTitle: lesson.title,
                        chunkType: "code",
                        order: startOrder + chunks.length,
                        text: `Lesson: ${lesson.title}\n\nCode Example:\n${codeText}`
                    },
                });
            }
        }

        // Add remaining chunk
        if (currentChunk) {
            chunks.push({
                id: `${course.id}-${topic.id}-${lesson.id}-${chunks.length}`,
                text: `Lesson: ${lesson.title}\n\n${currentChunk}`,
                metadata: {
                    courseId: course.id,
                    courseName: course.title,
                    topicId: topic.id,
                    topicName: topic.title,
                    lessonId: lesson.id,
                    lessonTitle: lesson.title,
                    chunkType: "concept",
                    order: startOrder + chunks.length,
                    text: `Lesson: ${lesson.title}\n\n${currentChunk}`
                },
            });
        }

        return chunks;
    }
}
