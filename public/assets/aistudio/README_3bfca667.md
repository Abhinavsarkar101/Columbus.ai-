# Compass — Career OS for MBA students

A single-page career platform for MBA students and aspirants. It answers five questions in sequence:

1. **Which specialization should I take?** — interest + work-style assessment across 8 domains
2. **Which role inside that domain fits me?** — skill-weighted ranking of 19 MBA roles
3. **Am I actually job-ready for that role?** — readiness score, ranked gaps, 90-day plan
4. **Does my resume match this job?** — JD parsing, keyword gap, ATS checks, bullet rewrites
5. **Who do I talk to about this specific job, and what do employees say about the role?** — people map + role-level review lens

Plus two supporting tools: an ATS-aware **resume studio** with PDF export, and **company prep** with hiring rounds, pay bands, a review digest and LinkedIn outreach templates.

The build opens on a **marketing landing page** (`/`) that explains the pain points, differentiates the five modules against job boards / resume builders / career content, answers the awkward questions, and captures enquiries. The app itself lives behind the CTAs at `/#home`, `/#assess` and the other hash routes.

## Run it

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # typecheck + production build
```

By default there is no backend and no API key. All data is stored in `localStorage` under `compass.assessment.v1`, `compass.resume.v1`, `compass.target.v1`, `compass.connectors.v1` and `compass.contact.v1` (landing enquiries). The optional FreeLLMAPI refinement adds a small server-side proxy; see [Optional AI refinement](#optional-ai-refinement-freellmapi).

## Modules

### 0. Landing page (`src/pages/Landing.tsx`, `src/landing.css`)

- **Hero** with a working product mock (domain-fit bars, readiness ring, a target contact and a "message ready" chip) rather than a stock illustration.
- **Pain points** the product was designed backwards from — specialization doubt, unknown job titles, ATS rejection, JD gaps, silent applications and company-wide reviews that hide role reality.
- **Product differentiation** for all five tools: what each one does, what it hands to the next, and a "Different because" line that names the difference from the usual tool category.
- **Comparison table** across Compass, job boards, resume builders and career content, labelled as directional. Plus the three product principles: no black box, no scraping, no sign-up wall.
- **How it works**, an output callout, a six-question FAQ, and a **contact section** with validation, a local copy of the message and a prefilled `mailto:` handoff. There is no backend, so the UI says exactly that instead of pretending to send.
- **Responsive**: one breakpoint system for desktop, tablet and mobile; the landing nav becomes a menu at 900 px, the hero mock and product grid collapse in stages, and the comparison table scrolls inside its card instead of widening the page.


### 1. Assessment (`src/lib/scoring.ts`, `src/data/questions.ts`)

Three entry modes, one question bank:

| Mode | What it does |
| --- | --- |
| Domain | 14 scenario questions → normalised fit across all 8 domains, then top roles in the winning domain |
| Role | Same questions, but the role ranking is restricted to the chosen domain |
| Readiness | Same questions, but the report leads with a readiness score for a specific role |

Every question also has an **Other** option. The student can type the task, team or outcome in their own words; the answer is read in the browser by `src/lib/freeText.ts` and added to the domain and work-style scores (up to one question's weight, so it supplements rather than overrides the structured answers). The report shows each typed answer, what the interpreter read from it, and a confidence score.

The interpreter is a transparent cue lexicon with negation and intensity handling, not a hosted LLM. That is a deliberate constraint: a link shared with a college group can see 60 or 600 users, and no hosted LLM is free **and** unlimited at that volume. A static bundle also cannot hold a provider key safely. Reading locally means zero cost, no quota, no upload and the same result for the first user and the six-hundredth. The optional FreeLLMAPI path below is explicit, self-hosted and quota-bound, and the local reading remains the fallback.

Scoring is deterministic and inspectable when using the local reading (the default):

- **Domain score** = selected option weights ÷ the maximum weight available for that domain in the questions answered. "Other" answers contribute a bounded weight from the local interpreter. No hidden model, no "AI magic".
- **Trait score** = same normalisation over 6 work-style axes (analytical, people, creative, execution, commercial, structure).
- **Role fit** = `0.7 × skill coverage + 0.3 × trait fit`, where skill coverage uses the role's own skill weights (1–5).
- **Readiness** = `0.82 × skill coverage + 0.18 × evidence bonus`. The evidence bonus counts how many of the role's keywords actually appear in the student's experience text.
- **Gaps** = role skills weighted 3+ where the self-rating is below 65%, ordered by role weight.
- **90-day plan** is generated from the top two gaps plus the role's own keywords and certifications.
- Returning to the tab resumes a partial attempt at the first unanswered question; a completely empty assessment opens the three entry modes instead of a 0/100 report. `Change mode` is always available while answering.
- No evidence, no claim: only answers that can move a score (a weighted option, or an "Other" note the interpreter can read) count as signal. A clicked-but-blank "Other", gibberish, or a work-style-only answer never produces a detected domain or a target role, and the dashboard states the basis (`1/14 answers`) next to any domain it does show. A target role is named only when the student picked one or a domain actually scored.
- The target-role picker is searchable by title or domain (type “brand”, “finance”, “product”), with arrow-key/Enter support, in both the skill audit and the report’s **Change the target** card.

### 2. Resume studio (`src/lib/resume.ts`, `src/pages/ResumePage.tsx`)

- Three templates: ATS Classic (single column), Modern (sidebar), Minimal serif.
- Live preview that reflows to the panel width.
- **Download PDF** renders a hidden full-width A4 node with `html2canvas` + `jsPDF` (lazy-loaded), so the PDF is not affected by the on-screen preview width.
- **ATS .txt** export is real plain text — use it for campus portals that parse uploads.
- **Print / Save PDF** uses a print stylesheet that prints only the resume sheet.
- Completeness score + per-role bullet quantification counter.

### 3. Job match (`src/lib/jd.ts`)

- 70-term MBA taxonomy (marketing, finance, analytics, product, operations, HR, consulting, sales, core) with synonyms.
- Terms found after a requirements heading are weighted **3× more** than terms in responsibilities.
- Output: overall match (keyword coverage 60% + quantified impact 20% + structure 20%), section breakdown, matched/missing keyword chips with criticality, 6 ATS checks, ordered suggestions, and bullet rewrites for lines that lack a metric or the JD's language.
- The "closest role" is inferred by matching JD text against the role library keywords.

### 4. Job target (`src/lib/target.ts`, `src/pages/Target.tsx`)

Name a company and a role — the demo case is **Tecnotree / Senior Product Management Consultant** — and the page builds the two things a JD cannot tell you.

**People map.** Six LinkedIn people searches, pre-built from the role: exact title at the company, same function under nearby titles, the likely hiring manager, alumni from your school, recruiters, and second-degree-only profiles with mutual connections. Each search carries the question to ask that person and the realistic reply rate. No scraping: the link opens LinkedIn's own live directory, already filtered.

**Outreach board.** Paste the profile URL of someone you found. Compass parses the name, writes a three-message sequence (opener → day-4 follow-up → referral ask) personalised by whether the person is a peer, a senior leader or a recruiter, and tracks the stage — not contacted → sent → replied → call → referral. Contacts persist in `localStorage` under `compass.connectors.v1`.

**Role-level reviews.** Role titles are converted into a matching profile (`product management consultant` → `product manager`, `product owner`, `product roadmap`, plus the `product` function). Pasted reviews can carry a tag like `[Glassdoor · 3★ · Senior Product Manager]`; a review tagged with the role counts as role evidence even if the sentence never repeats the title — the same idea as Glassdoor's job-title filter. The output is deliberately blunt about thin evidence: coverage (`4 of 20 statements`), role sentiment vs company-wide sentiment, eight role-relevant theme scores (scope, client travel, release weeks, promotion, pay, job security, process), verbatim quotes with source and rating, and interview questions generated from the weak signals.

**Source links** point at the role-filtered Glassdoor page (employer-id URL pattern), the Glassdoor company page, AmbitionBox, a site-scoped search for both, LinkedIn's company people page, and Levels.fyi. The Tecnotree employer id is verified; any other company falls back to a site-scoped search, which is honest about what can be constructed without an API.

### 5. Company prep (`src/data/companies.ts`, `src/lib/reviews.ts`, `src/pages/Company.tsx`)

- 12 curated company briefs (MBB, Big 4, Amazon, Flipkart, HUL, ITC, Goldman, Kotak, Swiggy, ZS): culture scores, pros/cons, interview rounds, timeline, selectivity, tips, pay bands, target roles.
- **Review digest**: paste reviews from Glassdoor / AmbitionBox / Reddit / seniors; a transparent keyword model scores 6 themes, extracts recurring positives, complaints and red flags.
- **LinkedIn outreach**: pre-filled people-search deep links (alumni, same role, recruiters, recent MBA hires) plus three copy-ready message templates.

## Optional AI refinement (FreeLLMAPI)

The local interpreter is still the default. If you self-host [FreeLLMAPI](https://github.com/tashfeenahmed/freellmapi), the report can refine all **Other** answers in one request through the Node proxy in [`server/llm-proxy.mjs`](server/llm-proxy.mjs). The browser calls `/api/llm/interpret`; the proxy holds the FreeLLMAPI unified key, validates the response and returns the same domain/trait vectors the local interpreter produces. The report's **Refine with AI** button appears only when the proxy reports a configured key.

Why the proxy exists: FreeLLMAPI is a self-hosted, single-user router, and its unified `freellmapi-…` key must never be shipped to the browser. The proxy keeps the key server-side, caps concurrency and answer length, caches identical reports for 24 hours, and returns a clean error so the UI falls back to the local reading.

Setup (install FreeLLMAPI, add provider keys, copy the unified key, run `npm run llm-proxy`) and the production/security notes are in [`server/README.md`](server/README.md). The important constraint is unchanged: FreeLLMAPI's own documentation calls it personal experimentation, not production; its aggregate free-token figure is not a guaranteed quota for a whole college cohort, and upstream provider terms still apply. The local interpreter remains the fallback, and AI refinement is an explicit opt-in request, not an automatic dependency.

## What is deliberately not built

- **No scraping.** Glassdoor, AmbitionBox and LinkedIn prohibit automated crawling in their terms, and any scraped directory would be stale within weeks. Instead the app builds the exact search or the job-title-filtered page and opens it in one click, then analyses what the student pastes back. That keeps the data live and the student's LinkedIn account safe. A production version with a partnership or licensed API could resolve people server-side and prefetch reviews.
- **No hosted LLM by default.** Every score starts as a deterministic function of the answers. A public hosted model cannot be free and unlimited for a cohort link, and its key cannot live in a static bundle; a browser-downloaded generative model is hundreds of megabytes and unreliable on student phones. The local interpreter in `src/lib/freeText.ts` gives unlimited, private interpretation at zero cost. The optional FreeLLMAPI path above is explicit, self-hosted and falls back to the local reading.
- **No accounts.** Everything is local to the browser. Multi-device sync needs a backend.

## Where a backend would slot in

| Capability | Suggested seam |
| --- | --- |
| Accounts + cross-device sync | Replace the two `localStorage` calls in `src/App.tsx` with an API |
| Live company data | `src/data/companies.ts` → fetch from a server route with licensed sources |
| LLM-refined free text | Implemented: `buildReport(assessment, aiSignals)` accepts per-question vectors from the optional FreeLLMAPI proxy, with the local interpreter as the fallback. |
| LLM-written feedback | `buildReport()` in `src/lib/scoring.ts` returns numbers; narrative is rendered in `Assess.tsx` |
| Live job feed | `Match.tsx` accepts any pasted JD already; a feed would only prefill it |
| Contact inbox | `Landing.tsx` validates and opens a `mailto:`; replace `setMailto` with a POST to a server route and keep the local copy as a fallback |
| Verified insider directory | Replace the LinkedIn search deep links with an opt-in alumni/insider directory, so the person is shown in-app rather than one click away |
| Licensed review feed | Replace the paste box in `Target.tsx` with a licensed Glassdoor/AmbitionBox feed; the role lens in `src/lib/target.ts` already takes plain text |

## Stack

Vite 5 · React 18 · TypeScript (strict) · no UI library, no state library, no router dependency (hash-based navigation). `jspdf` + `html2canvas` are loaded on demand only when a PDF is requested. No server is required by default: the assessment's free-text reading runs on the device, so usage is limited only by the browser, not by a quota. The optional `server/llm-proxy.mjs` is a dependency-free Node service for the FreeLLMAPI refinement path.
