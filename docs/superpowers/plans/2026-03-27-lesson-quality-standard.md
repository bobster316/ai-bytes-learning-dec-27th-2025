# Lesson Quality Standard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permanently raise the quality baseline for all AI Bytes lessons by fixing 10 components, injecting content rules into the generator, updating the sanitizer, then regenerating lesson 3573 as the reference sample.

**Architecture:** Changes are made in three isolated layers — type definitions (one file), component rendering (one file per block), and generation/validation (agent prompt + sanitizer). No cross-layer coordination is needed during implementation; all layers speak through `lib/types/lesson-blocks.ts`.

**Tech Stack:** React 19, TypeScript strict, Tailwind CSS, Framer Motion, Zustand (CourseDNA), Gemini (generation).

---

## File Map

| File | What changes |
|------|-------------|
| `lib/types/lesson-blocks.ts` | Add `description?`, `explanation?`, `layout?`, `tabs?`, `items?` fields |
| `components/course/blocks/image-text-row.tsx` | Remove `border border-white/5` from image container |
| `components/course/blocks/video-snippet.tsx` | Add description inset panel below video; remove green border |
| `components/course/blocks/full-image-section.tsx` | `rounded-[2.5rem]` → `rounded-xl`; conditional split layout when `explanation` present |
| `components/course/blocks/flow-diagram.tsx` | Add `explanation` inset card below diagram |
| `components/course/blocks/applied-case.tsx` | Full redesign: tabbed interface, 3 scenarios, optional image per tab |
| `components/course/blocks/prediction.tsx` | Visual redesign: gradient card, left-accent option bars |
| `components/course/blocks/type-cards.tsx` | Image area → `aspect-video` (16:9); remove border from image container |
| `components/course/blocks/recap-slide.tsx` | Add `BoxStyle` for `items[]` (4 coloured cards each with title + body) |
| `lib/ai/agent-system-v2.ts` | Update 6 `getBlockSchemaDoc` entries; inject quality rules into LessonExpanderAgent prompt |
| `lib/ai/content-sanitizer.ts` | WARN paths for missing semantic fields; REPAIR for recap `items`; WARN for key_terms < 12 |

---

## Task 1: Type Additions

**Files:**
- Modify: `lib/types/lesson-blocks.ts`

- [ ] **Step 1: Add `description` to VideoSnippetBlock**

  In `lib/types/lesson-blocks.ts`, find `VideoSnippetBlock` (line 207) and add the `description` field:

  ```typescript
  export interface VideoSnippetBlock extends BaseBlock {
      type: "video_snippet";
      title: string;
      videoPrompt: string;
      videoUrl?: string;
      caption: string;
      duration?: number;
      description?: string;          // 2 sentences: what viewer will see + why it matters
  }
  ```

- [ ] **Step 2: Add `explanation` and `layout` to FullImageBlock**

  Find `FullImageBlock` (line 70) and add:

  ```typescript
  export interface FullImageBlock extends BaseBlock {
      type: "full_image";
      imagePrompt: string;
      imageUrl?: string;
      imageAlt: string;
      caption: string;
      captionHighlight?: string;
      explanation?: string;           // 2-3 sentences interpreting what the visual reveals
      layout?: "split" | "hero";      // "split" when explanation present; "hero" for full-bleed
  }
  ```

- [ ] **Step 3: Add `explanation` to FlowDiagramBlock**

  Find `FlowDiagramBlock` (line 247) and add `explanation?`:

  ```typescript
  export interface FlowDiagramBlock extends BaseBlock {
      type: "flow_diagram";
      title?: string;
      explanation?: string;           // 2-3 sentences interpreting what the diagram reveals
      steps?: Array<{
          label: string;
          description?: string;
          colour?: "pulse" | "iris" | "amber" | "nova" | "default";
      }>;
      contrast?: {
          labelA: string;
          labelB: string;
          stepsA: Array<{ label: string; colour?: "nova" | "amber" }>;
          stepsB: Array<{ label: string; colour?: "pulse" | "iris" }>;
          middleNode: string;
          outcomeA: string;
          outcomeB: string;
      };
  }
  ```

- [ ] **Step 4: Add `tabs` to AppliedCaseBlock**

  Find `AppliedCaseBlock` (line 185) and add `tabs?`:

  ```typescript
  export interface AppliedCaseBlock extends BaseBlock {
      type: "applied_case";
      scenario: string;           // Legacy — used when tabs is absent
      challenge: string;          // Legacy
      resolution: string;         // Legacy
      imagePrompt?: string;
      imageUrl?: string;
      tabs?: Array<{              // New: exactly 3 tabs
          id: string;
          label: string;
          scenario: string;
          challenge: string;
          resolution: string;
          imageUrl?: string;
      }>;
  }
  ```

- [ ] **Step 5: Add `items` to RecapBlock**

  Find `RecapBlock` (line 194) and add `items?`:

  ```typescript
  export interface RecapBlock extends BaseBlock {
      type: "recap";
      style?: "card" | "minimal" | "striped";
      title: string;
      points: string[];           // Legacy — used when items is absent
      items?: Array<{             // New: exactly 4 cards
          title: string;          // 4-6 words
          body: string;           // 2 sentences
      }>;
  }
  ```

- [ ] **Step 6: Commit**

  ```bash
  git add lib/types/lesson-blocks.ts
  git commit -m "feat: add description, explanation, layout, tabs, items fields to block types"
  ```

---

## Task 2: image-text-row — Remove Border

**Files:**
- Modify: `components/course/blocks/image-text-row.tsx`

- [ ] **Step 1: Remove `border border-white/5` from image container**

  Find the image container div (line 42). Change:

  ```tsx
  className="w-full md:w-[48%] rounded-2xl overflow-hidden border border-white/5 shrink-0 relative"
  ```

  To:

  ```tsx
  className="w-full md:w-[48%] rounded-2xl overflow-hidden shrink-0 relative shadow-sm"
  ```

- [ ] **Step 2: Commit**

  ```bash
  git add components/course/blocks/image-text-row.tsx
  git commit -m "fix: remove border from image-text-row image container"
  ```

