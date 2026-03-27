import fs from 'fs';
import path from 'path';

export interface VideoUsageRecord {
    url: string;
    lesson_number: number;
    scene_number: number;
    query_used: string;
    duration_seconds: number;
    source: string;
}

export interface CourseState {
    course_id: string;
    course_topic: string;
    domain_history: string[];
    structure_history: string[];
    tone_history: string[];
    used_analogies: string[];
    used_opening_lines: string[];
    used_search_queries: string[];
    video_queries_used: string[];
    used_image_urls: string[];
    narration_history: string[];
    used_video_urls: VideoUsageRecord[];
    visual_type_counts: Record<string, number>;
    validation_log: any[];
}

export const ALL_DOMAINS = [
    { name: 'Culinary', seeds: 'Kitchen, sourdough, seasoning, fermentation, plating' },
    { name: 'Nature', seeds: 'Ecosystem, migration, erosion, symbiosis, tide' },
    { name: 'Architecture', seeds: 'Blueprint, scaffolding, cathedral, facade, renovation' },
    { name: 'Music', seeds: 'Orchestra, crescendo, jazz improvisation, tuning, harmony' },
    { name: 'Sports', seeds: 'Relay race, marathon, playbook, coaching, sprint' },
    { name: 'Gardening', seeds: 'Pruning, greenhouse, grafting, compost, irrigation' },
    { name: 'Travel', seeds: 'Compass, lighthouse, expedition, crossroads, harbour' },
    { name: 'Craftsmanship', seeds: 'Pottery wheel, glassblowing, weaving loom, mosaic, calligraphy' }
];

export const STRUCTURE_PATTERNS = [
    { name: 'The Hook', open: 'Start with a surprising statistic or counterintuitive fact', mid: 'Build the explanation using the analogy', close: 'Return to the opening hook with new understanding', videoScene: [1, 14] },
    { name: 'The Journey', open: 'Begin with a problem or question', mid: 'Walk through the analogy as an unfolding story', close: 'Arrive at the solution as a destination', videoScene: [2, 16] },
    { name: 'The Contrast', open: 'Show the wrong way or common misconception', mid: 'Introduce the analogy as the corrective lens', close: 'End with a clear before/after comparison', videoScene: [3, 12] },
    { name: 'The Build', open: 'Start with the simplest element', mid: 'Layer complexity one piece at a time using the analogy', close: 'Show the complete picture assembled', videoScene: [4, 18] },
    { name: 'The Zoom', open: 'Begin with the big picture (wide shot)', mid: 'Zoom into one critical detail through the analogy', close: 'Zoom back out with enriched understanding', videoScene: [1, 15] },
    { name: 'The Dialogue', open: 'Pose a question the learner might ask', mid: 'Answer through a conversational analogy exchange', close: 'Synthesise with a memorable one-liner', videoScene: [5, 17] },
    { name: 'The Reveal', open: 'Present something familiar and mundane', mid: 'Gradually reveal hidden complexity through the analogy', close: 'End with an "I never knew that" moment', videoScene: [4, 13] },
    { name: 'The Challenge', open: 'Present a mini-scenario or decision point', mid: 'Use the analogy to explore trade-offs', close: 'Close with a principle the learner can apply immediately', videoScene: [2, 16] }
];

export const TONE_REGISTERS = [
    { name: 'Warm Mentor', chars: 'Encouraging, patient, uses "we" and "you", slightly informal', example: 'You know that feeling when you\'re following a recipe for the first time?' },
    { name: 'Curious Explorer', chars: 'Question-driven, energetic, uses "what if" and "imagine"', example: 'What if I told you the internet works exactly like a postal system from 1840?' },
    { name: 'Confident Expert', chars: 'Direct, authoritative, uses active voice and strong verbs', example: 'Neural networks learn the same way a toddler learns to sort shapes.' },
    { name: 'Playful Storyteller', chars: 'Narrative, uses scene-setting, character sketches, humour', example: 'Picture this: a head chef in a Michelin-star kitchen, staring at 47 orders...' }
];

export class CourseStateManager {
    private static readonly STATE_DIR = path.join(process.cwd(), '.data', 'course-states');

    static init() {
        if (!fs.existsSync(this.STATE_DIR)) {
            fs.mkdirSync(this.STATE_DIR, { recursive: true });
        }
    }

    static getState(courseId: string, courseTopic: string = 'Unknown Topic'): CourseState {
        this.init();
        const filePath = path.join(this.STATE_DIR, `${courseId}.json`);
        
        if (fs.existsSync(filePath)) {
            try {
                const data = fs.readFileSync(filePath, 'utf-8');
                return JSON.parse(data);
            } catch (e) {
                console.error(`[CourseState] Failed to read state for ${courseId}`, e);
            }
        }
        
        // Return default state
        return {
            course_id: courseId,
            course_topic: courseTopic,
            domain_history: [],
            structure_history: [],
            tone_history: [],
            used_analogies: [],
            used_opening_lines: [],
            used_search_queries: [],
            video_queries_used: [],
            used_image_urls: [],
            used_video_urls: [],
            narration_history: [],
            visual_type_counts: {
                // Real block type names from the codebase (used by LessonExpanderAgent V3)
                full_image: 0,
                video_snippet: 0,
                concept_illustration: 0,
                flow_diagram: 0,
                type_cards: 0,
                interactive_vis: 0,
                mindmap: 0,
                image_text_row: 0,
                instructor_insight: 0,
                industry_tabs: 0,
                applied_case: 0,
                prediction: 0,
                open_exercise: 0
            },
            validation_log: []
        };
    }

    static saveState(state: CourseState) {
        this.init();
        const filePath = path.join(this.STATE_DIR, `${state.course_id}.json`);
        fs.writeFileSync(filePath, JSON.stringify(state, null, 2), 'utf-8');
    }

    static getNextDomain(state: CourseState): string {
        const counts: Record<string, number> = {};
        ALL_DOMAINS.forEach(d => counts[d.name] = 0);
        state.domain_history.forEach(d => {
            if (counts[d] !== undefined) counts[d]++;
        });

        const lastDomain = state.domain_history.length > 0 
            ? state.domain_history[state.domain_history.length - 1] 
            : null;

        let available = ALL_DOMAINS.filter(d => d.name !== lastDomain && counts[d.name] < 2);
        
        // Failsafe: if we used up the domains, relax the <2 constraint (but keep the no immediate repeat constraint)
        if (available.length === 0) {
            available = ALL_DOMAINS.filter(d => d.name !== lastDomain);
        }

        // Weighted random choice prioritizing least used
        const maxCount = Math.max(...available.map(d => counts[d.name]));
        const weights = available.map(d => (maxCount - counts[d.name]) + 1); // +1 ensures even worst case has >0 weight
        
        const totalWeight = weights.reduce((a, b) => a + b, 0);
        let random = Math.random() * totalWeight;
        
        for (let i = 0; i < weights.length; i++) {
            random -= weights[i];
            if (random <= 0) {
                return available[i].name;
            }
        }
        return available[0].name; // fallback
    }

    static getStructure(lessonNumber: number) {
        return STRUCTURE_PATTERNS[(lessonNumber - 1) % 8];
    }

    static getTone(lessonNumber: number) {
        return TONE_REGISTERS[(lessonNumber - 1) % 4];
    }
}
