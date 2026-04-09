
import { CourseGenerationRequest, AIGeneratedOutline, AIGeneratedLesson } from '../types/course-generator';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

export class GroqClient {
  private async makeRequest(prompt: string, isJson: boolean = true) {
    const messages = [{ role: 'user', content: prompt }];

    try {
      const response = await fetch(`${OPENROUTER_URL}`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
            'HTTP-Referer': 'http://localhost:3000'
        },
        body: JSON.stringify({
          model: 'deepseek/deepseek-v3.2',
          messages,
          temperature: 0.7,
          ...(isJson ? { response_format: { type: "json_object" } } : {})
        })
      });

      if (!response.ok) {
        const err = await response.text();
        throw new Error(`OpenRouter API Error: ${err}`);
      }

      const data = await response.json();
      let text = data.choices[0].message.content;

      if (isJson) {
        // Aggressive cleaning: strip markdown fences, extra whitespace, and potential prose
        text = text.replace(/```json\n?|```/g, "").trim();

        // Try to extract JSON if it's embedded in text
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          text = jsonMatch[0];
        }

        try {
          return JSON.parse(text);
        } catch (jsonErr) {
          console.error("=== JSON PARSE ERROR ===");
          console.error("Error:", jsonErr);
          console.error("Raw text length:", text.length);
          console.error("First 500 chars:", text.substring(0, 500));
          console.error("Last 500 chars:", text.substring(Math.max(0, text.length - 500)));
          console.error("========================");
          throw new Error(`Failed to parse AI response as JSON: ${jsonErr instanceof Error ? jsonErr.message : String(jsonErr)}`);
        }
      }
      return text;
    } catch (e) {
      console.error("OpenRouter/DeepSeek Request Failed:", e);
      throw e;
    }
  }

  async generateDescription(title: string, difficulty: string): Promise<string> {
    const prompt = `Act as an expert educational consultant specialized in Artificial Intelligence. 
    Generate a compelling, exactly 2-sentence course description for a course titled "${title}" at ${difficulty} level.
    IMPORTANT: This platform is EXCLUSIVELY for AI (Artificial Intelligence) education. 
    If the title "${title}" is not clearly related to AI, REFRAME it to focus on an AI application of that topic (e.g. "Cooking" -> "AI-Driven Culinary Arts").
    Focus on value proposition and learning outcomes. Return ONLY the text.`;
    return await this.makeRequest(prompt, false);
  }

  async generateOutline(input: CourseGenerationRequest): Promise<AIGeneratedOutline> {
    const counts = { topics: 4 };

    const prompt = `Act as a Google Learning Experience Designer specialized in AI. Create a Professional Specialization Roadmap for: "${input.courseName}". 
    
    CRITICAL REQUIREMENT: This course MUST be about Artificial Intelligence.
    If the topic "${input.courseName}" is not explicitly AI-related, you MUST pivot the curriculum to focus on AI applications in that field.
    Example: "History" -> "AI Analysis of Historical Data", "Gardening" -> "Smart AI Agriculture Systems".

    The architecture must be helpful, accessible, and structured for career growth.
    
    Level: ${input.difficultyLevel}
    Language: British English (strict)
    
    STRUCTURE REQUIREMENTS: 
    - Exactly ${counts.topics} Functional Domains (Topics).
    - Each Domain contains 2-3 specific Growth Modules (Lessons).
    - Titles: Clear, professional, and action-oriented.
    
    TOPIC DESCRIPTION FORMAT (CRITICAL):
    - Each topic description must be divided into 3-4 SHORT paragraphs
    - Each paragraph should be 3-4 sentences maximum
    - Add a BLANK LINE (line break) between each paragraph
    - Total length: MINIMUM 150 words per topic description
    - Format in HTML with proper <p> tags and spacing
    - Example format:
      "<p>First paragraph with 3-4 sentences introducing the topic.</p>
      
      <p>Second paragraph expanding on key concepts with 3-4 sentences.</p>
      
      <p>Third paragraph explaining practical applications with 3-4 sentences.</p>
      
      <p>Optional fourth paragraph with learning outcomes or summary.</p>"
    
    Format your response as VALID JSON. You MUST return ALL ${counts.topics} topics, and each topic MUST contain 2-3 lessons:
    {
      "courseOverview": "A 100-word helpful and encouraging introduction to this AI-focused specialization in British English.",
      "learningObjectives": ["Operational Skill 1", "Technical Competency 2", "Leadership Attribute 3"],
      "topics": [
        {
          "title": "Functional Domain Name",
          "description": "<p>First paragraph (3-4 sentences) introducing this module...</p>\n\n<p>Second paragraph (3-4 sentences) explaining key concepts...</p>\n\n<p>Third paragraph (3-4 sentences) on practical applications...</p>",
          "lessons": [
            { "title": "Growth Module Name", "description": "Practical learning outcome.", "keywords": ["unique descriptive keyword 1"] }
          ]
        }
      ]
    }`;
    return await this.makeRequest(prompt);
  }

  async generateLessonContent(lessonTitle: string, topicContext: string, difficulty: string): Promise<AIGeneratedLesson> {
    // Updated word counts and difficulty-specific instructions
    const wordCounts = difficulty === 'beginner' ? '800' : difficulty === 'intermediate' ? '900' : '1000';

    const difficultyInstructions = {
      beginner: `
      BEGINNER LEVEL CRITICAL RULES:
      - Assume ZERO prior knowledge of this subject
      - Explain EVERY technical term when first used
      - Use simple, everyday analogies (suitable for ages 10-60)
      - Short sentences (15-20 words max)
      - Avoid jargon - if you must use it, explain it immediately
      - Think: "Could a 10-year-old understand this?"
      - Use concrete examples from daily life
      - No assumptions about computer science or technical background`,

      intermediate: `
      INTERMEDIATE LEVEL RULES:
      - Assume basic familiarity with core concepts
      - Introduce some technical terminology with brief explanations
      - More complex examples and scenarios
      - Connect concepts to practical applications
      - Suitable for ages 14-60 with some exposure to the topic`,

      advanced: `
      ADVANCED LEVEL RULES:
      - Assume strong foundational knowledge
      - Use technical terminology freely
      - Deep theoretical and practical insights
      - Complex real-world applications
      - Research-level depth where appropriate`
    }[difficulty] || '';

    const prompt = `SYSTEM: You are an elite instructional designer for AI Bytes Learning. Your mission is to produce a SINGLE LESSON as a structured JSON object containing an array of content blocks.

    Topic: "${lessonTitle}" within "${topicContext}".
    Level: ${difficulty}
    Language: British English (strict - use "optimise", "programme", "colour", "behaviour", etc.)
    Context: Ensure the content is strictly related to Artificial Intelligence and its applications.
    
    ${difficultyInstructions}

    CRITICAL: Do NOT produce a markdown essay. Produce an array of typed blocks that map directly to UI components. The lesson should feel like an interactive tech magazine, NOT a textbook. The total lesson should be equivalent to ${wordCounts} words. Never write long walls of text.

    BLOCK TYPES AVAILABLE (use a healthy mix — variety is key):
    - "text": Short prose (1-3 sentences max per paragraph). If you include a code snippet, you MUST provide explanatory scaffolding before AND after the code.
    - "full_image": Full-width image with caption. Must be highly instructional (diagrams, flowcharts).
    - "image_text_row": Side-by-side instructional image + text (use reverse:true to alternate).
    - "type_cards": 2-3 cards for comparing concepts. Use this instead of long bulleted lists!
    - "callout": Tip or warning box. Use frequently to break up text and highlight pitfalls.
    - "industry_tabs": Tabbed real-world examples across different industries.
    - "quiz": Inline knowledge check (1 question with image context).
    - "key_terms": Glossary of 4-6 terms introduced in the lesson.
    - "objective": The learning objective statement.
    - "recap": 3 absolute core insights to remember. DO NOT just recap headings. Distil the most valuable, actionable takeaways.
    - "completion": End-of-lesson celebration with XP and skills gained.

    STRUCTURE RULES - STRICT ATTENTION REQUIRED:
    1. Start with an "objective" block, then a "text" block that hooks the reader.
    2. PACING: Never put more than 2 "text" blocks in a row. Aggressively break up prose using "callout", "type_cards", or "image_text_row" blocks.
    3. INTERLEAVED QUIZZES: Insert a 1-question "quiz" block immediately after every major conceptual section to test retention. Do not save them all for the end.
    4. INSTRUCTIONAL VISUALS: Images must teach, not just decorate. Every imagePrompt must be highly specific and instructional. Use prefixes: "DIAGRAM: Educational flowchart showing...", "INFOGRAPHIC: clean minimalist breakdown of...", or "TECHNICAL ILLUSTRATION: ...". Avoid generic or decorative sci-fi art.
    5. End the lesson strictly with a "recap" block, then "key_terms", then the "completion" block.
    6. CODE SCAFFOLDING: If writing code in a text block, you must explain what the code does before it, and explain the expected output/implications after it. No isolated code blocks.

    OUTPUT: Return ONLY a valid JSON object matching exactly this schema:
    {
      "blocks": [
        {
          "type": "text | full_image | image_text_row | type_cards | callout | industry_tabs | quiz | key_terms | objective | completion",
          "id": "unique string id",
          "order": number,
          ... include other relevant fields based on block type such as "paragraphs" for text, "imagePrompt" for full_image, etc.
        }
      ],
      "metadata": {
        "estimatedDuration": number,
        "imagePrompts": ["list", "all", "imagePrompts", "used", "in", "any", "block", "here"]
      }
    }`;
    return await this.makeRequest(prompt);
  }

  async generateTopicQuiz(topicTitle: string, lessonContexts: string[], difficulty: string) {
    const prompt = `Act as an Assessment Specialist. Create a comprehensive quiz for the topic "${topicTitle}".
    
    Context: Based on lessons: ${lessonContexts.join(', ')}.
    Level: ${difficulty}
    Language: British English (strict - use "colour", "analyse", etc.)
    Topic Domain: Artificial Intelligence.
    
    REQUIREMENTS:
    - Generate EXACTLY 5 questions.
    - Mix of conceptual and practical scenario-based questions.
    - 4 Options per question.
    - 1 Correct Answer per question.
    - Clear explanation for the correct answer.
    
    Return VALID JSON:
    {
      "questions": [
        { 
          "question": "Question text", 
          "options": ["A", "B", "C", "D"], 
          "correctAnswer": "A", 
          "explanation": "Reasoning...", 
          "difficulty": "medium" 
        }
      ]
    }`;
    return await this.makeRequest(prompt);
  }
}

export const aiClient = new GroqClient();