---

## Task 3: video-snippet — Description Panel + Border Removal

**Files:**
- Modify: `components/course/blocks/video-snippet.tsx`

- [ ] **Step 1: Remove green border from video player container**

  Find line 100. Change:

  ```tsx
  <div className="lg:col-span-7 xl:col-span-8 rounded-2xl overflow-hidden border border-[#00FFB3]/20 shadow-[0_0_40px_rgba(0,255,179,0.05)] relative group bg-black aspect-video">
  ```

  To:

  ```tsx
  <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-0">
  ```

  Then wrap just the video player element in an aspect-ratio container. Replace the entire left column block (lines 99–211) with:

  ```tsx
  {/* ── Video Player (Left Side) ────────────────────────────────────── */}
  <div className="lg:col-span-7 xl:col-span-8 flex flex-col">
      <div className="rounded-2xl overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.3)] relative group bg-black aspect-video">
          {props.videoUrl && !hasError ? (
              <>
                  <video
                      ref={videoRef}
                      src={props.videoUrl}
                      className="w-full h-full object-cover brightness-[1.1] contrast-[1.05]"
                      loop
                      muted={isMuted}
                      playsInline
                      preload="auto"
                      onLoadedData={() => setIsLoaded(true)}
                      onCanPlayThrough={() => setIsLoaded(true)}
                      onTimeUpdate={handleTimeUpdate}
                      onEnded={handleEnded}
                      onError={() => setHasError(true)}
                  />

                  {!isLoaded && (
                      <div className="absolute inset-0 bg-[#141422] animate-pulse" />
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                      <div className="flex items-center gap-3">
                          <button
                              onClick={handlePlayPause}
                              className="w-10 h-10 rounded-full bg-[#00FFB3] text-slate-900 flex items-center justify-center hover:scale-110 transition-transform shadow-lg"
                              aria-label={isPlaying ? "Pause" : "Play"}
                          >
                              {isPlaying
                                  ? <Pause className="w-4 h-4 fill-current" />
                                  : <Play className="w-4 h-4 fill-current ml-0.5" />
                              }
                          </button>
                          <button
                              onClick={handleMuteToggle}
                              className="w-8 h-8 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors"
                              aria-label={isMuted ? "Unmute" : "Mute"}
                          >
                              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                          </button>
                          <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                              <div
                                  ref={progressRef}
                                  className="h-full bg-[#00FFB3] rounded-full transition-none"
                                  style={{ width: `${progress}%` }}
                              />
                          </div>
                          <span className="text-[10px] font-mono text-white/50 tabular-nums">
                              {props.duration ?? 8}s
                          </span>
                      </div>
                  </div>

                  {!isPlaying && isLoaded && (
                      <div
                          className="absolute inset-0 flex items-center justify-center cursor-pointer"
                          onClick={handlePlayPause}
                      >
                          <div className="w-16 h-16 rounded-full bg-black/40 backdrop-blur-sm border border-white/10 flex items-center justify-center hover:scale-110 transition-transform">
                              <Play className="w-6 h-6 text-white fill-white ml-1" />
                          </div>
                      </div>
                  )}
              </>
          ) : (!props.videoUrl || hasError) ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#141422] gap-4 p-4 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-red-500/5 border border-red-500/10 flex items-center justify-center">
                      <Film className="w-6 h-6 text-red-400/30" />
                  </div>
                  <div className="text-center">
                      <p className="text-[#8A8AB0] font-mono text-[10px] uppercase tracking-widest mb-2 opacity-50">Visual Signal Lost</p>
                      <p className="text-[#8A8AB0]/50 font-mono text-[9px] max-w-[200px] mx-auto mb-4">
                          {!props.videoUrl ? "Failed to resolve related HD video or animation." : "Video failed to load."}
                      </p>
                      {props.videoUrl && (
                          <button
                              onClick={handleReload}
                              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-[10px] font-mono text-[#00FFB3] hover:bg-white/10 transition-all mx-auto"
                          >
                              <RefreshCw className="w-3 h-3" /> Re-establish Link
                          </button>
                      )}
                  </div>
              </div>
          ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-[#141422] overflow-hidden">
                  <div className="absolute inset-0 bg-[linear-gradient(110deg,#141422_0%,#1E1E35_40%,#141422_60%)] bg-[length:200%_100%] animate-[shimmer_3s_ease-in-out_infinite]" />
                  <div className="text-center relative z-10">
                      <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-[#00FFB3]/5 flex items-center justify-center border border-[#00FFB3]/10">
                          <Film className="w-8 h-8 text-[#00FFB3]/30 animate-pulse" />
                      </div>
                      <div className="text-[#8A8AB0] font-display font-black text-[11px] uppercase tracking-[0.4em] mb-2 opacity-80">AI Motion Graphics</div>
                      <div className="text-[#8A8AB0]/40 font-mono text-[9px] uppercase tracking-widest">Resolving High-Fidelity Video</div>
                  </div>
              </div>
          )}
      </div>

      {/* Description panel — hidden when empty */}
      {props.description && (
          <div className="mt-3 px-5 py-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/[0.06]">
              <p className="font-serif italic text-sm text-[#B0B0C8] leading-relaxed">
                  {props.description}
              </p>
          </div>
      )}
  </div>
  ```

- [ ] **Step 2: Verify right panel is unchanged**

  Lines 213–235 (the right panel) should remain exactly as-is. The grid layout at line 97 also stays unchanged (`grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start`).

- [ ] **Step 3: Commit**

  ```bash
  git add components/course/blocks/video-snippet.tsx
  git commit -m "feat: add description panel below video, remove green border from video-snippet"
  ```

---

## Task 4: full-image-section — Radius + Split Layout

**Files:**
- Modify: `components/course/blocks/full-image-section.tsx`

- [ ] **Step 1: Update component signature to accept new fields**

  Change line 8 from:

  ```tsx
  export function FullImageSection({ imageUrl, image_url, url, imageAlt, alt_text, caption, captionHighlight, callouts = [] }: any) {
  ```

  To:

  ```tsx
  export function FullImageSection({ imageUrl, image_url, url, imageAlt, alt_text, caption, captionHighlight, callouts = [], explanation, layout }: any) {
  ```

