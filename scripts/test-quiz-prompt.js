
const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config({ path: '.env.local' });

async function testQuizPrompt() {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
        console.error("❌ API Key missing");
        return;
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash-lite-preview-02-05", // Matching the model in agent-system.ts
        generationConfig: { responseMimeType: "application/json" }
    });

    const topicName = "Neural Networks 101";
    const lessonTitles = ["Neurons and Perceptrons", "Activation Functions", "Backpropagation Basics"];

    const prompt = `SYSTEM ROLE:
    You are an Expert in Psychometrics and Assessment Design for Professional Education.
    Create a comprehensive, high-quality assessment for:
    MODULE: "${topicName}"
    TOPICS TO COVER: ${lessonTitles.join(', ')}
    DIFFICULTY LEVEL: Intermediate (Standard)

    REQUIREMENTS:
    1. Question Bank: Generate exactly 15-20 multiple-choice questions.
    2. Coverage: Questions must evenly cover all lessons and learning outcomes.
    3. Difficulty Alignment:
       - Beginner: Recall & Basic Comprehension (Time Limit: 90s)
       - Intermediate: Application & Analysis (Time Limit: 75s)
       - Advanced: Evaluation & Synthesis (Time Limit: 60s)
    4. Feedback:
       - Correct: Positive reinforcement + why it's correct.
       - Incorrect: Constructive explanation + specific lesson reference to review.

    Return ONLY a valid JSON object matching the AssessmentSuite interface:
    {
       "moduleNumber": 1,
       "moduleTitle": "${topicName}",
       "totalQuestions": 15,
       "passingScore": 70,
       "questions": [
          {
            "questionNumber": 1,
            "questionType": "multiple_choice",
            "questionText": "string",
            "options": [{"letter": "A", "text": "string"}],
            "correctAnswer": "A",
            "correctFeedback": "Excellent! [Explanation]",
            "incorrectFeedback": "Not quite. [Explanation]. Review [Lesson Name].",
            "topicReference": "string",
            "difficultyRationale": "string",
            "cognitiveLevel": "Recall" | "Application" | "Analysis",
            "timeLimit": 90,
            "learningObjective": "string"
          }
          // ... 15-20 questions
       ],
       "moduleActionItem": { "instruction": "string", "estimatedTime": "15 mins", "deliverable": "string", "sharePrompt": "string" }
    }`;

    console.log("🚀 Sending Prompt to Gemini...");
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    try {
        const json = JSON.parse(text);
        console.log("✅ JSON Parsed Successfully");
        console.log(`Questions Generated: ${json.questions.length}`);

        if (json.questions.length < 15) {
            console.error("❌ FAILED: Generated fewer than 15 questions.");
        } else {
            console.log("✅ SUCCESS: 15+ Questions Generated.");
        }

        console.log("First Question Sample:");
        console.log(JSON.stringify(json.questions[0], null, 2));

    } catch (e) {
        console.error("❌ Failed to parse JSON:", e);
        console.log("Raw Output:", text);
    }
}

testQuizPrompt();
