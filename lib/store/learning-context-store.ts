import { create } from 'zustand';
import { LearningContext } from '../types/learning-context';

interface LearningContextState {
    context: LearningContext;
    setContext: (context: Partial<LearningContext>) => void;
    clearContext: () => void;
}

export const useLearningContextStore = create<LearningContextState>((set) => ({
    context: {},
    setContext: (newContext) => set((state) => ({
        context: { ...state.context, ...newContext }
    })),
    clearContext: () => set({ context: {} })
}));
