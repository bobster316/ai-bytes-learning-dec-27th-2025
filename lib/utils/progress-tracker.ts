// ========================================
// Progress Tracking for Course Generation
// ========================================

import { getCourseDatabase } from '../database/course-operations';

/**
 * Progress tracker for real-time updates
 */
export class ProgressTracker {
  private generationId: string;
  private db = getCourseDatabase(true); // Use service role for admin operations
  private currentStep: string = '';
  private percentComplete: number = 0;

  constructor(generationId: string) {
    this.generationId = generationId;
  }

  /**
   * Update progress
   */
  async update(step: string, percentComplete: number) {
    this.currentStep = step;
    this.percentComplete = Math.round(percentComplete);

    console.log(
      `[${this.generationId}] Progress: ${this.percentComplete}% - ${step}`
    );

    // Persist progress to database
    try {
      await this.db.updateGenerationProgress(
        this.generationId,
        step,
        this.percentComplete
      );
    } catch (error) {
      console.error('Failed to update progress in database:', error);
      // Don't throw - progress tracking failures shouldn't break generation
    }
  }

  /**
   * Get current progress
   */
  getProgress() {
    return {
      currentStep: this.currentStep,
      percentComplete: this.percentComplete,
    };
  }
}

/**
 * Create progress tracker
 */
export function createProgressTracker(generationId: string) {
  return new ProgressTracker(generationId);
}
