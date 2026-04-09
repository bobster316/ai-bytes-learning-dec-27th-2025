import {
    CourseGenerationInput,
    CourseStructure,
    TopicPlan,
    LessonPlan,
    ConceptExplanation,
    CodeImplementation,
    VisualizationSpec,
    AssessmentSuite,
    VideoScript,
    CompletedLesson,
    CompleteCourse
} from '../types/course-upgrade';
import { ContentValidator } from './content-validator';
import { VideoGenerationService } from '../services/video-generation';
import { instance as cache } from '../cache/cache-service';
import { getEnhancedPlanningPrompt } from './prompts/enhanced-planning-prompt';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL_NAME = 'deepseek/deepseek-v3.2';

// ⚙️ FEATURE FLAG: Enhanced Prompt System (Tier 1 Improvements)
// Set to TRUE to enable improved quality verification, pedagogical architecture, and industry grounding
// Set to FALSE to revert to original prompt (100% safe fallback)
const USE_ENHANCED_PROMPTS = process.env.USE_ENHANCED_PROMPTS === 'true' || false;

// --- Concurrency Helper ---
/**
 * Processes items concurrently with a strictly limited number of active workers.
 */
async function mapConcurrent<T, R>(items: T[], limit: number, fn: (item: T, index: number) => Promise<R>): Promise<R[]> {
    const results: R[] = new Array(items.length);
    let index = 0;

    const worker = async () => {
        while (index < items.length) {
            const current = index++;
            try {
                results[current] = await fn(items[current], current);
            } catch (e) {
                console.error(`Concurrent worker failed at index ${current}:`, e);
                throw e; // Propagate error to stop orchestrator
            }
        }
    };

    const workers = Array.from({ length: Math.min(limit, items.length) }, () => worker());
    await Promise.all(workers);
    return results;
}

function sanitizeJson(text: string): string {
    // 1. Extract content between first { and last }
    let json = text;
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');

    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        json = text.substring(firstBrace, lastBrace + 1);
    }

    // 2. Remove markdown code block markers if present
    json = json.replace(/^```json\s*/, '').replace(/\s*```$/, '');

    // 3. Handle unescaped control characters in strings
    let sanitized = "";
    let inString = false;
    for (let i = 0; i < json.length; i++) {
        const char = json[i];
        if (char === '"' && (i === 0 || json[i - 1] !== '\\')) {
            inString = !inString;
            sanitized += char;
        } else if (inString) {
            if (char === '\n') sanitized += '\\n';
            else if (char === '\r') sanitized += '\\r';
            else if (char === '\t') sanitized += '\\t';
            else if (char === '\\' && (i + 1 < json.length && !(/["\\\/bfnrtu]/.test(json[i + 1])))) {
                sanitized += '\\\\';
            } else sanitized += char;
        } else {
            sanitized += char;
        }
    }

    // 4. Fix trailing commas
    sanitized = sanitized.replace(/,\s*([\]\}])/g, "$1");

    // 5. Fix common "missing comma between objects" error in arrays
    sanitized = sanitized.replace(/\}\s*\{/g, "},{");
    sanitized = sanitized.replace(/\]\s*\[/g, "],[");

    // 6. Fix missing commas between array elements in lists of strings
    sanitized = sanitized.replace(/"\s*"/g, '", "');

    return sanitized;
}

abstract class BaseAgent {
    protected async makeRequest(prompt: string, isJson: boolean = true, allowRepair: boolean = true) {
        const messages = [{ role: 'user', content: prompt }];

        if (!process.env.OPENROUTER_API_KEY) {
            console.error("CRITICAL: OPENROUTER_API_KEY is missing in BaseAgent!");
            throw new Error("OPENROUTER_API_KEY is missing");
        }

        // --- Timeout & Retry Logic ---
        const MAX_RETRIES = 3;
        const TIMEOUT_MS = 60000; // 60 seconds strict timeout

        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

            try {
                const response = await fetch(`${OPENROUTER_URL}`, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                        'HTTP-Referer': 'http://localhost:3000'
                    },
                    body: JSON.stringify({
                        model: MODEL_NAME,
                        messages,
                        temperature: 0.7,
                        max_tokens: 8000,
                        ...(isJson ? { response_format: { type: "json_object" } } : {})
                    }),
                    signal: controller.signal
                });

                clearTimeout(timeoutId);

