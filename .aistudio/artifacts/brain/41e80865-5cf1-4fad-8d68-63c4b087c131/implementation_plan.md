# Firebase Authentication & Firestore Persistence Integration

Integrate Firebase Authentication (Email/Password with verification & Google Sign-In with account linking) and Firestore persistence into the application while preserving 100% of existing functionality and providing a seamless signed-out localStorage fallback.

## User Review & Critical Decisions

> [!IMPORTANT]
> - **Zero Disruption**: Existing functionality, UI styling, and offline localStorage mode remain 100% intact and functional without any auth walls.
> - **Email Abuse Guard**: Disposed domain blocklist bundled locally; verification email required for cloud sync (local storage remains active while unverified).

- **Confirmed Decision 1**: Signed-out users have full access to the app via localStorage, with a non-blocking prompt to sign in.
- **Confirmed Decision 2**: Automatic migration prompt on first sign-in to sync existing local data to Firestore.

---

## 1. Overview & Core Concept

- **What It Does**: Adds robust user authentication and cloud synchronization while keeping offline local storage fully operational.
- **Key Capabilities**:
  - Email/Password sign-up, sign-in, and password reset.
  - Google Sign-In with automatic account linking for duplicate emails.
  - Disposable email blocklist check on sign-up (allowing `.edu`, `.ac.in`, corporate domains, and gmail).
  - Email verification requirement for cloud synchronization with a 60s rate-limited resend banner.
  - Storage abstraction layer supporting seamless fallback between localStorage and Firestore.

---

## 2. User Experience & Visual Design

- **Authentication UI**: Modal / Dialog based sign-in, sign-up, and forgot password screens styled consistently with the application's dark theme (`#070B14`, `#0E1526`, `#00DF89` emerald accents).
- **Account Menu**: Compact header avatar / badge showing signed-in status, verification badge, and Sign Out action.
- **Sync Status & Banner**: Non-blocking banner for unverified users ("Verify your email to save your work across devices") with a Resend button.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Storage Abstraction Layer**
  - *Chosen Approach*: Single `storageService` interface with `localStorage` and `firestore` backends.
  - *Why*: Keeps application code decoupled from Firebase specifics and ensures seamless offline fallback.
- **Decision 2: Non-blocking Auth**
  - *Chosen Approach*: Users can use the entire app without signing in. Auth is purely additive for multi-device sync.

---

## 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────┐
│                   Application UI                       │
└──────────────────────────┬─────────────────────────────┘
                           │ calls storageService
                           ▼
┌────────────────────────────────────────────────────────┐
│              Storage Abstraction Layer                 │
│         (Detects Auth State & Email Verification)      │
└───────────┬────────────────────────────────┬───────────┘
            │                                │
            ▼ (Signed out / Unverified)      ▼ (Signed in & Verified)
┌───────────────────────┐        ┌───────────────────────────────┐
│     localStorage      │        │           Firestore           │
│  (100% Offline Mode)  │        │  (users/{uid}/collections)    │
└───────────────────────┘        └───────────────────────────────┘
```

- **Data Models**:
  - `users/{uid}/resumes/{id}`
  - `users/{uid}/jobs/{id}`
  - `users/{uid}/assessments/{id}`
  - `users/{uid}/reports/{id}`
  - `users/{uid}/preferences/main`
- **Security Rules**: Enforce `request.auth != null && request.auth.uid == userId` for all paths.
