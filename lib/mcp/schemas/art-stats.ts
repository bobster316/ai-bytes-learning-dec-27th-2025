/**
 * @fileoverview Defines the Model Context Protocol for generating structured stats of art.
 * This file specifies the context for the AI and the expected shape of the AI-generated elements.
 */

/**
 * Defines the context object sent to the AI for generating structured stats of art.
 */
export interface ArtStatsContext {
  task: 'generate_art_stats';
  subject: string; // e.g., 'Renaissance paintings', 'Modern sculptures'
  style: 'infographic' | 'minimalist' | 'academic';
}

/**
 * Defines the expected JSON output from the AI for the structured stats of art.
 */
export interface AIGeneratedArtStats {
  title: string;
  stats: {
    label: string;
    value: string;
    unit?: string;
  }[];
  summary: string;
}