- [ ] **Step 2: Fix `rounded-[2.5rem]` → `rounded-xl`**

  Find line 35:

  ```tsx
  className="relative overflow-hidden aspect-video bg-[#05050A] rounded-[2.5rem] my-12 shadow-2xl"
  ```

  Change to:

  ```tsx
  className="relative overflow-hidden aspect-video bg-[#05050A] rounded-xl my-12 shadow-2xl"
  ```

- [ ] **Step 3: Wrap in conditional split layout**

  The current component returns a `<>` fragment with `<style>` and `<section>`. Wrap the return to add the split layout. Replace the entire `return (` block with:

  ```tsx
  const showSplit = !!explanation && layout !== "hero";

  if (showSplit) {
      return (
          <>
              <style>{`@keyframes shimmer { 0% { background-position:200% 0 } 100% { background-position:-200% 0 } }`}</style>
              <div className="my-12 flex flex-col md:flex-row gap-6 items-start">
                  {/* Image — 55% */}
                  <section
                      ref={containerRef}
                      className="relative overflow-hidden bg-[#05050A] rounded-xl shadow-2xl w-full md:w-[55%] aspect-video shrink-0"
                  >
                      <motion.div style={{ scale, y: yShift, opacity }} className="absolute inset-0 w-full h-full">
                          {finalUrl ? (
                              finalUrl.match(/\.(mp4|webm)$/i) ? (
                                  <video ref={videoRef} src={finalUrl} className="w-full h-full object-contain" autoPlay loop muted playsInline onLoadedData={() => setIsLoaded(true)} />
                              ) : (
                                  <motion.img ref={imgRef} initial={{ filter: "blur(20px)", opacity: 0 }} animate={isLoaded ? { filter: "blur(0px)", opacity: 1 } : {}} transition={{ duration: 0.8 }} src={finalUrl} alt={finalAlt || "Lesson illustration"} className="w-full h-full object-contain" onLoad={() => setIsLoaded(true)} />
                              )
                          ) : (
                              <div className="flex items-center justify-center h-full bg-[#141422]">
                                  <ImageIcon className="w-8 h-8 text-[#00FFB3] opacity-40 animate-pulse" />
                              </div>
                          )}
                      </motion.div>
                      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/40" />
                      {(caption || captionHighlight) && (
                          <div className="absolute bottom-4 left-0 right-0 px-5 text-center">
                              <p className="font-body text-xs text-white/60 leading-relaxed">
                                  {caption}{captionHighlight && <span className="text-[#00FFB3] font-bold"> — {captionHighlight}</span>}
                              </p>
                          </div>
                      )}
                  </section>

                  {/* Explanation — 45% */}
                  <div className="flex-1 flex flex-col justify-center py-4">
                      <div className="w-8 h-px mb-6" style={{ background: "linear-gradient(90deg, #00FFB3, transparent)" }} />
                      <p className="font-body text-[1.05rem] text-[#C8C8E0] leading-[1.85]">{explanation}</p>
                  </div>
              </div>
          </>
      );
  }

  return (
      // ... existing full-width render unchanged (just with rounded-xl fix already applied above)
  ```

  Note: the existing full-width return body is unchanged — only the `rounded-[2.5rem]` on line 35 of the full-width path also needs the radius fix (Step 2 applies to both paths).

- [ ] **Step 4: Commit**

  ```bash
  git add components/course/blocks/full-image-section.tsx
  git commit -m "feat: full-image-section — reduce radius, add conditional split layout for explanation field"
  ```

---

## Task 5: flow-diagram — Explanation Card

**Files:**
- Modify: `components/course/blocks/flow-diagram.tsx`

- [ ] **Step 1: Accept `explanation` prop**

  Line 75 currently:

  ```tsx
  export function FlowDiagram({ title, steps, contrast, imageUrl }: FlowDiagramBlock & { imageUrl?: string }) {
  ```

  Change to:

  ```tsx
  export function FlowDiagram({ title, steps, contrast, imageUrl, explanation }: FlowDiagramBlock & { imageUrl?: string }) {
  ```

- [ ] **Step 2: Add explanation card after diagram content**

  The component currently returns `<div>` ending at line 146. Before the closing `</div>`, add:

  ```tsx
      {/* Explanation — shown when present */}
      {explanation && (
          <div className="mt-8 px-5 py-4 rounded-xl bg-white/[0.04] border border-white/[0.07] backdrop-blur-sm">
              <p className="font-body text-[0.95rem] text-[#B0B0C8] leading-relaxed">
                  {explanation}
              </p>
          </div>
      )}
  </div>
  ```

- [ ] **Step 3: Commit**

  ```bash
  git add components/course/blocks/flow-diagram.tsx
  git commit -m "feat: add explanation inset card to flow-diagram block"
  ```

---

## Task 6: applied-case — 3-Tab Redesign

**Files:**
- Modify: `components/course/blocks/applied-case.tsx`

