# Product analytics — Compass (PostHog)

This note records the one product question this build instruments, the event
contract behind it, the privacy rules around it, and the analysis the data is
meant to answer. Everything here is offline: no event was transmitted while
building or verifying this change.

## Project facts

| Item | Value |
| --- | --- |
| Package manager | npm 10.9.9 (single root package, `mba-compass`) |
| Lockfile | `package-lock.json`, lockfileVersion 3, kept and updated in place |
| Rival lockfiles | none — no `yarn.lock`, `pnpm-lock.yaml`, `bun.lock*`; not a Yarn project |
| Node | v22.23.3 |
| TypeScript | 5.6.3 (`tsc --noEmit`, `strict`) |
| Build tool | Vite 5.4.21 + React 18.3.1 |
| Analytics importer | root package (`src/lib/analytics-client.ts`) |

### Quality commands (actual, as of this change)

| Command | Baseline | After the change |
| --- | --- | --- |
| `npm run typecheck` | pass | pass |
| `npm run build` | pass (412 modules) | pass |
| `npm run verify:analytics` | did not exist | pass |
| lint | **no lint script in `package.json`** | not applicable |
| tests | **no test script or test files before this change** | `npm run verify:analytics` runs `tests/analytics.test.ts` |

Baseline was recorded before any edit: typecheck and build both passed, so
there were no pre-existing failures to preserve. The build now bundles
`posthog-js` (the main chunk grows from ~381 kB to ~719 kB); that is the only
baseline metric that changed.

## Question

**Of the students who start the assessment, how many reach a scored report,
and how many turn that report into an exported resume?**

This is the first activation loop in Compass: the landing page sends students to
`#assess`, the assessment produces the report every later module reads, and the
resume studio is where the report becomes an artefact a recruiter can open. If
students start but never finish, the product question is "where do they stop?";
if they finish but never export, it is "does the report lead anywhere?".

## Events

Three events, one funnel. No other event is allowed to leave the browser: the
`before_send` scrubber drops anything that is not on this list.

| # | Event | When it fires | Properties (allowlist) |
| --- | --- | --- | --- |
| 1 | `assessment_started` | Student clicks **Start the questions →** on the assessment mode step | `mode` (`domain`/`role`/`ready`), `resumed` (boolean — they already had answers) |
| 2 | `assessment_completed` | Student clicks **Generate my report →** after the skill audit | `mode`, `signal` (boolean — at least one answer carried scoreable signal), `answered` (count of answered questions, 0–14), `has_target_role` (boolean) |
| 3 | `resume_exported` | Student exports the resume (ATS `.txt`, `Download PDF`, or `Print / Save PDF`) | `format` (`txt`/`pdf`/`print`), `template` (`ats`/`modern`/`minimal`), `completion_band` (`thin` < 40, `partial` < 70, `ready` ≥ 70) |

### Triggers (real files and functions)

- `src/pages/Assess.tsx` — the "Start the questions" and "Generate my report"
  button handlers call `analytics.assessmentStarted(...)` and
  `analytics.assessmentCompleted(...)`.
- `src/pages/ResumePage.tsx` — `trackExport(format)` is called by the ATS `.txt`
  button, the print button, and after a successful `downloadPdf` (the PDF
  failure path records the print fallback instead).
- Handlers themselves: `createAnalytics()` in `src/lib/analytics.ts`.

There is no duplicate page-view, click or scroll event anywhere: `autocapture`,
`capture_pageview`, `capture_pageleave` and `capture_dead_clicks` are all set to
`false`, and session recording, surveys, error collection and feature flags are
disabled.

## Allowed properties and what is never collected

Only the keys in the event table can be sent. The scrubber also drops any value
that looks like an email, a card number, a `phc_`/`phx_`/`sk-` style token, or a
URL — even inside an allowed key — and it caps string values at 64 characters.

Never collected: assessment answers or "Other" free text, experience text,
resume content or contact details, name, email, phone, LinkedIn URL, company or
role targets, `$current_url`, `$pathname`, `$referrer`, `$referring_domain`,
`$session_id`, `$set` person properties, IP-derived metadata beyond what the
ingestion endpoint needs to accept the request.

