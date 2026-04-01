// Re-export everything from the parent content-sanitizer module.
// Tests inside __tests__/ import from '../index' which resolves here.
export {
    sanitizeText,
    sanitizeValue,
    sanitizeBlocks,
    validateLessonPedagogy,
    repairLessonSequence,
    BANNED_WORDS_INSTRUCTION,
} from '../content-sanitizer';

export type { ValidationResult, RepairResult } from '../content-sanitizer';
