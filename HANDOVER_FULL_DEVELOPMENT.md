# 📘 AI Bytes Learning - Development Handover

**Date:** 22nd Dec 2025
**Role:** Lead Developer Handover
**Status:** Active Development (Critical Blocker in Admin Route)

## 🚀 Project Overview
**AI Bytes Learning** is an AI-powered e-learning platform designed to democratize AI education. It features "byte-sized" 15-minute lessons generated on-demand by AI.
- **Mission:** Democratize AI education for non-coders.
- **Key Feature:** **NeuralLoom** / **Planetary Curriculum Engine** (AI Course Generator). Admins can generate full courses (Topics, Lessons, Quizzes) from a simple prompt.

## 🛠️ Technology Stack
- **Framework:** Next.js 15+ (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS (Vanilla CSS for specific overrides)
- **Database/Auth:** Supabase
- **Icons:** Lucide React
- **AI Integration:** Google Gemini / Groq (via internal APIs)

## 🎨 Design System & Aesthetics
- **Theme:** "Dark Pro" / "Cosmic" / "Futuristic".
- **Visuals:** Deep black backgrounds (#000000), white text, indigo/purple/cyan accents/glows. Use of glassmorphism (`backdrop-blur`).
- **Navigation:** Top bar with "AI Bytes Learning" logo.
- **Admin UI:** heavily stylized "Command Center" feel, distinct from distinct standard SaaS dashboards.

## 📍 Current State of Development

### 1. ✅ Completed / Working
- **Home Page:** Functional with "Dark Pro" theme.
- **Course Generation:** The "New Course" page (`/admin/courses/new`) is fully redesigned ("Planetary Curriculum Engine") and functional. It generates courses into Supabase.
- **Public Course View:** `/courses/[id]` displays the generated content correctly.
- **Admin Course List:** `/admin/courses` lists all courses correctly.

### 2. 🚧 Work in Progress
- **Admin Course Editor:** Intended to be at `/admin/courses/[id]`. This page allows admins to edit the AI-generated content (titles, chapters, text).
- **Features:** Drag-and-drop reordering (planned), Content Regeneration (planned).

### 3. 🛑 Critical Known Issues (BLOCKERS)
- **Admin Edit Route 404:** The application currently returns a **404 Not Found** for the Admin Edit page (`/admin/courses/123`), despite the file existing at `app/admin/courses/[id]/page.tsx`.
    - *See `HANDOVER_ADMIN_ROUTE_FIX.md` for technical deep-dive.*
    - **Hypothesis:** Middleware conflict, Route group issue, or Next.js param type mismatch (Sync vs Async).

## 📂 Key Directory Structure
```
l:\ai-bytes-learning 21st dec 25\
├── app\
│   ├── admin\
│   │   ├── courses\
│   │   │   ├── [id]\           <-- The Troublesome Directory (Edit Page)
│   │   │   ├── new\            <-- Working (Course Generator)
│   │   │   └── page.tsx        <-- Working (Course List)
│   └── courses\
│       └── [courseId]\         <-- Working (Public View)
├── components\
│   └── ui\                     <-- Reusable UI components (Button, Input, etc.)
└── lib\
    └── supabase\               <-- DB Client
```

## 📅 Immediate Priorities for Next Dev
1.  **Resolve the Admin Route 404:** This is the absolute top priority. The editor is inaccessible.
    *   *Check `middleware.ts` for path exclusions.*
    *   *Verify Next.js version requirements for `params`.*
2.  **Verify Asset Generation:** Ensure images/videos generated during course creation are properly linked.
3.  **Polish Editor UI:** Once the route works, ensure the "Dark Pro" theme is consistently applied to the edit forms (Inputs, Textareas).

## 📝 Credentials & Config
- **User Role:** Lead Developer.
- **Browser Port:** Usually `3000` or `3001` (Check logs).
- **Environment:** Windows.