Delivery fields kept so an event can actually arrive: `token` (the public
project token), `distinct_id` (PostHog's opaque anonymous id), `$lib`,
`$lib_version`, `$process_person_profile` (`false`, so no person profile is
created). An email-shaped `distinct_id` is dropped.

## Identity

Anonymous only. Compass has no accounts, login or user ids, so the browser stays
on PostHog's generated opaque device id (`person_profiles: 'never'`). There is no
`identify()` call anywhere. If an authenticated id is added later, it must be
passed as `identify(<opaque stable id>)` — never an email or a shared literal —
and `reset()` must run on logout. Today `reset()` is wired to consent withdrawal:
denying analytics opts the SDK out and clears the local anonymous id
(`denyAnalyticsConsent()`), so a later opt-in starts from a new id.

## Consent

- The client initialises with `opt_out_capturing_by_default: true`; no stored
  decision means capture stays off.
- `src/components/ConsentBar.tsx` is the only place a decision is created. It
  shows once, above the landing page and the app, and explains the three events.
- `grantAnalyticsConsent()` writes `compass.analytics.consent.v1` and calls
  `opt_in_capturing()`; `denyAnalyticsConsent()` writes `denied`, calls
  `opt_out_capturing()` and `reset()`.
- The sidebar footer has a one-line toggle so a decision can be changed at any
  time ("Analytics on · turn off" / "Analytics off · turn on").
- No decision, denied consent, or unreadable storage all keep capture off. There
  is no cookieless fallback and no pre-existing CMP was replaced (the project had
  none).

## Configuration

| Name | Where | Value |
| --- | --- | --- |
| `VITE_POSTHOG_PROJECT_TOKEN` | build-time (`.env.local` locally) | public project token; empty keeps capture off |
| `VITE_POSTHOG_HOST` | build-time (`.env.local` locally) | ingestion host: `https://us.i.posthog.com`, `https://eu.i.posthog.com`, or a self-hosted ingestion domain |

`.env.example` declares both as empty placeholders. `.gitignore` already ignores
`.env*` and keeps `.env.example`, so a real local value never enters git. Both
values are required; without them `initAnalytics()` never calls
`posthog.init()` and every handler is a no-op. There is no default region.

## Integration evidence

- SDK: `posthog-js@1.438.13` declared in `package.json` and resolved in
  `package-lock.json` (`node_modules/posthog-js`, tarball
  `posthog-js-1.438.13.tgz`, integrity pinned). Installed with
  `npm install posthog-js@1.438.13` — no manager switch, no lock migration.
- One client: `src/lib/analytics-client.ts` is the only file importing
  `posthog-js`; `initAnalytics()` runs once from `src/main.tsx` (the Vite entry
  boundary) and the app reuses that singleton through `analytics` in the same
  module.
- Privacy defaults on that client: `autocapture: false`,
  `capture_pageview: false`, `capture_pageleave: false`,
  `capture_dead_clicks: false`, `disable_session_recording: true`,
  `disable_surveys: true`, `disable_external_dependency_loading: true`,
  `advanced_disable_flags: true`, `person_profiles: 'never'`,
  `persistence: 'localStorage'`, `opt_out_capturing_by_default: true`, plus the
  `before_send` scrubber above.
- Failures are harmless: the transport call is wrapped in `try/catch` inside
  `createAnalytics()`, so a blocked or failed request returns `false` and the
  student's report, export or navigation is unaffected.

## Live analysis (once configured)

Build this in PostHog → Product analytics → Funnels.

- **Funnel (ordered):** `assessment_started` → `assessment_completed` → `resume_exported`.
- **Denominator:** unique students (distinct ids) who triggered `assessment_started` in the window.
- **Window:** the same browser session (default 30-minute session window) for the
  first two steps; 7 days for the export step, since students often finish the
  resume later.
- **Timeframe:** last 14 days, reviewed weekly.
- **Breakdown:** `mode` on step 1, and `format` on step 3.
- **Success measure:**
  - report conversion = step 2 ÷ step 1. Target ≥ 55% (the report is only one
    step after the mode pick).
  - export conversion = step 3 ÷ step 2. Target ≥ 20% within 7 days.
  - A drop of 15 points between two weekly readings is the trigger to look at
    the assessment or resume studio.

The question is answered when the funnel shows both conversion rates and the
`mode` breakdown says which entry point loses the most students.

## Offline verification

```bash
npm run verify:analytics
```

`posthog-analytics.verify.mjs` re-reads `package.json` and `package-lock.json`,
confirms the single SDK importer, the empty token/host placeholders, the env
ignore rules and the absence of a real token literal, then runs
`tests/analytics.test.ts` through `node --test` with `shell: false`, a 120 s
timeout, a minimal environment, a synthetic token/host and fetch disabled. The
runner fails if the test files, the runner or any assertion is missing.

`tests/analytics.test.ts` exercises the real handlers with an in-memory
transport and proves: no decision or denied consent sends nothing; missing
token/host keeps capture off; each real action emits exactly one event with only
allowlisted properties; email/password/token/card/resume sentinels and
URL/referrer metadata never appear; transport failures are swallowed; consent
storage round-trips; identity reset is called on withdrawal.

## Still pending (needs a real PostHog project)

The code side is complete and verified offline. Nothing has been sent to
PostHog. To confirm the insight against real events:

1. Create or open a PostHog project for Compass.
2. Put its public project token and ingestion host in `.env.local` (git-ignored)
   as `VITE_POSTHOG_PROJECT_TOKEN` and `VITE_POSTHOG_HOST`, then restart
   `npm run dev`.
3. Click **Allow analytics**, start the assessment, generate the report and
   export the resume.
4. In PostHog, find the three events and build the funnel above; record the
   conversion rates and the `mode` breakdown as the finding.