                // Handle Rate Limiting (429) & Server Overload (503)
                if (response.status === 429 || response.status === 503) {
                    const delay = attempt * 2000; // Linear backoff
                    console.warn(`[BaseAgent] API ${response.status} (Attempt ${attempt}/${MAX_RETRIES}). Retrying in ${delay}ms...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    continue; // Retry
                }

                if (!response.ok) {
                    const errText = await response.text();
                    const shortErr = errText.substring(0, 200);
                    // Don't retry 400s (Client Error) or 500 (Internal) unless we want to be aggressive
                    // Usually 500 from Gemini is transient, so maybe we retry?
                    // Let's retry 500s too.
                    if (response.status >= 500) {
                        console.warn(`[BaseAgent] API ${response.status} (Attempt ${attempt}). Retrying...`);
                        await new Promise(resolve => setTimeout(resolve, 1000));
                        continue;
                    }

                    console.error(`[BaseAgent] API Error: Status ${response.status} ${response.statusText}`);
                    throw new Error(`${this.constructor.name} API Error ${response.status}: ${shortErr}`);
                }

                const data = await response.json();
                let text = data.choices?.[0]?.message?.content;

                if (!text) throw new Error("Empty response from OpenRouter API");

                if (isJson) {
                    try {
                        // 1. Try direct parse
                        return JSON.parse(text);
                    } catch (initialErr) {
                        try {
                            // 2. Try sanitization (strip markdown blocks)
                            const sanitized = sanitizeJson(text);
                            return JSON.parse(sanitized);
                        } catch (midErr) {
                            try {
                                // 3. Last resort: Regex extract the largest object/array
                                const match = text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
                                if (match) {
                                    return JSON.parse(match[0]);
                                }
                                throw midErr;
                            } catch (finalErr: any) {
                                console.error(`${this.constructor.name} JSON Parse Error:`, finalErr.message);

                                // --- SELF-HEALING MECHANISM ---
                                if (allowRepair) {
                                    console.warn(`${this.constructor.name}: Attempting Self-Healing for JSON syntax error...`);
                                    try {
                                        const repaired = await this.repairJson(text, finalErr.message);
                                        return repaired;
                                    } catch (repairErr) {
                                        console.error(`${this.constructor.name}: Self-Healing Failed.`, repairErr);
                                        throw new Error(`${this.constructor.name} failed to return valid JSON (Repair failed): ${finalErr.message}`);
                                    }
                                }

                                throw new Error(`${this.constructor.name} failed to return valid JSON: ${(finalErr as any).message}`);
                            }
                        }
                    }
                }
                return text;

            } catch (e: any) {
                clearTimeout(timeoutId);

                // Handle AbortError (Timeout)
                if (e.name === 'AbortError') {
                    console.error(`[BaseAgent] Request timed out after ${TIMEOUT_MS}ms (Attempt ${attempt}/${MAX_RETRIES})`);
                    if (attempt < MAX_RETRIES) continue;
                    throw new Error(`${this.constructor.name}: Request timed out.`);
                }

                // If it's a parse error or config error, don't retry
                if (e.message.includes("valid JSON") || e.message.includes("API Key")) throw e;

                // Network errors - retry
                console.error(`${this.constructor.name} Network/Fetch Error (Attempt ${attempt}):`, e.message);
                if (attempt < MAX_RETRIES) {
                    await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
                    continue;
                }
                throw e;
            }
        }
    }

    abstract generate(...args: any[]): Promise<any>;

    // Private method to repair broken JSON using the LLM itself
    private async repairJson(invalidJson: string, errorMessage: string): Promise<any> {
        const repairPrompt = `SYSTEM: You are a JSON Syntax Repair Engine.
        ERROR: ${errorMessage}
        
        TASK: Fix the JSON syntax errors in the provided text.
        - Fix unescaped double quotes inside strings.
        - Fix missing commas.
        - Fix unescaped newlines.
        - Do NOT change the content/values, only the syntax.
        
        INVALID JSON:
        ${invalidJson.slice(0, 50000)}... (truncated if too long)
        
        RETURN ONLY THE VALID JSON OBJECT.`;

        // Request text repair, but treat response as JSON. 
        // We set allowRepair=false to prevent infinite loops.
        return await this.makeRequest(repairPrompt, true, false);
    }
}

// 1. Planning Agent - Course Structure
export class PlanningAgent extends BaseAgent {
    async generate(input: CourseGenerationInput): Promise<CourseStructure> {
        // ⚙️ FEATURE FLAG: Use enhanced or original prompt
        const prompt = USE_ENHANCED_PROMPTS
            ? getEnhancedPlanningPrompt({
                courseName: input.courseName,
                difficultyLevel: input.difficultyLevel,
                topicCount: input.topicCount || 2,
                lessonsPerTopic: input.lessonsPerTopic || 2,
                userContext: input.userContext
            })
            : `SYSTEM ROLE:
    You are the Lead Curriculum Architect at AI Bytes Learning. You create concise, high-impact micro-courses.

    INPUT PARAMETERS:
    COURSE: "${input.courseName}"
    DIFFICULTY: ${input.difficultyLevel.toUpperCase()}
    DURATION: MAX 60 MINUTES (Fixed Structure)
    ${input.userContext ? `CONTEXT: ${JSON.stringify(input.userContext)}` : ''}

    I. COURSE ARCHITECTURE (STRICT)
    1. TOTAL MODULES: Exactly ${input.topicCount || 2}
    2. TOPICS PER MODULE: Exactly ${input.lessonsPerTopic || 2}
    3. TOTAL TOPICS: ${(input.topicCount || 2) * (input.lessonsPerTopic || 2)}

    II. CONTENT QUALITY ENFORCEMENT
    A. HUMAN VOICE SIGNATURES (PRECISELY DEFINED)
    HUMAN VOICE SIGNATURE = Industry-observed insight that requires:
    1. Nuance beyond generic best practices
    2. Implementation tradeoffs from real deployments
    3. Patterns observed across multiple organizations
    4. Evolution of methodology over time
    REQUIRED: 3+ signatures per lesson.

    B. ANTI-AI PHRASE ENFORCEMENT - ABSOLUTE BAN
    ABSOLUTELY BANNED - CONTENT WILL BE REJECTED IF FOUND:
    • Demystify, Demystifying, Demystified (CRITICAL VIOLATION - NEVER USE)
    • Unpacking, Unlocking, Mastering, Harnessing, Master, Mastery
    • Leveraging, Diving deep, Journey, Landscape, Exploring
    • Navigating, Empowering, Revolutionizing, Game-changing
    • Next-level, Elevating, Deep dive, Unleashing, Decoding
    • Toolkit, Arsenal, Swiss Army knife, North Star, Blueprint (unless literal)
    • "In this lesson...", "Let's...", "Imagine..." (Avoid meta-talk)
    
    CRITICAL INSTRUCTION: Scan your final output. If "Demystify" or "Demystifying" appears, DELETE IT or replace with "Explain" or "Clarify" before returning.

    III. COURSE ARCHITECTURE TEMPLATE
    A. PRE-COURSE ELEMENTS
    1. COURSE THUMBNAIL PROMPT (CRITICAL VISUAL DIRECTION)
       BRAND IDENTITY: AI Bytes Learning — premium microlearning for business professionals.
       MANDATORY STYLE RULES:
       - Primary colours: Teal/cyan (#00BCD4) and purple (#6B3FA0) dominant throughout
       - Background: Deep dark navy (#0D1117) or dark slate — ALWAYS dark
       - Style: Clean, minimal, sophisticated cinematic digital illustration or premium 3D render
       - Lighting: Cinematic depth with subtle glow effects and teal/purple accent lighting
       - Composition: Geometric or architectural abstract elements, uncluttered, wide 16:9
       - Absolutely NO text, letters, numbers, or words anywhere in the image
       - Absolutely NO clipart, cartoon, or generic stock photo aesthetic
       - FORBIDDEN: Generic glowing brains, random circuit boards, matrix code, abstract mesh blobs
       - REQUIREMENT: Topic-specific abstract visual metaphor. Use this lookup:
         AI Strategy → Chess pieces, architectural blueprints, interconnected nodes on dark background
         Machine Learning → Neural network nodes, glowing data flows, pattern recognition grids
         AI Ethics → Scales of justice, protective shields, human silhouettes in teal light
         Business/ROI → Abstract ascending geometric forms, crystalline value chains
         Data/Analytics → Flowing teal data streams, particle systems, crystalline structures
         AI Implementation → Layered geometric frameworks, precision systems glowing in purple
         NLP → Abstract wave forms, communication nodes, text flow visualisations
         Computer Vision → Abstract scanning beams, geometric recognition patterns
         AI Leadership → Summit/peak imagery, compass elements, strategic horizon in teal
         Automation → Precision clockwork, efficiency flow patterns in purple/teal
    2. COURSE HEADER (16:9)
    3. COURSE AT-A-GLANCE (Competency, Time, Artifact, Prerequisites)
    4. PRE-COURSE DIAGNOSTIC (5 scenarios)

    B. COURSE INTRODUCTION (100-120 WORDS)
    MUST CONTAIN:
    • Verified industry demand, Target roles, Business outcomes, ROI justification framework.
    • NOTE: This must be EXACTLY 100-120 words as it will be used for a 45-second AI Avatar intro.

    C. ALUMNI SUCCESS STORIES (90-110 WORDS)
    Include 3 distinct profiles following this structure:
    [Role/Industry/Organization Size]:
    Outcome: [Specific measurable achievement]
    Timeline: [Weeks/months to impact]
    Career advancement: [Promotion, role change, or expanded responsibility]

    Return ONLY a valid JSON object matching the CourseStructure interface:
    {
      "refinedCourseTitle": "string (Professional, high-converting, MAX 7 WORDS)",
      "courseMetadata": {
        "category": "string (MUST be one of: AI Foundations & Fundamentals, Generative AI & LLMs, Prompt Engineering, AI Tools & Applications, AI for Business & Strategy, AI Ethics & Governance, AI Agents & Automation, NLP & Conversational AI, Computer Vision & Image AI, AI in Industry Applications, Data & AI Fundamentals, AI Product Development)",
        "estimatedComplexity": number,
        "recommendedPrerequisites": ["string"],
        "learningObjectives": ["string"],
        "practicalOutcomes": ["string"],
        "seo": {
          "title": "string (SEO-friendly, MAX 60 chars, include primary keyword, no clickbait)",
          "description": "string (SEO meta description, 140-160 chars, benefits-led, natural language)",
          "keywords": ["string (8-14 short, relevant keywords/phrases, no stuffing)"],
          "slug": "string (lowercase, hyphenated, no stopwords)"
        },
        "thumbnailPrompt": "string (A detailed, high-fidelity prompt for a photorealistic course thumbnail. Describe the subject, lighting, and style. NO text in image. NO generic AI nodes.)"
      },
      "topics": [{
        "topicName": "string (Module Title, MAX 7 WORDS)",
        "topicOrder": number,
        "description": "string",
        "learningOutcomes": ["string"],
        "estimatedDuration": 20,
        "topicType": "core",
        "moduleImagePrompt": "string (Premium cinematic digital illustration for this specific module. MANDATORY: Dark navy background (#0D1117), teal/cyan (#00BCD4) and purple (#6B3FA0) colour palette, cinematic atmospheric lighting, abstract geometric elements relevant to the module topic, NO text anywhere, NO clipart, sophisticated and minimal. Use a topic-appropriate visual metaphor from the lookup table above.)",
        "moduleSynthesis": "string",
        "lessons": [{
          "lessonTitle": "string (Topic Title)",
          "lessonOrder": number,
          "learningObjectives": ["string"],
          "keyConceptsToCover": ["string"],
          "prerequisites": ["string"],
          "estimatedDifficulty": number,
          "estimatedDuration": 15,
          "practicalApplications": ["string"]
        }]
      }]
    }`;

        console.log(`[PlanningAgent] Using ${USE_ENHANCED_PROMPTS ? 'ENHANCED' : 'ORIGINAL'} prompt system`);
        return await this.makeRequest(prompt) as CourseStructure;
    }
}

// 2. Concept Explainer Agent
export class ConceptExplainerAgent extends BaseAgent {
    async generate(lesson: LessonPlan, moduleTitle: string, courseContext: CourseStructure): Promise<ConceptExplanation> {
        const prompt = `SYSTEM ROLE:
    You are the Lead Curriculum Architect at AI Bytes Learning.
    Your mission is to create a high-velocity micro-learning lesson (Target: 180-250 words).

    CRITICAL CONFIGURATION:
    WORD COUNT TARGET: 180-250 WORDS (Strict limit)
    PEDAGOGICAL FLOW: 9-Section Anatomy
    
    SIMPLICITY MANDATE: 
    - No PhD, No Code background.
    - Use analogies from everyday life (Pizza, Cars, Cooking).
    - If you must use a technical term, explain it in ONE sentence.

    INPUT CONTEXT:
    LESSON: "${lesson.lessonTitle}"
    MODULE: "${moduleTitle}"
    OBJECTIVE: ${lesson.microObjective}
    ACTION: ${lesson.lessonAction}

    I. MANDATORY LESSON ANATOMY (Markdown for 'topicContent')
    You must generate exactly 5 blocks in this order:

    1. THE HOOK (40-50 words)
       - Why this matters right NOW. Use a bold statement or question.
       - Insert marker: [IMAGE: Metaphor]

    2. CORE CONCEPT (50-60 words)
       - The "What & Why". Define the concept using a plain English analogy.
       - Insert marker: [IMAGE: Diagram]

    3. REAL-WORLD EXAMPLE (50-60 words)
       - A specific business scenario or tool application. Use names (e.g., "A marketing lead at TechCorp...").
       - Insert marker: [IMAGE: Example]

    4. THE ACTION BLOCK (40-50 words)
       - Step-by-step how to apply this. Start with a verb.
       
    5. KEY TAKEAWAY (10-20 words)
       - One bold, memorable sentence.

    II. IMAGE PLACEMENT (CRITICAL)
    - Distribute exactly 3 markers: [IMAGE: Metaphor], [IMAGE: Diagram], [IMAGE: Example].
    - These correlate to the 3 prompts in the 'imagePrompts' array.

    III. ANTI-AI PHRASE BAN (CRITICAL)
    - NEVER USE: Demystify, Unpack, Unlock, Harnessing, Journey, Deep Dive, Navigating, Landscape.

    Return JSON ONLY MATCHING THIS SCHEMA:
    {
        "topicContent": "string (Markdown with 3 [IMAGE: type] markers)",
        "introduction": "string (Avatar script bridge)",
        "wordCount": number,
        "topicType": "foundation" | "application",
        "keyTakeaway": "string",
        "humanVoiceSignature": "string",
        "imagePrompts": [
            {
                "imageNumber": 1,
                "imageType": "Metaphor" | "Diagram" | "Example",
                "prompt": "string (Dark navy background, teal/purple accents, no text)",
                "purpose": "string",
                "technicalSpecs": "string"
            }
        ],
        "discussionPrompt": "string",
        "nextTopicTeaser": "string"
    }`;
        return await this.makeRequest(prompt) as ConceptExplanation;
    }
}

// 3. Code Architect Agent
export class CodeArchitectAgent extends BaseAgent {
    async generate(lesson: LessonPlan, explanation: ConceptExplanation): Promise<CodeImplementation> {
        const prompt = `Act as a Senior AI Software Engineer.Generate production - quality, educational Python code for:
            TOPIC: "${lesson.lessonTitle}"
        CONTEXT: Key Takeaway: "${explanation.keyTakeaway}"

        CREATE:
        1. Introduction Example(minimal).
    2. Guided Implementation(step - by - step).
    3. Practical Challenge(with # TODO).
    
    All code must be self - contained and runnable.Use modern libraries(PyTorch, Transformers, etc.)
    
    Return ONLY a valid JSON object matching the CodeImplementation interface, with no other text or explanation:
        {
            "introductionExample": { "title": "string", "description": "string", "code": "string", "expectedOutput": "string", "keyTakeaways": ["string"] },
            "guidedImplementation": { "title": "string", "description": "string", "steps": [{ "stepNumber": 1, "explanation": "string", "code": "string", "output": "string" }] },
            "practicalChallenge": { "title": "string", "scenario": "string", "starterCode": "string", "testCases": [], "hints": ["string"], "solution": "string", "learningObjective": "string" },
            "dependencies": { "packages": ["string"], "systemRequirements": ["string"] }
        } `;
        return await this.makeRequest(prompt) as CodeImplementation;
    }
}

// 4. Visual Designer Agent
export class VisualDesignerAgent extends BaseAgent {
    async generate(lesson: LessonPlan, explanation: ConceptExplanation): Promise<VisualizationSpec[]> {
        const prompt = `Act as a Lead Instructional Designer at AI Bytes Learning.
    Your task is to design EXACTLY 3 "Instructional-only" visuals for the lesson: "${lesson.lessonTitle}".
    
    VISUAL REQUIREMENTS:
    1. Hook: Conceptual illustration of the everyday metaphor.
    2. Engine: Abstract technical concept diagram (visualising how the internal system works).
    3. Proof: Real-world application example visual.

    Requirements:
    - Use AI Bytes Brand Colors: Teal/cyan (#00BCD4) and purple (#6B3FA0) on deep dark navy (#0D1117).
    - Provide Mermaid.js code for 'Engine' if it involves flows.
    - Provide detailed 'customSpec' for abstract conceptual visuals.

    Return ONLY a valid JSON array of 3 objects matching the VisualizationSpec interface:
    {
        "title": "string",
        "purpose": "string",
        "type": "architecture" | "flowchart" | "network" | "comparison" | "timeline" | "dataflow" | "custom",
        "interactive": false,
        "mermaidCode": "string (optional)",
        "customSpec": { "visualDescription": "string", "style": "minimal-geometric" },
        "placementSuggestion": "Introduction" | "Core Section" | "Summary"
    }`;
        const response = await this.makeRequest(prompt);
        return (Array.isArray(response) ? response : (response.visualizations || [])) as VisualizationSpec[];
    }
}

// 5. Assessment Agent
export class AssessmentAgent extends BaseAgent {
    async generate(topic: TopicPlan): Promise<AssessmentSuite> {
        const prompt = `SYSTEM ROLE:
    You are an Expert in Psychometrics and Assessment Design.
    Create a comprehensive final assessment for:
            MODULE: "${topic.topicName}"
        TOPICS: ${topic.lessons.map(l => l.lessonTitle).join(', ')}
        DIFFICULTY: Intermediate(Standard)

        REQUIREMENTS:
        1. Question Bank: Generate 10 - 12 questions.
        2. Content: Must cover all lessons and learning outcomes evenly.
        3. Question Types(Varied):
        - Multiple Choice(Standard)
            - True / False(Conceptual)
            - Scenario - Based(Application)
        4. Difficulty Progression:
        - Start with 3 - 4 foundational questions(Recall).
           - Move to 4 - 5 core technique questions(Application).
           - End with 3 - 4 scenario based questions(Analysis).
        5. Feedback:
        - Correct: Detailed explanation of WHY it is correct.
           - Incorrect: Explanation + Reference to specific lesson section.

    Return ONLY a valid JSON object matching the AssessmentSuite interface:
        {
            "moduleNumber": ${topic.topicOrder},
            "moduleTitle": "${topic.topicName}",
                "totalQuestions": 12,
                    "passingScore": 80,
                        "questions": [
                            {
                                "questionNumber": 1,
                                "questionType": "multiple_choice" | "true_false" | "scenario",
                                "questionText": "string",
                                "options": [{ "letter": "A", "text": "string" }],
                                "correctAnswer": "A",
                                "correctFeedback": "Correct! [Reason]",
                                "incorrectFeedback": "Incorrect. [Reason]. Review [Lesson].",
                                "topicReference": "string",
                                "difficultyRationale": "string",
                                "cognitiveLevel": "Recall" | "Application" | "Analysis",
                                "timeLimit": 60,
                                "learningObjective": "string"
                            }
                            // ... 10-12 questions
                        ],
                            "moduleActionItem": { "instruction": "string", "estimatedTime": "20 mins", "deliverable": "string", "sharePrompt": "string" }
        } `;
        return await this.makeRequest(prompt) as AssessmentSuite;
    }
}

// 6. Narrator Agent
export class NarratorAgent extends BaseAgent {
    async generate(input: {
        title: string,
        duration: number,
        type: 'course' | 'topic' | 'lesson',
        context: string,
        courseTitle?: string,
        style?: 'PRACTICAL' | 'PROBLEM' | 'VISIONARY' | 'DIRECT' | 'ANALYTICAL'
    }): Promise<VideoScript> {

        // Style Definitions for better variety
        const styleGuides = {
            PRACTICAL: "Hook focus: A clear, actionable application of the knowledge. 'By the end of this, you will be able to...'",
            PROBLEM: "Hook focus: A common pain point or challenge the student faces. 'Have you ever struggled with...'",
            VISIONARY: "Hook focus: The big picture impact or future transformation. 'Imagine a world where...'",
            DIRECT: "Hook focus: Immediate, high-value fact or result. 'Here is exactly what you need to know about...'",
            ANALYTICAL: "Hook focus: A surprising statistic, trend, or logic-driven insight. 'Did you know that 80% of...'"
        };

        const selectedStyle = input.style || (input.type === 'course' ? 'VISIONARY' : 'PRACTICAL');
        const styleInstruction = styleGuides[selectedStyle as keyof typeof styleGuides];

        let avatarContext = `
        AVATAR: "Sarah"(Course Host)
        ROLE: Warm, clear, calm, and professional guide.
            STYLE: ${selectedStyle}
            ${styleInstruction}
        TONE: Warm, clear, inviting, and professional.
            GOAL: ${input.type === 'course' ? 'Welcome the student, outline the value proposition, and set expectations.' : 'Introduce the core concepts and guide the student through the learning journey.'}
        `;

        const prompt = `SYSTEM ROLE:
You are a Professional Educational Scriptwriter for AI Avatar videos.
Write a ${input.duration} -second script for: ${input.title}
${input.courseTitle ? `COURSE: ${input.courseTitle}` : ''}

        CONTEXT: ${input.context}

${avatarContext}

TONE RULES:
        1. Natural, spoken - word style(avoid complex clauses)
        2. British English
        3. Human - like phrasing(breathing room, natural transitions)
        4. NO "Ladies and gentlemen" or generic openers.Start directly with the hook

VARIETY ENFORCEMENT:
        - DO NOT start with "Welcome to this course", "Welcome back", or "In this lesson".
- DO NOT use the word "Introduction" in the first 10 seconds.
- Use the provided STYLE focus to differentiate the opening.

            MOTION - DRIVING SCRIPT RULES(CRITICAL FOR AVATAR GESTURES):
        1. ** Vary Sentence Length **: Mix short punchy sentences(3 - 5 words) with longer explanations(15 - 20 words)
            - Short sentences create pauses and gesture changes
                - Example: "Here's the truth. Most people get this wrong. But you won't."

        2. ** Include Rhetorical Questions **: Questions trigger different facial expressions and hand gestures
            - Example: "Why does this matter? What's the real impact?"

        3. ** Use Emotional Tone Shifts **: Change energy levels throughout
            - Start energetic, calm down for explanation, build excitement for conclusion
                - Example: "This is powerful! [pause] Let me show you why. [calm] When you understand this..."

        4. ** Add Natural Pauses **: Use ellipses(...) or em dashes(—) to create breathing room
            - Pauses reset avatar motion and prevent repetitive loops

        5. ** Vary Emphasis Words **: Use different power words in each section
            - Hook: "powerful", "essential", "critical"
                - Core: "exactly", "specifically", "precisely"
                    - Recap: "remember", "apply", "practice"

        STRUCTURE:
        - Hook(0 - 5s): Grab attention immediately with a QUESTION or BOLD STATEMENT
        - Core(5 - ${input.duration - 5}s): Key value proposition with VARIED PACING
        - Call to Action / Recap(Last 5s): What to do next with ENERGY

TIMING CONSTRAINTS (STRICT):
${input.type === 'course' ? `- Total Duration: 45 seconds.` : input.type === 'topic' ? `- Total Duration: 30 seconds.` : `- Total Duration: 15 seconds.`}

ANTI - AI PHRASE ENFORCEMENT(STRICT):
NEVER use these words / phrases:
        - "Dive in", "Dive deep", "Delve", "Embark", "Journey", "Adventure", "Landscape"
            - "Unlock", "Unleash", "Harness", "Mastering", "Demystify", "Game-changer", "Revolutionize"
            - "Tapestry", "Symphony", "Beacon", "In this video", "In this lesson", "Ladies and gentlemen"

Replacement Rules:
        - Instead of "Let's dive in", use "Let's start" or "Let's look at".
- Instead of "Unlock", use "Learn", "Understand", or "Access".

            CRITICAL: Return ONLY a valid JSON object.Here is the exact schema:

        {
            "hook": {
                "duration": 5,
                    "script": "Your opening hook script here",
                        "visualCues": ["Visual cue 1"]
            },
            "context": {
                "duration": 5,
                    "script": "Context and background script here",
                        "visualCues": ["Visual cue"]
            },
            "coreContent": {
                "duration": ${input.duration - 10},
                "segments": [
                    {
                        "title": "Key Concept",
                        "duration": ${input.duration - 10},
                    "script": "The core message here",
                    "visualCues": ["Visual cue"],
                    "codeSegments": []
      }
    ]
        },
        "demonstration": {
            "duration": 0,
                "script": "",
                    "codeToShow": "",
                        "visualCues": []
        },
        "recap": {
            "duration": 5,
                "script": "Recap and call to action script",
                    "keyPoints": ["Key point 1"]
        },
        "transition": {
            "duration": 0,
                "script": ""
        },
        "totalDuration": ${input.duration},
        "pronunciationGuide": { }
    }

    IMPORTANT:
- Return ONLY the JSON object.No markdown, no intro.
- totalDuration MUST equal ${input.duration}.`;

        return await this.makeRequest(prompt) as VideoScript;
    }
}

// 7. Synthesis Agent
export class SynthesisAgent extends BaseAgent {
    async generate(lessonPlan: LessonPlan, components: any): Promise<CompletedLesson> {
        const prompt = `Act as a Master Content Synthesiser.Merge these agent outputs into a unified lesson:
    LESSON TOPIC: "${lessonPlan.lessonTitle}"
    
    INPUT COMPONENTS:
1. EXPLANATION: ${JSON.stringify(components.explanation).slice(0, 15000)}... (Increased limit for 1000-word lessons)
    2. CODE: ${components.code ? "Included" : "None"}
3. VISUALS: ${components.visuals ? components.visuals.length + " items" : "None"}
4. VIDEO SCRIPT: ${components.video ? "Included" : "None"}

TASK:
    Assemble a 'CompletedLesson' JSON object. 
    - Combine the 'explanation' text into the main content sections.
    - Integrate the 'code' examples(if any) into the 'practicalApplication' or a dedicated 'implementation' section.
    - logicaly place the 'visuals' descriptions where they fit best.
    - Ensure smooth transitions between sections.

    CRITICAL: RETURN RAW JSON ONLY.NO MARKDOWN, NO \`\`\`json BLOCKS.
    CRITICAL: Ensure all strings are properly escaped. Do not use unescaped double quotes inside strings.

    Return ONLY a valid JSON object matching the CompletedLesson interface:
    {
        "lessonTitle": "${lessonPlan.lessonTitle}",
        "content": "string (The full synthesized lesson content in markdown format, integrating text, code snippets, and visual descriptions)",
        "quiz": { ... } (If assessments exist, map them here, otherwise null),
        "visuals": [ ... ] (Pass through the visuals array),
        "videoScript": { ... } (Pass through or summarize the video script)
    }`;

        // We use a looser parsing here because Synthesis often returns large text blocks
        return await this.makeRequest(prompt) as any;
    }
}

// 8. Repair Agent (NEW)
export class RepairAgent extends BaseAgent {
    // This agent doesn't follow the Generate pattern exactly, it edits.
    // But to satisfy base class or just reuse makeRequest:
    async generate(input: { failedText: string, errorContext: string }): Promise<{ repairedText: string }> {
        const errorLower = input.errorContext.toLowerCase();
        let instructions = "";

        if (errorLower.includes("prohibited pattern")) {
            // Lexical Repair (v1.2.1)
            instructions = `The following educational text contains prohibited technical terms.

Rewrite the text so that:
        - The meaning is preserved
            - All prohibited technical terms are replaced with plain - language equivalents
                - The tone remains educational and accessible
                    - No technical jargon, programming terms, or system - level language remains
                        - Paragraph length rules are preserved

Replace terms as follows:
        API → interface
        endpoint → access point
        request → input
        response → output
        payload → data
        schema → structure

If a direct replacement makes no sense, REWRITE the sentence to avoid the concept entirely.
Return ONLY the revised text.`;
        } else if (errorLower.includes("image count")) {
            instructions = `1. The content is a list of image prompts(or empty).
    2. You MUST provide exactly 6 distinct, ultra - photorealistic image prompts.
    3. Return the result as a valid JSON stringified array of objects(imagePrompts) inside the 'repairedText' field.`;
        } else if (errorLower.includes("image prompt")) {
            instructions = `The following image does not support the lesson content.

Rewrite ONLY the image generation prompt so that:
        - The image directly illustrates the stated lesson concepts
            - The image is conceptual and explanatory, not decorative
                - The image avoids generic scenery, architecture, or lifestyle seasons
                    - The image clearly supports learning for a beginner audience
                        - The image remains ultra - photorealistic

Do NOT modify lesson text.
Return ONLY the corrected image prompt inside the 'repairedText' field.`;
        } else if (errorLower.includes("outcome not adequately covered")) {
            instructions = `MISSING ALIGNMENT: The lesson content failed to teach a required Learning Objective.
    
    MISSING OBJECTIVE: "${input.failedText}"

        1. You must rewriting the 'topicContent' to explicitly teach this concept.
    2. Do NOT just mention it; explain it conceptually.
    3. Integrate it smoothly into the existing text.
    4. Maintain the strict word count and paragraph limits.
    
    Return the UPDATED 'repairedText' which will replace the 'topicContent' field.`;
        } else if (errorLower.includes("outcome not assessed")) {
            // Repair A: Outcome Not Assessed
            instructions = `Repair target: Assessment only
One learning outcome is not assessed.

Revise ONLY the module assessment so that:
        - Every learning outcome is assessed by at least one question
            - Existing valid questions remain unchanged
                - No new learning outcomes are introduced
                    - The difficulty level is preserved
                        - No code or technical formatting is added
                            - You MUST populate "relatedLearningOutcome" for all questions.

Return ONLY the revised assessment as a valid JSON object string(AssessmentSuite structure).`;
        } else if (errorLower.includes("assessment question does not map")) {
            // Repair B: Assessment Without Outcome
            instructions = `Repair target: Learning outcomes only
One assessment item does not map to any learning outcome.

Revise ONLY the learning outcomes so that:
        - Every assessment item maps to a learning outcome
            - Existing valid outcomes remain unchanged
                - No new subject matter is introduced
                    - The total number of outcomes remains within the original range

Return ONLY the revised learning outcomes as a valid JSON stringified array of strings.`;
        } else {
            // Text error (Sentence Limit)
            instructions = `1. Rewrite the content to correct the specific error(usually Sentence Count > 5).
    2. Split long paragraphs into multiple shorter paragraphs(max 5 sentences each).
    3. Use double line breaks(\\n\\n) to separate paragraphs explicitly.`;
        }

        const prompt = `SYSTEM ROLE:
    You are a Strict Compliance Editor for an educational platform.
    Your job is to REWRITE failing content to meet validation rules.

    VALIDATION ERROR: "${input.errorContext}"
    
    CONTENT TO REPAIR:
        "${input.failedText}"

        INSTRUCTIONS:
    ${instructions}
        4. Maintain the original meaning, tone(British English), and educational value.
    5. Return ONLY a valid JSON object: { "repairedText": "string" }
        6. PROHIBITED: Do NOT return code blocks or markdown if that was the violation.`;

        try {
            return await this.makeRequest(prompt, true);
        } catch (e) {
            console.error("Repair Agent Failed:", e);
            // Fallback: Return original text (will fail validation again, but prevents crash inside agent)
            return { repairedText: input.failedText };
        }
    }
}

export class AgentOrchestrator {
    private planningAgent = new PlanningAgent();
    private conceptAgent = new ConceptExplainerAgent();
    private codeAgent = new CodeArchitectAgent();
    private visualAgent = new VisualDesignerAgent();
    private assessmentAgent = new AssessmentAgent();
    private narratorAgent = new NarratorAgent();
    private synthesisAgent = new SynthesisAgent();
    private repairAgent = new RepairAgent(); // New Repair Agent
    private videoService = new VideoGenerationService();

    async generateCourse(input: CourseGenerationInput, onProgress?: (progress: number, message: string) => Promise<void>): Promise<CompleteCourse> {
        const dummyScript = { hook: "", core: "", recap: "", script: "" } as any; // Dummy script for skipped videos
        process.stdout.write("🎯 Orchestration: Stage 1 - Planning...\n");
        const cacheKey = `syllabus_v2:${input.courseName.toLowerCase()}:${input.difficultyLevel.toLowerCase()} `;
        let structure = await cache.get<CourseStructure>(cacheKey);

        if (structure) {
            process.stdout.write("⚡ Orchestration: Cache HIT for Syllabus.\n");
            if (onProgress) await onProgress(10, "Loaded Cached Syllabus...");
        } else {
            if (onProgress) await onProgress(5, "Designing Course Architecture...");
            structure = await this.planningAgent.generate(input);
            process.stdout.write("✅ Orchestration: Planning complete.\n");
            await cache.set(cacheKey, structure, 86400 * 7); // Cache for 7 days
        }

        // --- PHASE 1: Generate Scripts with Variety ---
        try {
            console.log('[Orchestrator] Starting video script generation with Variety Engine...');
            const STYLES: ('PRACTICAL' | 'PROBLEM' | 'VISIONARY' | 'DIRECT' | 'ANALYTICAL')[] =
                ['VISIONARY', 'PROBLEM', 'PRACTICAL', 'ANALYTICAL', 'DIRECT'];

            // 1. Course Intro (Sarah) - Style: Visionary
            if (!structure.introVideoScript) {
                const courseContext = `Course Overview. Topics: ${structure.topics.map(t => t.topicName).join(', ')}`;
                structure.introVideoScript = await this.narratorAgent.generate({
                    title: input.courseName,
                    duration: 45, // Updated: 45 seconds
                    type: 'course',
                    context: courseContext,
                    style: 'VISIONARY'
                });
            }

            // 2. Module Intros - Style Rotation
            await Promise.all(structure.topics.map(async (topic, index) => {
                if (!topic.introVideoScript) {
                    const topicContext = `Module: ${topic.topicName}. Description: ${topic.description}.`;
                    const topicStyle = STYLES[(index + 1) % STYLES.length];
                    topic.introVideoScript = await this.narratorAgent.generate({
                        title: topic.topicName,
                        duration: 20, // Updated: 20 seconds
                        type: 'topic',
                        context: topicContext,
                        courseTitle: input.courseName,
                        style: topicStyle
                    });
                }
            }));
        } catch (scriptError) {
            console.error('[Orchestrator] Script variety generation failed:', scriptError);
        }

        // --- PHASE 2: Generate Content ---
        const lessonJobs = structure.topics.flatMap(topic =>
            topic.lessons.map(lesson => ({ topic, lesson }))
        );

        let completedCount = 0;
        const totalLessons = lessonJobs.length;
        const STYLES_LIST: ('PRACTICAL' | 'PROBLEM' | 'VISIONARY' | 'DIRECT' | 'ANALYTICAL')[] =
            ['PRACTICAL', 'DIRECT', 'PROBLEM', 'ANALYTICAL', 'VISIONARY'];

        const allLessons = await mapConcurrent(lessonJobs, 3, async (job, index) => {
            const { topic, lesson: lessonPlan } = job;
            const explanation = await this.conceptAgent.generate(lessonPlan, topic.topicName, structure);

            // Parallel components
            const [code, visuals, videoScript] = await Promise.all([
                this.codeAgent.generate(lessonPlan, explanation).catch(() => null),
                this.visualAgent.generate(lessonPlan, explanation).catch(() => []),
                this.narratorAgent.generate({
                    title: lessonPlan.lessonTitle,
                    duration: 60,
                    type: 'lesson',
                    context: JSON.stringify(explanation.blocks || explanation),
                    courseTitle: input.courseName,
                    style: STYLES_LIST[index % STYLES_LIST.length]
                }).catch(() => ({} as VideoScript))
            ]);

            const completedLesson: CompletedLesson = {
                lessonTitle: lessonPlan.lessonTitle,
                content: explanation,
                videoScript: videoScript,
                metadata: {
                    estimatedDuration: lessonPlan.estimatedDuration || 15,
                    wordCount: explanation.metadata?.blockCount || 0,
                    technicalDepthScore: lessonPlan.estimatedDifficulty,
                    readabilityScore: 80,
                    keyTakeaways: [explanation.keyTakeaway]
                },
                contentBlocks: [],
                imagePrompts: [] // V2 images are inside blocks now, so default to empty array here
            };

            (completedLesson as any).code = code;
            (completedLesson as any).visuals = visuals;

            completedCount++;
            if (onProgress) {
                const percent = 10 + Math.floor((completedCount / totalLessons) * 70);
                await onProgress(percent, `Creating Content: '${lessonPlan.lessonTitle}'`);
            }
            return completedLesson;
        });

        // --- PHASE 3: Assessments ---
        const assessmentResults = await mapConcurrent(structure.topics, 3, async (topic) => {
            const suite = await this.assessmentAgent.generate(topic).catch(() => null);
            return suite?.questions.map(q => ({ ...q, topicTitle: topic.topicName })) || [];
        });

        return {
            courseStructure: structure,
            lessons: allLessons,
            assessments: assessmentResults.flat(),
            pipelineVersion: "v1.3-variety"
        } as CompleteCourse;
    }
}
