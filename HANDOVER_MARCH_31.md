# Handover — 31st March 2026

## Session Summary

This session focused on **site-wide dark theme conversion**, **Stripe payment critical bug fixes**, and **UI polish** across public-facing and admin pages. All work is in the active working directory: `D:\ai-bytes-leaning-22nd-feb-2026 Backup`.

---

## 1. Dark Theme Conversion — Pages Completed

All pages converted to the site's dark theme standard:
- Root background: `bg-[#0a0a0f]`
- Glass cards: `bg-white/[0.04] border border-white/[0.08] backdrop-blur-sm`
- Text: `text-white`, `text-white/65`, `text-white/50`, `text-white/40`
- Brand teal accents: `#00FFB3` (pulse), `#9B8FFF` (iris), `#FFB347` (amber)

### Pages Converted

| Page | File | Notes |
|------|------|-------|
| Sign Up | `app/auth/signup/page.tsx` | Full rewrite — dark inputs, teal accents, glass card |
| About | `app/about/page.tsx` | `replace_all` bulk conversion of semantic CSS vars → dark tokens; `<Footer />` added |
| Careers | `app/careers/page.tsx` | Slate light colours → dark equivalents; card backgrounds, text |
| Contact | `app/contact/page.tsx` | Full rewrite — glass form, teal icon squares, dark FAQ cards, `<Footer />` added |
| Pricing | `app/pricing/page.tsx` | Annual billing fix + dark theme; removed "Limited Time 20% Off" badge |
| Admin: New Course | `app/admin/courses/new/page.tsx` | Full dark conversion — blobs, nav, badge, heading, input, module/difficulty buttons, avatar section, tip box, disabled state, footer metrics |

---

## 2. Stripe Payment — Critical Bug Fixes

**File:** `app/api/stripe/create-checkout/route.ts`

Two critical bugs fixed that would have prevented subscriptions from working correctly:

### Bug 1 — Plan ID Mismatch (Checkout Never Completed)
- **Problem:** Pricing page sends `plan: "standard"` but `STRIPE_PRICE_IDS` only has a `byte_pass` key. `getPriceId("standard", ...)` threw a runtime error — checkout sessions were never created.
- **Fix:** Added a `planIdMap` normalisation layer:
  ```typescript
  const planIdMap: Record<string, Exclude<PlanType, 'free' | 'enterprise'>> = {
      standard:     'byte_pass',
      byte_pass:    'byte_pass',
      professional: 'professional',
      unlimited:    'unlimited',
  };
  const selectedPlan = planIdMap[plan];
  ```

### Bug 2 — Wrong Plan Name Stored in DB Metadata (Paying Users Treated as Free)
- **Problem:** Raw `plan` string (`"standard"`) was being stored in Stripe subscription metadata → saved to DB → `PLAN_DETAILS["standard"]` returned `undefined` → paying subscribers incorrectly shown as free tier.
- **Fix:** Metadata now stores `selectedPlan` (the normalised `byte_pass`/`professional`/`unlimited` key), not raw `plan`.

### Bug 3 — Trial Period Check Used Wrong Variable
- **Problem:** `trial_period_days` condition checked raw `plan === 'unlimited'` instead of `selectedPlan === 'unlimited'`.
- **Fix:** Changed to use `selectedPlan`.

### Billing Cycle Validation Added
- Added explicit validation that rejects any `billingCycle` that isn't `'monthly'` or `'annual'` with a 400 response.

---

## 3. Pricing Page — Annual Billing Display Fix

**File:** `app/pricing/page.tsx`

- **Problem:** Yearly toggle was still showing monthly price figures (e.g., £15/mo instead of £180/yr).
- **Fix:** Price display now resolves correctly:
  ```tsx
  const price = isAnnual ? (plan.price?.annual ?? 0) : (plan.price?.monthly ?? 0);
  // label: /{isAnnual ? "yr" : "mo"}
  // savings: Save £{(monthly * 12) - annual} vs monthly
  ```
- **Also removed:** "Limited Time: 20% Off" badge — no longer shown anywhere on pricing page.

---

## 4. Footer — Social Icon Brand Hover Colours

**File:** `components/footer.tsx`

Social icons now show brand-accurate hover colours when moused over:

| Icon | Hover Background | Hover Icon Colour |
|------|-----------------|-------------------|
| X (Twitter) | `bg-white` | `text-black` |
| LinkedIn | `bg-[#0A66C2]` | `text-white` |
| GitHub | `bg-white` | `text-[#1f2328]` |
| Instagram | Gradient `#F58529 → #DD2A7B → #8134AF → #515BD4` | `text-white` |
| YouTube | `bg-[#FF0000]` | `text-white` |
| Discord | `bg-[#5865F2]` | `text-white` |

