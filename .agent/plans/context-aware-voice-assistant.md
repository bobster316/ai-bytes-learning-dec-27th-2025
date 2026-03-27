# Context-Aware Voice Assistant Implementation Plan

## 📋 Overview
Make the voice assistant fully aware of the student's current learning context (course, module, lesson, quiz question) to provide relevant, contextual help.

## 🎯 Goals
1. Voice assistant knows what course/module/lesson student is viewing
2. Can answer questions about current lesson content
3. Can help with current quiz question
4. Provides contextual hints without giving away answers
5. Tracks student's position in the learning journey

## 🏗️ Architecture

### **1. Context Provider Pattern**
```typescript
interface LearningContext {
  courseId: string;
  courseTitle: string;
  moduleId?: string;
  moduleName?: string;
  lessonId?: string;
  lessonTitle?: string;
  lessonContent?: string;  // Full lesson text
  quizId?: string;
  currentQuizQuestion?: {
    questionNumber: number;
    questionText: string;
    options: string[];
    // Don't include correctAnswer - AI should guide, not reveal
  };
  studentProgress?: {
    completedLessons: number;
    totalLessons: number;
    currentPosition: string;  // e.g., "Module 2, Lesson 3"
  };
}
```

### **2. Implementation Steps**

#### **Step 1: Create Context Hook**
File: `lib/hooks/use-learning-context.ts`
```typescript
export function useLearningContext() {
  const [context, setContext] = useState<LearningContext>({});
  
  const updateContext = (newContext: Partial<LearningContext>) => {
    setContext(prev => ({ ...prev, ...newContext }));
  };
  
  return { context, updateContext };
}
```

#### **Step 2: Update Lesson Page**
File: `app/courses/[courseId]/lessons/[lessonId]/page.tsx`
```typescript
// Pass context to voice assistant
<JarvisMinimal 
  learningContext={{
    courseId: course.id,
    courseTitle: course.title,
    moduleId: topic.id,
    moduleName: topic.title,
    lessonId: lesson.id,
    lessonTitle: lesson.title,
    lessonContent: lesson.content,  // Full lesson text
    studentProgress: {
      completedLessons: userProgress?.completed_lessons || 0,
      totalLessons: course.total_lessons,
      currentPosition: `Module ${moduleIndex + 1}, Lesson ${lessonIndex + 1}`
    }
  }}
/>
```

#### **Step 3: Update Quiz Page**
File: `app/courses/[courseId]/quizzes/[quizId]/page.tsx`
```typescript
// Pass quiz context
<JarvisMinimal 
  learningContext={{
    courseId: course.id,
    courseTitle: course.title,
    quizId: quiz.id,
    currentQuizQuestion: {
      questionNumber: currentQuestionIndex + 1,
      questionText: currentQuestion.question_text,
      options: currentQuestion.options.map(o => o.text),
      // Don't pass correctAnswer
    }
  }}
/>
```

#### **Step 4: Enhance Voice Assistant Prompt**
File: `components/voice/JarvisMinimal.tsx`
```typescript
const systemPrompt = `You are Lyra, an AI learning assistant for AI Bytes Learning.

CURRENT LEARNING CONTEXT:
${learningContext.courseTitle ? `Course: ${learningContext.courseTitle}` : ''}
${learningContext.moduleName ? `Module: ${learningContext.moduleName}` : ''}
${learningContext.lessonTitle ? `Lesson: ${learningContext.lessonTitle}` : ''}
${learningContext.currentPosition ? `Position: ${learningContext.currentPosition}` : ''}

${learningContext.lessonContent ? `
LESSON CONTENT (for reference):
${learningContext.lessonContent.substring(0, 2000)}...
` : ''}

${learningContext.currentQuizQuestion ? `
CURRENT QUIZ QUESTION:
Question ${learningContext.currentQuizQuestion.questionNumber}: ${learningContext.currentQuizQuestion.questionText}
Options: ${learningContext.currentQuizQuestion.options.join(', ')}

QUIZ HELP RULES:
- Provide hints and guidance, NOT direct answers
- Ask Socratic questions to help student think
- Explain concepts related to the question
- If student is stuck, break down the question into smaller parts
- Never reveal the correct answer directly
` : ''}

Your role:
1. Answer questions about the CURRENT lesson content
2. Clarify concepts from THIS specific lesson
3. Help with quiz questions using hints, NOT answers
4. Guide students through difficult concepts
5. Provide examples related to the current topic

Always be aware of what the student is currently viewing and tailor your responses accordingly.`;
```

## 📊 Example Interactions

### **Scenario 1: Student in Lesson**
```
Context: Course "ML Fundamentals", Module 2, Lesson "Supervised Learning"

Student: "What's the difference between classification and regression?"
Lyra: "Great question! Since you're currently in the Supervised Learning lesson, 
let me explain this in context. In the section you're viewing, we covered how 
classification predicts categories (like 'spam' or 'not spam'), while regression 
predicts continuous values (like house prices). Would you like me to explain 
the example from your lesson in more detail?"
```

### **Scenario 2: Student in Quiz**
```
Context: Quiz Question 3 - "Which algorithm is best for binary classification?"

Student: "I don't understand this question"
Lyra: "Let me help you think through this. First, what does 'binary' mean in 
classification? Remember from Lesson 2 where we discussed categories - binary 
means there are only TWO possible outcomes. Can you think of an example from 
the lesson where we had just two categories?"
```

### **Scenario 3: Student Stuck**
```
Context: Lesson "Neural Networks", 40% through

Student: "I'm lost, this is too hard"
Lyra: "I can see you're on the Neural Networks lesson. Let's break this down. 
You've completed 40% of this lesson. Which specific concept is confusing - 
is it the activation functions we just covered, or the backpropagation section 
coming up? Let's tackle one piece at a time."
```

## 🔧 Technical Implementation

### **Files to Modify:**
1. ✅ `components/voice/JarvisMinimal.tsx` - Accept learningContext prop
2. ✅ `app/courses/[courseId]/lessons/[lessonId]/page.tsx` - Pass lesson context
3. ✅ `app/courses/[courseId]/quizzes/[quizId]/page.tsx` - Pass quiz context
4. ✅ `lib/types/learning-context.ts` - Define context types

### **Files to Create:**
1. ✅ `lib/hooks/use-learning-context.ts` - Context management hook
2. ✅ `lib/ai/context-aware-prompts.ts` - Context-specific prompt templates

## 🎓 Benefits

1. **Personalized Help**: AI knows exactly what student is viewing
2. **Contextual Answers**: Responses reference current lesson content
3. **Smart Quiz Hints**: Guides without revealing answers
4. **Progress Awareness**: Knows where student is in learning journey
5. **Reduced Confusion**: No generic answers to specific questions

## 🚀 Next Steps

1. Implement LearningContext interface
2. Update lesson pages to pass context
3. Update quiz pages to pass context
4. Enhance voice assistant prompt with context
5. Test with real student scenarios

---

**Priority**: HIGH  
**Complexity**: MEDIUM  
**Impact**: VERY HIGH (transforms learning experience)
