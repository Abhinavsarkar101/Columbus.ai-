# Implementation Plan: Job URL Auto-Fetch, Removal of XYZ Framework, and One-Click Resume Bullet Replacements

## User Objectives & Requirements
1. **Job Description Link Input & Auto-Fetch**:
   - Remove the default sample JDs from the main view (or make them optional/hidden, replacing them with a dedicated **Job Link Input** where users paste a specific job URL from LinkedIn, Greenhouse, Lever, or company career sites).
   - Automatically extract/parse the job title and company from the URL slug and populate the authentic corresponding job description.
   - Retain the dual option: users can either paste the job URL (auto-fetched) OR paste raw text directly.
2. **Remove XYZ Framework Reference**:
   - Remove all mentions of "(XYZ Framework)" from the UI (e.g. in `src/pages/Match.tsx`). Rename section to "Targeted Bullet Point Rewrites".
3. **One-Click Apply to Resume Button**:
   - Add an explicit **"Apply to Resume"** / **"Replace in Resume"** button on each improved bullet point card.
   - Strict requirement: It ONLY replaces the matching original bullet in the resume experience history *when the user explicitly clicks the button* (never automatically without user action).
   - Once clicked, updates the resume state (`onUpdateResume`), shows a success confirmation toast/badge ("Applied to Resume Studio!"), allowing the user to view the updated bullet in Resume Studio and download it.

## Proposed Changes

### 1. Update `src/pages/Match.tsx`
- **Job URL Input Section**:
  - Add a dedicated input field: "Paste Job URL (LinkedIn, Greenhouse, Lever, etc.)".
  - Add a "Fetch Job Description" button (or auto-parse on input change/blur).
  - Extract company and title from URL path (e.g., `linkedin.com/jobs/view/senior-product-manager-at-stripe-12345` -> Title: "Senior Product Manager", Company: "Stripe").
  - Map recognized job slugs to authentic professional job descriptions or parse cleanly.
- **Remove XYZ Framework**:
  - Update section heading from `Targeted Bullet Point Rewrites (XYZ Framework)` to `Targeted Bullet Point Rewrites`.
- **One-Click Apply Button**:
  - Add `onApplyRewrite(original, improved)` handler.
  - When user clicks "Apply to Resume" on a rewrite card:
    - Iterate through `resumeData.experience`, find the experience item containing the original bullet (or matching keywords), and replace that exact bullet string with the improved bullet string.
    - Call `onUpdateResume(updatedResume)`.
    - Show an "Applied ✓" feedback state on the button.

### 2. Verification Plan
- Compile applet with `compile_applet`.
- Run TypeScript lint check with `lint_applet`.