- `Instagram` removed from lucide-react import (removed in newer lucide versions) — replaced with inline SVG using official filled path.
- Instagram gradient hover uses `onMouseEnter/Leave` with inline style (CSS class can't express multi-stop gradient).

---

## 5. Hero Section — Typography Fixes

**File:** `app/page.tsx`

- Headline: `font-extrabold` (800 weight), `leading-[1.08]`, `letterSpacing: "-0.01em"`
- Copy reverted to original after three rejected alternative versions.

**Final headline (original restored):**
> "Complex AI / Simplified into [rotating word]"

**Subhead:**
> "Real, job-ready AI skills in focused 15-minute lessons. No tech background required."

**CTAs:** "Start Learning Free" + "Browse Library"

**Trust row:** "Build AI Tools" · "Get Certified" · "Lead with AI"

---

## 6. Admin: New Course Page — Heading Update

**File:** `app/admin/courses/new/page.tsx`

Changed the vague, poetic heading to action-oriented copy that ties into the "Architect Engine v4.0" badge shown in the nav:

| Before | After |
|--------|-------|
| "What enters your mind, becomes your curriculum." | "Name your subject. Our AI architects the rest." |

---

## 7. Pages Still Needing Dark Theme Conversion

The following pages were identified in the audit but NOT yet converted:

### Public Pages (Higher Priority)
| Page | File |
|------|------|
| Sign In | `app/auth/signin/page.tsx` |
| Blog List | `app/blog/page.tsx` |
| Blog Post | `app/blog/[id]/page.tsx` |
| Dashboard | `app/dashboard/page.tsx` |
| My Courses | `app/my-courses/page.tsx` |
| Account / Subscription | `app/account/subscription/page.tsx` |
| Privacy Policy | `app/privacy/page.tsx` |
| Terms | `app/terms/page.tsx` |
| Cookies | `app/cookies/page.tsx` |

### Admin Pages (Lower Priority)
| Page | File |
|------|------|
| Admin Courses List | `app/admin/courses/page.tsx` |
| Admin Course View | `app/admin/courses/[id]/page.tsx` |
| Admin Course Edit | `app/admin/courses/edit/[id]/page.tsx` |

---

## 8. Dark Theme Standard (Reference)

All future dark theme conversions should follow this pattern:

```
Root:         bg-[#0a0a0f] text-white
Section alt:  bg-[#0f0f18]
Glass card:   bg-white/[0.04] border border-white/[0.08] backdrop-blur-sm
Input:        bg-white/[0.06] border-white/[0.10] text-white placeholder:text-white/20
              focus: bg-white/[0.08] border-white/20
Text primary: text-white
Text muted:   text-white/65, text-white/50, text-white/40
Borders:      border-white/[0.08]
Separators:   bg-white/20
Blobs:        bg-[#9B8FFF]/5, bg-[#00FFB3]/5

Brand colours:
  Teal (pulse):   #00FFB3
  Purple (iris):  #9B8FFF
  Amber:          #FFB347
  Red (nova):     #FF6B6B

Active button states: bg-white/[0.10] border-[#9B8FFF]/50 ring-2 ring-[#9B8FFF]/30
Disabled button:      bg-white/[0.04] text-white/20 cursor-not-allowed
Tip/info box:         bg-[#9B8FFF]/10 border-[#9B8FFF]/20 text-[#9B8FFF]
```

---

## 9. Dev Environment

- Dev server: `npm run dev` in `D:\ai-bytes-leaning-22nd-feb-2026 Backup`
- No new migrations required for today's work — all changes are frontend only
- `D:\Backup 14th March 2026` — read-only snapshot, do NOT edit

---

## 10. Known Issues / Watch Points

- **Stripe webhooks**: The normalisation fix in `create-checkout/route.ts` ensures correct plan names are stored going forward. However, any existing subscriptions created before this fix may have `"standard"` stored as the plan in DB metadata. These may need a one-time data migration if paying users are affected.
- **Instagram SVG**: The inline SVG path in `components/footer.tsx` uses the official filled Instagram icon. If the icon set is ever upgraded, keep the custom SVG — do not use `lucide-react`'s `Instagram` (removed in newer versions).
- **Pricing annual savings line**: Verify `plan.price.annual` and `plan.price.monthly` are populated for all three plans in the pricing data source. If either is `undefined`, the savings calculation will show `£NaN`.
