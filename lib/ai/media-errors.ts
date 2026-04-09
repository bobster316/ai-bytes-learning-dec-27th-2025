// lib/ai/media-errors.ts

export type MediaApiSource =
    | 'gemini-image'
    | 'kie'
    | 'pexels'
    | 'supabase-storage';

export type MediaGenerationStage =
    | 'image_generation'
    | 'video_generation'
    | 'upload'
    | 'validation'
    | 'fallback';

export type MediaErrorCode =
    | 'quota_exceeded'
    | 'content_policy_violation'
    | 'auth_failed'
    | 'timeout'
    | 'empty_result'
    | 'upload_failed'
    | 'budget_exceeded';

export class MediaGenerationError extends Error {
    constructor(
        public readonly api: MediaApiSource,
        public readonly errorCode: MediaErrorCode,
        public readonly errorMessage: string,
        public readonly stage: MediaGenerationStage,
        public readonly retryable: boolean,
        public readonly lessonTitle: string,
        public readonly blockType?: string,
        public readonly slotLabel?: string,
    ) {
        super(
            `[${api}] ${errorCode} — ${errorMessage}` +
            ` (lesson: "${lessonTitle}"` +
            (blockType ? `, block: ${blockType}` : '') +
            (slotLabel ? `, slot: ${slotLabel}` : '') +
            ')'
        );
        this.name = 'MediaGenerationError';
    }
}

export interface ImageGenerationResult {
    url: string | null;
    alt: string | null;
    caption: string | null;
    errorCode: string | null;
    errorMessage: string | null;
}

export interface VideoGenerationResult {
    url: string | null;
    source: 'kie' | 'pexels' | 'kie-video' | 'kie-wan-2.5' | 'kie-wan-2.6' | 'kie-kling-2.1' | null;
    errorCode: string | null;
    errorMessage: string | null;
}

const RETRYABLE_PATTERNS: Array<[RegExp, MediaErrorCode, string, boolean]> = [
    [/quota|rate.?limit|429/i,                         'quota_exceeded',           'API quota exceeded — retry after cooldown',                  true],
    [/content|policy|safety|blocked|rai/i,             'content_policy_violation', 'Content blocked by provider safety filter',                  false],
    [/auth|401|403|credential|token|permission/i,      'auth_failed',              'Authentication or authorisation failed',                     false],
    [/timeout|timed.?out|deadline/i,                   'timeout',                  'Provider request timed out',                                 true],
    [/empty|no image|no video|no candidates|0 result/i,'empty_result',             'Provider returned no usable result',                         true],
    [/upload|storage/i,                                'upload_failed',            'Failed to upload media to storage',                          true],
];

export function normaliseProviderError(rawError: string): {
    errorCode: MediaErrorCode;
    errorMessage: string;
    retryable: boolean;
} {
    for (const [pattern, code, message, retryable] of RETRYABLE_PATTERNS) {
        if (pattern.test(rawError)) {
            return { errorCode: code, errorMessage: message, retryable };
        }
    }
    // Unknown — truncate raw error for client, keep retryable false
    return {
        errorCode: 'empty_result',
        errorMessage: rawError.substring(0, 200),
        retryable: false,
    };
}
