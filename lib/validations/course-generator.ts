import { z } from "zod";

export const courseGenerationRequestSchema = z.object({
    courseName: z.string().min(3, "Course name must be at least 3 characters"),
    courseDescription: z.string().optional(),
    difficultyLevel: z.enum(["beginner", "intermediate", "advanced"]),
    targetDuration: z.number().min(10, "Duration must be at least 10 minutes"),
    targetAudience: z.string().optional(),
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
