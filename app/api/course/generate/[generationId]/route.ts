// ========================================
// Course Generation Status API Endpoint
// GET /api/course/generate/[generationId]
// ========================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';
import type { GenerationStatusResponse } from '@/lib/types/course-generator';

/**
 * GET /api/course/generate/[generationId]
 * Check the status of an ongoing course generation
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ generationId: string }> }
) {
  try {
    const { generationId } = await params;

    // Validate ID format (numeric BIGINT or UUID)
    const isNumeric = /^\d+$/.test(generationId);
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(generationId);

    if (!isNumeric && !isUUID) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid generation ID format',
        },
        { status: 400 }
      );
    }

    // Fetch generation record from database
    const supabase = createClient();
    const { data: generation, error } = await supabase
      .from('ai_generated_courses')
      .select('*')
      .eq('id', generationId)
      .single();

    if (error || !generation) {
      return NextResponse.json(
        {
          success: false,
          message: 'Generation not found',
        },
        { status: 404 }
      );
    }

    // Calculate progress using database fields if available
    const progress = calculateProgress(
      generation.generation_status,
      generation.current_step,
      generation.percent_complete,
      generation.generation_started_at,
      generation.generation_completed_at
    );

    const response: GenerationStatusResponse = {
      generationId: generation.id,
      status: generation.generation_status,
      progress,
      courseId: generation.course_id,
      error: generation.error_message,
    };

    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    console.error('Error fetching generation status:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch generation status',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Calculate generation progress based on status and database fields
 */
function calculateProgress(
  status: string,
  dbCurrentStep: string | null,
  dbPercentComplete: number | null,
  startedAt: string | null,
  completedAt: string | null
) {
  const steps = [
    'Initializing',
    'Generating course outline',
    'Creating lesson content',
    'Generating quizzes',
    'Fetching images',
    'Generating audio narration',
    'Finalizing course',
  ];

  let percentComplete = 0;
  let currentStep = '';

  // Use database fields if available (real-time tracking)
  if (dbCurrentStep && dbPercentComplete !== null) {
    currentStep = dbCurrentStep;
    percentComplete = dbPercentComplete;
  } else {
    // Fallback to time-based estimation
    switch (status) {
      case 'pending':
        percentComplete = 0;
        currentStep = 'Waiting to start...';
        break;
      case 'generating':
        // Estimate progress based on time elapsed
        if (startedAt) {
          const elapsed = Date.now() - new Date(startedAt).getTime();
          const estimatedTotal = 180000; // 3 minutes
          percentComplete = Math.min((elapsed / estimatedTotal) * 100, 95);
        } else {
          percentComplete = 5;
        }
        const stepsIndex = Math.floor((percentComplete / 100) * steps.length);
        currentStep = steps[Math.min(stepsIndex, steps.length - 1)];
        break;
      case 'completed':
        percentComplete = 100;
        currentStep = 'Complete!';
        break;
      case 'failed':
        currentStep = 'Failed';
        percentComplete = 0;
        break;
    }
  }

  return {
    currentStep,
    stepsCompleted: Math.floor((percentComplete / 100) * steps.length),
    totalSteps: steps.length,
    percentComplete: Math.round(percentComplete),
  };
}

/**
 * OPTIONS handler for CORS
 */
export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 });
}