- [ ] **Step 1: Replace the component with tabbed version**

  Fully replace the file content:

  ```tsx
  "use client";

  import React, { useState } from 'react';
  import { AppliedCaseBlock } from "@/lib/types/lesson-blocks";
  import { Briefcase, Target, CheckCircle2, Image as ImageIcon } from "lucide-react";
  import { motion, AnimatePresence } from "framer-motion";

  const ACCENT_COLOURS = ["#00FFB3", "#4b98ad", "#FFB347"];

  export function AppliedCase(props: AppliedCaseBlock) {
      const [activeTab, setActiveTab] = useState(0);

      // Normalise: if tabs array present use it, otherwise wrap legacy fields in single-tab array
      const tabs = props.tabs && props.tabs.length > 0
          ? props.tabs
          : [{ id: "tab_0", label: "Case Study", scenario: props.scenario, challenge: props.challenge, resolution: props.resolution, imageUrl: props.imageUrl }];

      const tab = tabs[activeTab];
      const accent = ACCENT_COLOURS[activeTab % ACCENT_COLOURS.length];

      return (
          <motion.div
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
              <div className="bg-[#0d0d1c] rounded-2xl border border-white/10 overflow-hidden shadow-xl relative">
                  {/* Top accent line */}
                  <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#00FFB3]/60 via-[#4b98ad]/30 to-transparent" />

                  {/* Header */}
                  <div className="bg-[#1C2242] px-6 py-4 border-b border-white/5 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#00FFB3]/20 flex items-center justify-center">
                          <Briefcase className="w-4 h-4 text-[#00FFB3]" />
                      </div>
                      <div className="font-display text-[14px] font-bold text-white tracking-wide">Applied Case Study</div>
                  </div>

                  {/* Tab buttons — only shown when more than 1 tab */}
                  {tabs.length > 1 && (
                      <div className="flex border-b border-white/5 px-6 gap-1 pt-3">
                          {tabs.map((t, i) => (
                              <button
                                  key={t.id || i}
                                  onClick={() => setActiveTab(i)}
                                  className="relative px-4 py-2.5 text-[12px] font-mono font-bold tracking-[0.12em] uppercase transition-colors duration-200 rounded-t-lg"
                                  style={{
                                      color: activeTab === i ? ACCENT_COLOURS[i % ACCENT_COLOURS.length] : "rgba(255,255,255,0.3)",
                                      borderBottom: activeTab === i ? `2px solid ${ACCENT_COLOURS[i % ACCENT_COLOURS.length]}` : "2px solid transparent",
                                  }}
                              >
                                  {t.label || `Case ${i + 1}`}
                              </button>
                          ))}
                      </div>
                  )}

                  {/* Tab panel */}
                  <AnimatePresence mode="wait">
                      <motion.div
                          key={activeTab}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          transition={{ duration: 0.25 }}
                          className="p-6 md:p-8"
                      >
                          {/* Optional image */}
                          {tab.imageUrl && (
                              <div className="mb-6 w-full aspect-video rounded-xl overflow-hidden">
                                  <img
                                      src={tab.imageUrl}
                                      alt={tab.label || "Case illustration"}
                                      className="w-full h-full object-cover"
                                  />
                              </div>
                          )}

                          <div className="space-y-6">
                              {/* Scenario */}
                              <div>
                                  <h4 className="text-[12px] font-mono font-bold tracking-[0.16em] text-[#8A8AB0] uppercase mb-3 flex items-center gap-2">
                                      <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
                                      The Scenario
                                  </h4>
                                  <p className="text-[#C8C8E0] font-body text-[16px] leading-relaxed">{tab.scenario}</p>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                  {/* Challenge */}
                                  <div className="bg-amber-500/5 rounded-xl border border-amber-500/10 p-5">
                                      <h4 className="text-[12px] font-mono font-bold tracking-[0.16em] text-amber-500 uppercase mb-3 flex items-center gap-2">
                                          <Target className="w-3.5 h-3.5" />
                                          The Challenge
                                      </h4>
                                      <p className="text-amber-100/80 font-body text-[15px] leading-relaxed">{tab.challenge}</p>
                                  </div>

                                  {/* Resolution */}
                                  <div className="bg-[#00FFB3]/5 rounded-xl border border-[#00FFB3]/10 p-5">
                                      <h4 className="text-[12px] font-mono font-bold tracking-[0.16em] text-[#00FFB3] uppercase mb-3 flex items-center gap-2">
                                          <CheckCircle2 className="w-3.5 h-3.5" />
                                          The Resolution
                                      </h4>
                                      <p className="text-[#00FFB3]/80 font-body text-[15px] leading-relaxed">{tab.resolution}</p>
                                  </div>
                              </div>
                          </div>
                      </motion.div>
                  </AnimatePresence>
              </div>
          </motion.div>
      );
  }
  ```

- [ ] **Step 2: Commit**

  ```bash
  git add components/course/blocks/applied-case.tsx
  git commit -m "feat: applied-case redesign — 3-tab layout with optional image per tab, backward-compatible"
  ```

---

## Task 7: prediction — Visual Redesign

**Files:**
- Modify: `components/course/blocks/prediction.tsx`

