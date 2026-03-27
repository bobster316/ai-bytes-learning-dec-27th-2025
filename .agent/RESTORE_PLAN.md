# RESTORE & ROLLBACK PLAN: AI Bytes "Micro-Learning" Pivot

This document outlines how to reverse the changes made during the Feb 9th "Micro-Learning" and "Human-Centric" pivot, in case the previous "Academic/Mastery" approach is preferred.

## 1. Database Rollback (Existing Courses)
If the renamed titles and descriptions need to be restored to their previous state:
1. Run the backup script before making further changes: `node scripts/backup-courses.js`
2. If a restore is needed, use `scripts/restore-courses.js` (to be created if requested) which will read `courses_backup_final.json` and overwrite the current database entries.

## 2. AI Logic Rollback (Generation Engine)
To revert the AI from "15-Minute Bytes" back to "Comprehensive Academic" content:
- **File**: `lib/ai/agent-system.ts`
  - Revert the `WORD COUNT TARGET` from `800-1000` back to `2000-2500`.
  - Revert the `difficultyConfig` reading levels (Beginner was Grade 5-7, can be moved back to Grade 8-10).
- **File**: `lib/ai/prompts/enhanced-planning-prompt.ts`
  - Change the `SYSTEM ROLE` back from "No PhD Required" to "Measurable Professional Outcomes".
  - Remove "Master" and "Mastery" from the `ANTI-AI PHRASE ENFORCEMENT` list.

## 3. UI Rollback (Landing & Mastery Pages)
To revert the "White Mode" and "Human Voice" UI:
- **Landing Page** (`app/page.tsx`): 
  - Change "Get AI Ready" back to "Master AI".
  - Change "YOUR PROGRESS" badge back to "ORBITAL MASTERY".
- **Mastery Page** (`app/mastery/page.tsx`):
  - Change "Growth Level" back to "Mastery Level".
  - Change "Total Awareness" back to "Global Neural Net".

## 4. Reversing "Renovation" Script
The script `scripts/renovate-courses.js` is one-way (destructive). Always ensure a `backup-courses.js` run is completed before running it again.
