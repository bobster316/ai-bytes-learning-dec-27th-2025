// lib/ai/course-dna-catalogue.ts
// Pure data — no imports. Single source of truth for all archetype + palette values.

export const ARCHETYPES = [
    { id: "clinical",     label: "Clinical",     writingStyle: "Precise, evidence-first, no filler words.",               layoutDensity: "spacious" as const, sectionDivider: "thin_rule"   as const },
    { id: "bold",         label: "Bold",         writingStyle: "Punchy and declarative. Short paragraphs only.",           layoutDensity: "tight"    as const, sectionDivider: "bold_number" as const },
    { id: "warm",         label: "Warm",         writingStyle: "Encouraging and analogy-rich. Conversational tone.",       layoutDensity: "balanced" as const, sectionDivider: "dot_row"     as const },
    { id: "futuristic",   label: "Futuristic",   writingStyle: "Forward-looking and system-level. Think in abstractions.", layoutDensity: "spacious" as const, sectionDivider: "thin_rule"   as const },
    { id: "story_driven", label: "Story-Driven", writingStyle: "Open with a narrative hook. Lead with a real case.",       layoutDensity: "balanced" as const, sectionDivider: "dot_row"     as const },
    { id: "provocateur",  label: "Provocateur",  writingStyle: "Challenge assumptions. Open with a contrarian statement.", layoutDensity: "tight"    as const, sectionDivider: "bold_number" as const },
] as const;

export const PALETTES = [
    { id: "pulse_teal",   primary: "#00FFB3", secondary: "#9B8FFF", surface: "#0a0a0f" },
    { id: "iris_violet",  primary: "#9B8FFF", secondary: "#FF6B6B", surface: "#0b0a14" },
    { id: "amber_fire",   primary: "#FFB347", secondary: "#FF6B6B", surface: "#0f0c08" },
    { id: "nova_crimson", primary: "#FF6B6B", secondary: "#FFB347", surface: "#0f0808" },
    { id: "arctic_blue",  primary: "#5BC8F5", secondary: "#00FFB3", surface: "#080c12" },
    { id: "gold_ink",     primary: "#D4A840", secondary: "#9B8FFF", surface: "#0c0b08" },
    { id: "coral_sage",   primary: "#FF8C69", secondary: "#7EC8A4", surface: "#0a0d0b" },
    { id: "ice_white",    primary: "#5BC8F5", secondary: "#A8D8EA", surface: "#06090f" },
    { id: "lime_tech",    primary: "#B8E840", secondary: "#5BC8F5", surface: "#090c06" },
    { id: "rose_glass",   primary: "#F8A4C8", secondary: "#D4A840", surface: "#0f090d" },
    { id: "deep_ocean",   primary: "#2EC4F0", secondary: "#B8E840", surface: "#060c12" },
    { id: "slate_mono",   primary: "#8B94B8", secondary: "#9B8FFF", surface: "#0a0a0c" },
] as const;

export const IMAGE_AESTHETICS         = ["photorealistic", "abstract_gradient", "flat_illustration", "technical_diagram"] as const;
export const BG_TREATMENTS            = ["dark_mesh", "grain_texture", "subtle_grid", "clean_flat"] as const;
export const TYPOGRAPHY_PERSONALITIES = ["classic_serif", "modern_sans", "editorial_contrast"] as const;
