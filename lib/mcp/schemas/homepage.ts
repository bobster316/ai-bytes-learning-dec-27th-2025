/**
 * @fileoverview Defines the Model Context Protocol for the dynamic homepage.
 * This file specifies the context for personalizing the homepage content
 * and the expected shape of the AI-generated elements.
 */

/**
 * Represents a simplified user profile for personalization context.
 */
export interface UserProfile {
  id: string;
  role: string; // e.g., 'Marketing Manager', 'Student'
  learning_history: string[]; // Array of course titles they've engaged with
  goals: string[]; // User-stated goals
}

/**
 * Defines the context object sent to the AI for personalizing the homepage.
 */
export interface HomepageContext {
  task: 'render_homepage_recommendations';
  user_profile: UserProfile | null; // Null for logged-out users
}

/**
 * Defines the expected JSON output from the AI for the homepage.
 */
export interface AIGeneratedHomepageContent {
  headline: string; // A personalized, engaging headline
  recommended_category_ids: string[]; // An array of category IDs, sorted by relevance
}