- [ ] **Step 1: Replace with gradient card + left-accent bars**

  Fully replace the file content:

  ```tsx
  "use client";

  import { useState } from "react";
  import { motion, AnimatePresence } from "framer-motion";
  import { PredictionBlock } from "@/lib/types/lesson-blocks";
  import { cn } from "@/lib/utils";

  export function Prediction({ question, options, correctIndex, reveal, accentColour = "iris" }: PredictionBlock) {
      const [selected, setSelected] = useState<number | null>(null);
      const answered = selected !== null;

      const accentHex = accentColour === "pulse" ? "#00FFB3"
          : accentColour === "amber" ? "#FFB347"
          : "#4b98ad";

      const getOptionState = (i: number) => {
          if (!answered) return "idle";
          if (i === correctIndex) return "correct";
          if (i === selected) return "wrong";
          return "dim";
      };

      return (
          <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="rounded-2xl overflow-hidden"
              style={{
                  background: `linear-gradient(135deg, ${accentHex}10 0%, ${accentHex}06 100%)`,
                  border: `1px solid ${accentHex}25`,
              }}
          >
              <div className="px-8 py-8">
                  {/* Label */}
                  <div className="flex items-center gap-3 mb-7">
                      <div className="w-2 h-5 rounded-sm" style={{ background: accentHex }} />
                      <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: accentHex }}>
                          Before you continue
                      </span>
                  </div>

                  {/* Question */}
                  <p className="font-sans font-bold text-[1.1rem] text-white leading-snug mb-8 tracking-tight">
                      {question}
                  </p>

                  {/* Options */}
                  <div className="space-y-4">
                      {options.map((opt: string, i: number) => {
                          const state = getOptionState(i);
                          return (
                              <button
                                  key={i}
                                  disabled={answered}
                                  onClick={() => setSelected(i)}
                                  className={cn(
                                      "w-full text-left rounded-xl transition-all duration-200 overflow-hidden",
                                      "flex items-stretch",
                                      !answered && "cursor-pointer hover:bg-white/[0.04]",
                                      answered && "cursor-default"
                                  )}
                                  style={{
                                      background: state === "correct" ? "rgba(0,255,179,0.06)"
                                          : state === "wrong" ? "rgba(255,107,107,0.05)"
                                          : "rgba(255,255,255,0.03)",
                                      border: `1px solid ${state === "correct" ? "rgba(0,255,179,0.3)"
                                          : state === "wrong" ? "rgba(255,107,107,0.2)"
                                          : "rgba(255,255,255,0.07)"}`,
                                  }}
                              >
                                  {/* Left accent bar */}
                                  <div
                                      className="w-1 shrink-0 rounded-l-xl transition-colors duration-200"
                                      style={{
                                          background: state === "correct" ? "#00FFB3"
                                              : state === "wrong" ? "#FF6B6B"
                                              : state === "idle" ? `${accentHex}40`
                                              : "rgba(255,255,255,0.05)",
                                      }}
                                  />
                                  <div className="flex items-center gap-4 px-5 py-4 flex-1">
                                      {/* Numbered badge */}
                                      <span
                                          className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center font-mono text-[11px] font-bold transition-colors duration-200"
                                          style={{
                                              background: state === "correct" ? "rgba(0,255,179,0.15)"
                                                  : state === "wrong" ? "rgba(255,107,107,0.12)"
                                                  : `${accentHex}15`,
                                              color: state === "correct" ? "#00FFB3"
                                                  : state === "wrong" ? "#FF6B6B"
                                                  : state === "dim" ? "rgba(255,255,255,0.2)"
                                                  : accentHex,
                                          }}
                                      >
                                          {String.fromCharCode(65 + i)}
                                      </span>
                                      <span
                                          className="text-[15px] font-medium leading-snug"
                                          style={{
                                              color: state === "correct" ? "#00FFB3"
                                                  : state === "wrong" ? "rgba(255,107,107,0.6)"
                                                  : state === "dim" ? "rgba(255,255,255,0.2)"
                                                  : "rgba(255,255,255,0.75)",
                                          }}
                                      >
                                          {opt}
                                      </span>
                                  </div>
                              </button>
                          );
                      })}
                  </div>

                  {/* Reveal */}
                  <AnimatePresence>
                      {answered && (
                          <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              transition={{ duration: 0.35, ease: [0.25, 0, 0, 1] }}
                              className="overflow-hidden"
                          >
                              <div className="mt-7 pt-7 border-t border-white/8">
                                  <span className="font-mono text-[11px] uppercase tracking-widest block mb-3"
                                      style={{ color: selected === correctIndex ? "#00FFB3" : "#FF6B6B" }}>
                                      {selected === correctIndex ? "Correct —" : "Not quite —"}
                                  </span>
                                  <p className="text-white/70 text-[16px] leading-relaxed font-sans">{reveal}</p>
                              </div>
                          </motion.div>
                      )}
                  </AnimatePresence>
              </div>
          </motion.div>
      );
  }
  ```

- [ ] **Step 2: Commit**

  ```bash
  git add components/course/blocks/prediction.tsx
  git commit -m "feat: prediction block visual redesign — gradient card, left-accent option bars, numbered badges"
  ```

---

## Task 8: type-cards — 16:9 Image Area + Remove Image Border

**Files:**
- Modify: `components/course/blocks/type-cards.tsx`

- [ ] **Step 1: Fix BentoCard image container (line 112)**

  Find in `BentoCard`:

  ```tsx
  <div className="relative w-full h-32 mb-4 overflow-hidden rounded-lg border border-white/10 group-hover:border-white/20 transition-colors">
  ```

  Change to:

  ```tsx
  <div className="relative w-full aspect-video mb-4 overflow-hidden rounded-lg">
  ```

- [ ] **Step 2: Fix GridLayout image container (line 185)**

  Find in `GridLayout`:

  ```tsx
  <div className="mb-3 overflow-hidden rounded-lg aspect-auto h-24 sm:h-28 border border-white/5">
  ```

  Change to:

  ```tsx
  <div className="mb-3 overflow-hidden rounded-lg aspect-video">
  ```

- [ ] **Step 3: Fix HorizontalLayout image container (line 240)**

  Find in `HorizontalLayout`:

  ```tsx
  <div className="hidden sm:block shrink-0 w-24 h-24 overflow-hidden rounded-md border border-white/5">
  ```

  Change to:

  ```tsx
  <div className="hidden sm:block shrink-0 w-28 h-20 overflow-hidden rounded-md">
  ```

- [ ] **Step 4: Commit**

  ```bash
  git add components/course/blocks/type-cards.tsx
  git commit -m "fix: type-cards — image area to 16:9 aspect-video, remove image container borders"
  ```

---

## Task 9: recap-slide — 4-Box Items Layout

**Files:**
- Modify: `components/course/blocks/recap-slide.tsx`

