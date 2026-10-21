# Implementation Plan: Dual Enrollment Tracks for MBA Specialization Assessment [COMPLETED]

## User Objective & Problem Statement
Currently, the "I want to find my specialization" assessment track assumes students are already deeply familiar with business concepts and terminology. Aspiring MBA students who have not yet joined business school find heavy corporate jargon intimidating. 

The goal was to split Track 1 into two clear student profiles:
1. **"I am about to join / Aspiring MBA"**: A light, high-level, 10-question personality and intuitive logic assessment free of dense jargon to determine natural inclinations and assign a Personality Archetype alongside their top specialization and dual specialization.
2. **"I have joined MBA school / 1st Year Enrolled"**: A practical, scenario-based business assessment with simple, accessible business language (without complex jargon) to help 1st-year students finalize their Major and Minor/Dual Specialization.

---

## Implemented Changes

### 1. Data Structure Updates (`src/data/assessmentTracks.ts`)
- **Aspiring MBA Question Set (`TRACK_1_ASPIRING_QUESTIONS`)**:
  - 10 concise questions focusing on work temperament, problem-solving style, preferred team roles, and intuitive everyday logic:
    1. *Energy & Work Style*: Building things from scratch vs. analyzing numbers vs. understanding consumer emotion vs. helping people grow.
    2. *Group Dilemma*: How you naturally take charge when a college or work project goes off track.
    3. *Curiosity Habit*: What section of the news or social feeds catches your eye first (brand campaigns, financial markets, tech gadgets, organizational culture).
    4. *Decision Making*: Relying on numbers and spreadsheets vs. talking to users and observing behavior.
    5. *Creative vs. Analytical Balance*: Developing a brand story vs. optimizing logistics and delivery times.
    6. *Crisis Management*: Mediating interpersonal conflict vs. calculating financial risks.
    7. *Commercial Instinct*: Pitching an idea to win people over vs. designing the backend process.
    8. *Ideal Project Role*: The Researcher/Analyst, The Communicator/Pitcher, The Planner/Organizer, or The Empath/Team Lead.
    9. *Everyday Logic & Trade-offs*: Prioritizing speed of launch vs. bulletproof financial margins.
    10. *Long-term Motivation*: Creating iconic consumer love, stewarding profitable capital, leading high-performing teams, or launching breakthrough products.
  - Weights assigned across all 8 MBA specializations (`marketing`, `finance`, `product`, `consulting`, `operations`, `analytics`, `hr`, `sales_gm`).
- **Enrolled MBA Question Set (`TRACK_1_ENROLLED_QUESTIONS`)**:
  - Replaced complex financial derivatives and niche jargon with plain, realistic business trade-offs.
- **Personality Archetypes Mapping (`PERSONALITY_ARCHETYPES`)**:
  - Complete mapping of all 8 primary domains to rich archetypes:
    - Marketing: *The Market Storyteller*
    - Product: *The Product Visionary*
    - Finance: *The Capital Architect*
    - Consulting: *The Strategic Problem-Solver*
    - HR: *The People & Culture Catalyst*
    - Operations: *The Execution Mastermind*
    - Analytics: *The Data Sleuth*
    - Sales / GM: *The Commercial Dealmaker*

### 2. UI & Flow Updates (`src/pages/Assess.tsx`)
- **Stage 1 Selection**:
  - When clicking "I want to find my specialization", navigates to calibration screen with 2 prominent, distinct choice cards:
    - **Card A: "I am about to join MBA"** (*Aspiring student or preparing for admissions. 10 high-level personality and intuitive everyday logic questions with zero corporate jargon.*)
    - **Card B: "I have enrolled in MBA school"** (*Currently in your 1st year. 10 practical, real-world business scenarios in plain language to choose your Major and Dual Specialization.*)
- **Questionnaire Screen**:
  - Dynamically loads the calibrated 10-question set based on enrollment status.
  - Updates progress header dynamically (`Track 1: Aspiring MBA · Personality & Logic` vs. `Track 1: Enrolled MBA · Specialization & Dual Major`).
- **Report Screen**:
  - Displays the **Personality Archetype** showcase card with badge, quote, and core personality traits.
  - Displays normalized fit scores across all 8 disciplines.
  - Retains the **Dual Specialization pairing recommendation** (Top 2 highest scoring domains) explaining why the combination provides a strategic edge during campus recruitments.

---

## Verification Results
- `compile_applet`: Clean production Vite build without errors.
- `lint_applet`: Zero TypeScript or syntax errors (`tsc --noEmit`).
- Dev server freshly restarted on port 3000.
