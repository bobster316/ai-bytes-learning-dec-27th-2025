/**
 * @fileoverview Defines the Model Context Protocol for AI course generation.
 * This file specifies the exact structures for providing context to the AI
 * and the expected shape of the AI-generated course content.
 */

import type { AIGeneratedOutline } from '@/lib/types/course-generator';

/**
 * Defines the context object sent to the AI for generating a course.
 * This structure ensures consistency and reliability in the generation process.
 */
export interface CourseGenerationContext {
  task: 'generate_course_outline';
  
  // Constraints for the AI's output.
  constraints: {
    topic_count: 4;
    lessons_per_topic: 4;
    quiz_questions_per_topic: 5;
  };
  
  // Detailed information about the target audience.
  audience: {
    level: 'beginner' | 'intermediate' | 'advanced';
    background: string; // e.g., 'non-technical', 'software engineers'
    goal: string; // e.g., 'achieve foundational literacy'
  };
  
  // Core principles of the platform to guide the AI's tone and style.
  platform_mission: {
    style: 'jargon-free, engaging, accessible';
    lesson_format: '15-minute digestible lessons';
    goal: 'democratize AI education';
  };
  
  // The user's specific request.
  user_input: {
    course_title: string;
    target_duration_minutes: number;
  };
}

/**
 * Defines the expected JSON output from the AI after course generation.
 * This mirrors the AIGeneratedOutline but is redefined here for clarity within the MCP.
 */
export type AIGeneratedCourseOutput = AIGeneratedOutline;
