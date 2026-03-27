import { z } from "zod";

export const courseGenerationRequestSchema = z.object({
    courseName: z.string().min(1, "Course name must be at least 1 character"),
    courseDescription: z.string().optional(),
    difficultyLevel: z.enum(["beginner", "intermediate", "advanced"]),
    targetDuration: z.number().min(5, "Duration must be at least 5 minutes"), // Lowered for tests
    targetAudience: z.string().optional(),
    videoSettings: z.object({
        courseHost: z.string().default('sarah'),
        moduleHost: z.string().default('sarah')
    }).optional(),
    // Testing Overrides
    topicCount: z.number().optional(),
    lessonsPerTopic: z.number().optional()
});

export const validateCourseGenerationRequest = (data: unknown) => {
    return courseGenerationRequestSchema.safeParse(data);
};

export const safeParse = <T>(schema: z.ZodSchema<T>, data: unknown) => {
    const result = schema.safeParse(data);
    return {
        success: result.success,
        data: result.success ? result.data : undefined,
        errors: result.success ? undefined : result.error.issues,
    };
};
