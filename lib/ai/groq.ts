
import { CourseGenerationRequest, AIGeneratedOutline, AIGeneratedLesson } from '../types/course-generator';

const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite-preview-02-05:generateContent';

export class GroqClient {
  private async makeRequest(prompt: string, isJson: boolean = true) {
    const contents = [{
      parts: [{ text: prompt }]
    }];

    try {
      const response = await fetch(`${GEMINI_URL}?key=${process.env.GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: 0.7,
            responseMimeType: isJson ? "application/json" : "text/plain",
          }
        })
      });

      if (!response.ok) {
        const err = await response.text();
        throw new Error(`Gemini API Error: ${err}`);
      }

      const data = await response.json();
      let text = data.candidates[0].content.parts[0].text;

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
      console.error("Groq/Gemini Request Failed:", e);
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

    const prompt = `Act as an Elite Educational Consultant for Google DeepMind. Your mission is to create a "Best in Class", comprehensive, and deeply detailed academic lesson.
    
    Topic: "${lessonTitle}" within "${topicContext}".
    Level: ${difficulty}
    Language: British English (strict - use "optimise", "programme", "colour", "behaviour", etc.)
    Context: Ensure the content is strictly related to Artificial Intelligence and its applications.
    
    ${difficultyInstructions}
    
    CRITICAL WRITING RULES:
    1. EXTENSIVE DEPTH: The content must be massive, detailed, and exhaustive. MINIMUM ${wordCounts} words (count carefully!).
    2. MICRO-PARAGRAPHS: Every paragraph must be SHORT (2-3 sentences max). Large blocks of text are forbidden.
    3. PARAGRAPH SPACING: Add a blank line (line break) between EVERY paragraph for readability.
    4. NO IN-TEXT BOLDING: Do NOT bold words inside paragraphs. Only headings/subheadings can be bold.
    5. ACADEMIC RIGOR: Use professional, technical, and precise language appropriate to ${difficulty} level.
    6. AGE-APPROPRIATE: Content must be accessible to ages ${difficulty === 'beginner' ? '10-60' : difficulty === 'intermediate' ? '14-60' : '18-60'}.
    
    STRUCTURE REQUIREMENTS:
    1. Introduction: 200-word deep-dive overview with clear value proposition. Break into 3-4 SHORT paragraphs with LINE SPACING.
    2. Main Content: 6 detailed sections. Each section must cover a specific sub-topic in depth.
       - Use frequent spacing between paragraphs.
       - Use <ul>/<ol> lists frequently for readability.
       - Use rich HTML headers (<h3>, <h4>) to structure the long text.
       - EVERY paragraph should be 2-3 sentences maximum.
    3. Instructor Insight: Practical advice from a technical lead persona.
    4. Hands-On Lab: A ${difficulty === 'beginner' ? 'simple, guided' : difficulty === 'intermediate' ? 'moderately complex' : 'complex'} step-by-step practical implementation guide.
    5. Mastery Checklist: 8-10 items for self-assessment.
    6. Practical Application: A detailed real-world case study with quantifiable results.
    7. Data & Analytics: 3 high-impact {label, value} facts/stats.
    8. Reference Library: 4 useful external reference links {type, label, link}.
    9. Visual Strategy: EXACTLY 6 HIGH-QUALITY image prompts (one for each section), ALTERNATING between styles:
       
       PROMPTS 1, 3, 5 - PHOTOREALISTIC HD PHOTOS:
       - Must start with "PHOTOREALISTIC:" prefix
       - Real-world photographs of people, technology, environments
       - Examples: "PHOTOREALISTIC: Professional photograph of a diverse team of data scientists collaborating around multiple monitors displaying neural network visualizations, modern tech office, natural lighting, 8K HD"
       - Examples: "PHOTOREALISTIC: Close-up HD photograph of a robotic arm in a real factory setting, industrial automation, sharp focus, professional photography"
       
       PROMPTS 2, 4, 6 - EDUCATIONAL ILLUSTRATIONS:
       - Must start with "ILLUSTRATION:" prefix  
       - Technical diagrams, infographics, cyber-minimalist aesthetic
       - Examples: "ILLUSTRATION: Educational technical diagram showing the flow of data through a neural network, minimalist style with labeled nodes, clean geometric shapes on dark background"
       - Examples: "ILLUSTRATION: Isometric infographic of machine learning pipeline stages, educational diagram style, clean labels, vector aesthetic"
       
    10. Video Strategy: Provide a highly specific YouTube search term to find a relevant educational video for this lesson.
    
    Return VALID JSON ONLY:
    {
      "title": "Module: ${lessonTitle}",
      "introduction": "html_string_with_line_spacing",
      "sections": [{ "title": "Section Title", "content": "html_string_with_short_paragraphs_and_spacing" }],
      "instructorInsight": { "name": "Dr. Sarah Chen", "title": "AI Research Scientist", "wisdom": "Practical advice" },
      "handsOnChallenge": { "objective": "Apply the concept", "steps": ["Step 1", "Step 2"], "deliverables": "The output" },
      "masteryChecklist": ["Skill 1", "Skill 2"],
      "caseStudy": { "title": "Application", "content": "html", "outcomes": "text", "stats": "text" },
      "stats": [{ "label": "Efficiency Gap", "value": "15%" }],
      "resources": [{ "type": "Paper", "label": "Research", "link": "/docs" }],
      "keyTakeaways": ["Point 1"],
      "imagePrompts": ["PHOTOREALISTIC: prompt 1", "ILLUSTRATION: prompt 2", "PHOTOREALISTIC: prompt 3", "ILLUSTRATION: prompt 4", "PHOTOREALISTIC: prompt 5", "ILLUSTRATION: prompt 6"],
      "videoSearchTerm": "Specific search query to find a relevant educational video on YouTube (e.g. 'Neural Networks explained for beginners')"
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