- [ ] **Step 1: Add `BoxStyle` function before `RecapSlide` export**

  Import `useCourseDNA` is already present. Add `BoxStyle` after `BentoStyle` (before line 177):

  ```tsx
  // ── Style: BOX (4 coloured cards — title + body per card) ─────────────────
  function BoxStyle({ title, items, accent }: { title: string; items: Array<{ title: string; body: string }>; accent: string }) {
      const ACCENT_CYCLE = [accent, "#4b98ad", "#FFB347", "#FF6B6B"];

      return (
          <motion.div
              className="mb-20 mt-10"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
              <div className="text-center mb-10">
                  <div className="inline-block px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-5">
                      <span className="font-mono text-[10px] uppercase tracking-[0.3em]" style={{ color: accent }}>Key Takeaways</span>
                  </div>
                  <h2 className="font-display font-black text-white text-2xl md:text-3xl tracking-tight leading-tight max-w-2xl mx-auto">
                      {title || "What you should take from this lesson"}
                  </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-4xl mx-auto">
                  {items.map((item, idx) => {
                      const cardAccent = ACCENT_CYCLE[idx % ACCENT_CYCLE.length];
                      return (
                          <motion.div
                              key={idx}
                              initial={{ opacity: 0, y: 16 }}
                              whileInView={{ opacity: 1, y: 0 }}
                              viewport={{ once: true }}
                              transition={{ delay: idx * 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                              className="relative p-6 rounded-2xl border overflow-hidden"
                              style={{
                                  background: `linear-gradient(135deg, ${cardAccent}0c 0%, rgba(255,255,255,0.02) 100%)`,
                                  borderColor: `${cardAccent}25`,
                              }}
                          >
                              <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, ${cardAccent}60, transparent)` }} />
                              <div className="flex items-center gap-3 mb-3">
                                  <span
                                      className="w-7 h-7 rounded-full flex items-center justify-center font-mono font-bold text-[11px] shrink-0"
                                      style={{ background: `${cardAccent}18`, color: cardAccent }}
                                  >
                                      {idx + 1}
                                  </span>
                                  <h3 className="font-display font-bold text-white leading-snug" style={{ fontSize: "0.95rem" }}>
                                      {item.title}
                                  </h3>
                              </div>
                              <p className="font-body text-[0.9rem] text-[#A0A0BC] leading-relaxed pl-10">
                                  {item.body}
                              </p>
                          </motion.div>
                      );
                  })}
              </div>

              <div className="h-px w-full max-w-4xl mx-auto mt-16"
                  style={{ background: `linear-gradient(90deg, transparent, ${accent}20, transparent)` }} />
          </motion.div>
      );
  }
  ```

- [ ] **Step 2: Update `RecapSlide` export to prefer `BoxStyle` when `items` present**

  Replace lines 177–187:

  ```tsx
  // ── Main export ───────────────────────────────────────────────────────────────
  export function RecapSlide(props: RecapBlock) {
      const { primary_colour } = useCourseDNA();
      const points = props.points || (props as any).items || [];
      const items  = props.items || [];
      const title  = props.title || "What you should take from this lesson";

      // If items[] present (new format), use BoxStyle — 4 cards each with title + body
      if (items.length > 0) {
          return <BoxStyle title={title} items={items} accent={primary_colour} />;
      }

      // Fallback: points[] present — use BentoStyle
      return <BentoStyle title={title} points={points} accent={primary_colour} />;
  }
  ```

- [ ] **Step 3: Commit**

  ```bash
  git add components/course/blocks/recap-slide.tsx
  git commit -m "feat: recap-slide — add BoxStyle for items[] (4 coloured cards with title + body)"
  ```

---

## Task 10: Generator — Schema Updates + Quality Rules

**Files:**
- Modify: `lib/ai/agent-system-v2.ts`

- [ ] **Step 1: Update 6 `getBlockSchemaDoc` entries**

  In `getBlockSchemaDoc` function (lines 298–332), replace the following entries in the `schemas` object:

  ```typescript
  // Replace video_snippet entry:
  'video_snippet': 'video_snippet — AI-generated cinematic clip. REQUIRED fields: type, id, title, caption, videoPrompt (EXACTLY 5 SENTENCES motion-arc structure — S1: lesson concept + title, S2: visible objects/interfaces, S3: start→change→end motion arc, S4: camera + environment, S5: exclusions + fidelity target), description (EXACTLY 2 SENTENCES: S1 what the viewer will see, S2 why it matters for this lesson), video_search_query (3-5 words), duration: "8s".',

  // Replace full_image entry:
  'full_image': 'full_image — wide visual. REQUIRED fields: imagePrompt (MINIMUM 1000 WORDS ultra-detailed), caption (1–2 sentences), explanation (2–3 sentences INTERPRETING what the visual reveals — not describing what is visible), layout ("split" when explanation present, "hero" for standalone atmosphere images).',

  // Replace flow_diagram:steps entry:
  'flow_diagram:steps': 'flow_diagram steps — linear process (3–6 steps). title, steps[]{label, description, colour}, explanation (2–3 sentences interpreting what the flow reveals — the conclusion the learner should draw).',

  // Replace flow_diagram:contrast entry:
  'flow_diagram:contrast': 'flow_diagram contrast — before/after. title, contrast{ labelA, labelB, stepsA[], stepsB[], middleNode, outcomeA, outcomeB }, explanation (2–3 sentences interpreting what the contrast reveals).',

  // Replace applied_case entry:
  'applied_case': 'applied_case — 3 real-world scenarios as tabs. REQUIRED fields: tabs (array of EXACTLY 3 objects each with: id (string), label (string, 2-4 words), scenario (string, 2-3 sentences), challenge (string, 2-3 sentences), resolution (string, 2-3 sentences), imageUrl (omit — filled by pipeline)).',

  // Replace recap entry:
  'recap': 'recap — end-of-lesson summary. REQUIRED fields: title (string), items (array of EXACTLY 4 objects each with: title (4–6 words, bold takeaway), body (EXACTLY 2 sentences expanding on why this takeaway matters)).',

  // Replace key_terms entry:
  'key_terms': 'key_terms — glossary. REQUIRED fields: terms (array of MINIMUM 12 objects each with: term (string), definition (EXACTLY 2 sentences — first sentence defines the term precisely, second sentence explains where it appears or why it matters)).',
  ```

- [ ] **Step 2: Inject quality rules into LessonExpanderAgent prompt**

  In the prompt string (after line 444, after `>>> BE LITERAL. BE ACCURATE. BE TECHNICAL.`), add the following block before `${BANNED_WORDS_INSTRUCTION}`:

  ```typescript
  const LESSON_QUALITY_RULES = `
  LESSON CONTENT QUALITY RULES — ABSOLUTE LAW:

  STRUCTURE:
    • objective blocks:      exactly 2 sentences — S1: what the learner will understand, S2: why it matters for them
    • video_snippet blocks:  REQUIRED "description" field — exactly 2 sentences: S1 what the viewer will see, S2 why it matters for this lesson. Must be readable at a glance — legible text, not a faint footnote.
    • recap blocks:          exactly 4 items; each item MUST have "title" (4–6 words) AND "body" (2 sentences). NO plain string points — always use the items[] format.
    • applied_case blocks:   exactly 3 scenarios in "tabs" array; each tab: id, label, scenario, challenge, resolution. imageUrl is omitted — the pipeline fills it.
    • key_terms blocks:      minimum 12 terms; each term MUST have "definition" (2 sentences — precise definition + real-world context).

  TEXT QUALITY:
    • text blocks: 3–5 paragraphs per block; max 3 sentences per paragraph
    • sentence length: short and direct — one idea per sentence
    • avoid long compound sentences joined by multiple "which", "that", "however" chains
    • no paragraph should look like a dense wall of text — if it does, break it
    • reduce verbosity by 15% — say more with less

  IMAGE EXPLANATIONS (semantic quality — ABSOLUTE):
    • full_image blocks:    REQUIRED "explanation" field — 2–3 sentences
    • flow_diagram blocks:  REQUIRED "explanation" field — 2–3 sentences
    • type_cards cards:     REQUIRED "description" field — 3–4 sentences explaining the card's concept and why it matters
    • ALL explanations MUST interpret what the visual reveals — NOT describe what is visible
      BAD:  "This image shows a transformer architecture diagram."
      GOOD: "The layout reveals how the attention mechanism links tokens regardless of their position in the sequence, which is why transformers outperform recurrent networks on long-context tasks."

  LAYOUT HINTS:
    • full_image blocks: set layout: "split" when explanation is present; layout: "hero" for standalone atmosphere or opening images only
  `.trim();
  ```

  Then in the prompt template string, add `${LESSON_QUALITY_RULES}` after the VISUAL ACCURACY block (after line 444):

  Change:
  ```typescript
  >>> BE LITERAL. BE ACCURATE. BE TECHNICAL.

  ${BANNED_WORDS_INSTRUCTION}
  ```

  To:
  ```typescript
  >>> BE LITERAL. BE ACCURATE. BE TECHNICAL.

  ${LESSON_QUALITY_RULES}

  ${BANNED_WORDS_INSTRUCTION}
  ```

  The `LESSON_QUALITY_RULES` constant should be declared at module scope near the top of the `LessonExpanderAgent` class or just before the `expandLesson` method.

- [ ] **Step 3: Commit**

  ```bash
  git add lib/ai/agent-system-v2.ts
  git commit -m "feat: inject lesson quality rules into LessonExpanderAgent prompt; update 6 block schema docs"
  ```

---

## Task 11: Sanitizer Updates

**Files:**
- Modify: `lib/ai/content-sanitizer.ts`

- [ ] **Step 1: Add REPAIR for recap `items` normalisation**

  In the `if (type === 'recap')` block (around line 329), add `items` handling after the existing `points` logic:

  ```typescript
  if (type === 'recap') {
      // Alias resolution for legacy points[]
      let pts = (repaired as any).points || (repaired as any).takeaways || [];
      if (!Array.isArray(pts)) pts = [];
      const normalizedPts = pts.map((it: any) =>
          typeof it === 'string' ? it : it?.text || it?.point || it?.takeaway || String(it)
      );

      // New items[] format — normalise objects vs strings
      let itms = (repaired as any).items || [];
      if (!Array.isArray(itms)) itms = [];
      const normalizedItems = itms.map((it: any) => {
          if (typeof it === 'string') return null; // Cannot fabricate title+body from a string
          if (it && typeof it === 'object' && it.title && it.body) return it;
          // Try alias resolution
          const title = it?.title || it?.heading || it?.label || '';
          const body  = it?.body  || it?.text   || it?.content || '';
          return title ? { title, body } : null;
      }).filter(Boolean);

      if (normalizedItems.length > 0) {
          repaired.items = normalizedItems;
          if (normalizedItems.length < 4) {
              console.warn(`[ContentSanitizer] ⚠️ recap block "${block.id}" — items has ${normalizedItems.length} entries (expected 4), saving as-is`);
          }
      } else if (normalizedPts.length > 0) {
          repaired.points = normalizedPts;
      } else {
          console.warn(`[ContentSanitizer] ⚠️ recap block "${block.id}" — missing both points and items, using fallback`);
          repaired.points = ['Key insight 1', 'Key insight 2', 'Key insight 3', 'Key insight 4'];
      }
  }
  ```

- [ ] **Step 2: Add WARN paths for missing semantic fields**

  After the existing `if (type === 'recap')` block and before `if (type === 'key_terms')`, add:

  ```typescript
  // ── WARN: missing semantic content — do NOT fabricate ────────────────────
  if (type === 'video_snippet' && !repaired.description) {
      console.warn(`[ContentSanitizer] ⚠️ video_snippet block "${block.id}" — missing "description" field. Component will hide the panel.`);
  }
  if (type === 'full_image' && !repaired.explanation) {
      console.warn(`[ContentSanitizer] ⚠️ full_image block "${block.id}" — missing "explanation" field. Component falls back to full-width, no split layout.`);
  }
  if (type === 'flow_diagram' && !repaired.explanation) {
      console.warn(`[ContentSanitizer] ⚠️ flow_diagram block "${block.id}" — missing "explanation" field. Component will render diagram without interpretive text.`);
  }
  ```

- [ ] **Step 3: Add WARN for key_terms fewer than 12**

  Update the `if (type === 'key_terms')` block (around line 346):

  ```typescript
  if (type === 'key_terms') {
      if (Array.isArray(repaired.terms)) {
          repaired.terms = repaired.terms.map((t: any) =>
              typeof t === 'string' ? { term: t, definition: 'Key concept.' } : t
          );
          if (repaired.terms.length < 12) {
              console.warn(`[ContentSanitizer] ⚠️ key_terms block "${block.id}" — only ${repaired.terms.length} terms (expected ≥12). Saving as-is; do NOT pad with invented terms.`);
          }
      }
  }
  ```

- [ ] **Step 4: Add paragraphs-splitting REPAIR**

  In `validateAndRepairBlock`, after the existing field loop (around line 295), add:

  ```typescript
  // REPAIR: paragraphs[] containing a single giant string → split on sentence boundaries
  if (type === 'text' && Array.isArray(repaired.paragraphs) && repaired.paragraphs.length === 1) {
      const raw = repaired.paragraphs[0] as string;
      if (typeof raw === 'string' && raw.length > 300) {
          // Split on ". " followed by capital letter (sentence boundary heuristic)
          const sentences = raw.match(/[^.!?]+[.!?]+[\s]*/g) || [raw];
          const chunks: string[] = [];
          let current = '';
          for (const s of sentences) {
              current += s;
              if (current.trim().split(/[.!?]/).filter(Boolean).length >= 2) {
                  chunks.push(current.trim());
                  current = '';
              }
          }
          if (current.trim()) chunks.push(current.trim());
          if (chunks.length > 1) {
              console.warn(`[ContentSanitizer] ℹ️ text block "${block.id}" — split 1 giant paragraph into ${chunks.length} paragraphs`);
              repaired.paragraphs = chunks;
          }
      }
  }
  ```

- [ ] **Step 5: Commit**

  ```bash
  git add lib/ai/content-sanitizer.ts
  git commit -m "feat: sanitizer — add WARN for missing description/explanation/key_terms, REPAIR for recap items and paragraph splitting"
  ```

---

## Task 12: Regenerate Lesson 3573

**Files:**
- Runtime action only — no code changes

- [ ] **Step 1: Identify the course**

  Lesson 3573 is in course 834. Confirm with:

  ```bash
  # Run against Supabase (via psql or Supabase Studio SQL editor)
  SELECT id, topic_id, title FROM course_lessons WHERE id = 3573;
  SELECT id, course_id, title FROM course_topics WHERE id = (SELECT topic_id FROM course_lessons WHERE id = 3573);
  ```

- [ ] **Step 2: Delete lesson 3573**

  In Supabase Studio SQL editor:

  ```sql
  -- Check what we're about to delete
  SELECT l.id, l.title, t.title as topic_title, c.title as course_title
  FROM course_lessons l
  JOIN course_topics t ON l.topic_id = t.id
  JOIN courses c ON t.course_id = c.id
  WHERE l.id = 3573;

  -- Delete (cascades to course_lesson_images, content_blocks, etc.)
  DELETE FROM course_lessons WHERE id = 3573;
  ```

- [ ] **Step 3: Trigger regeneration via v2 pipeline**

  Navigate to `/admin/courses/edit/834` in the browser. The lesson slot will show as missing. Use the "Generate" button for that lesson slot to trigger the v2 pipeline.

  Alternatively, trigger via curl (replace `<auth-cookie>` with a valid session):

  ```bash
  curl -X POST http://localhost:3000/api/course/generate-v2 \
    -H "Content-Type: application/json" \
    -d '{
      "courseId": 834,
      "targetDuration": 30
    }'
  ```

  Monitor the SSE stream for completion. Expected output:
  - `[API-V2] ✅ All media generated. Saving to DB...`
  - `[API-V2] Lesson saved — id: <new_id>`

- [ ] **Step 4: Visual verification**

  Open the new lesson in the browser. Confirm:
  - `video_snippet` blocks have a description panel below the video
  - `full_image` blocks with explanation render as split layout
  - `recap` block renders 4 coloured cards with title + body (not plain bullets)
  - `applied_case` block shows 3 tabs
  - `prediction` block has gradient background + left-accent option bars
  - `flow_diagram` blocks have an explanation card below
  - No visible `border border-white/5` on `image-text-row` images

---

## Task 13: Verification Checklist

A quick checklist to confirm all 10 spec requirements are met after Task 12.

- [ ] **1.1 Image borders** — No visible white border on `image-text-row` image containers. `full-image-section` uses `rounded-xl` (not `rounded-[2.5rem]`).
- [ ] **1.2 video_snippet description** — Panel appears below video when `description` field is present. If `description` is absent, no blank space appears.
- [ ] **1.3 prediction visual** — Gradient card background. Each option has a left accent bar + numbered badge. More vertical breathing room (space-y-4).
- [ ] **1.4 full_image split** — When `explanation` present AND `layout` is not `"hero"`, image renders at 55% left, explanation text at 45% right.
- [ ] **1.5 flow_diagram explanation** — Soft inset card appears below the diagram with interpretive text. Hidden if absent.
- [ ] **1.6 applied_case 3 tabs** — Three tab buttons appear. Each tab shows scenario/challenge/resolution. Tab with `imageUrl` shows image at top of panel. Legacy single-scenario data still renders (one tab, no tab bar).
- [ ] **1.7 image-text-row** — No border on image container. Desktop: ~48%/52% split. Mobile: stacks vertically.
- [ ] **1.8 type_cards** — Image area is `aspect-video` (16:9). No border on image container.
- [ ] **1.9 recap** — 4 coloured cards in a 2×2 grid on desktop, 1-column on mobile. Each card has a bold title (4–6 words) and 2-sentence body.
- [ ] **1.10 key_terms** — Generator produces ≥12 terms. Sanitizer logs a warning but does not pad if fewer are returned.

---

## Spec Self-Review

**Coverage check against `docs/superpowers/specs/2026-03-27-lesson-quality-standard.md`:**

| Spec section | Covered by |
|---|---|
| 1.1 Image borders (image-text-row, full-image, type-cards, lesson-header) | Tasks 2, 4, 8 — lesson-header border not present in current code, skip |
| 1.2 video_snippet description panel | Tasks 1, 3, 10, 11 |
| 1.3 prediction visual redesign | Task 7 |
| 1.4 full_image conditional split | Tasks 1, 4, 10 |
| 1.5 flow_diagram explanation | Tasks 1, 5, 10, 11 |
| 1.6 applied_case 3 tabs + optional images | Tasks 1, 6, 10 |
| 1.7 image_text_row border + responsive | Task 2 (responsive stacking already present via Tailwind md: classes) |
| 1.8 type_cards image area + body | Tasks 1, 8 (body text already supported via description field) |
| 1.9 recap 4-box with title + body | Tasks 1, 9, 10, 11 |
| 1.10 key_terms minimum 12 | Tasks 10, 11 |
| Section 2 generator rules | Task 10 |
| Section 2.2 sanitizer REPAIR/WARN separation | Task 11 |
| Section 3 implementation order | This plan follows: A (components) → C (generator) → sanitizer → B (regeneration) |

**No gaps found.**
