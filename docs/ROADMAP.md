# HelpImTooLazy Roadmap To-Do List

Based on `README.md` requirements and declared stack:
- Frontend: Next.js (App Router)
- Backend: Next.js Route Handlers (Node.js runtime)
- API: REST
- Database: PostgreSQL + Prisma ORM
- Auth: Firebase Auth
- Infra: Docker + Docker Compose
- Security: JWT + validation + authorization controls

---

### Recent updates (May 21, 2026)

- Verified local Docker Compose run: `helpimtoolazy-db` and `helpimtoolazy-app` are up and responding on `http://localhost:3000`.
- Added `GROQ_API_KEY` / `GROQ_MODEL` mappings to `docker-compose.yml` so the AI chat can access Jessalyne from the container.
- Ran test suite: `npm run test -- --runInBand` — 109 tests passed across 9 suites.
- Resolved port conflict for `:3000` and rebuilt the containers locally.


## Phase 0 — Project Setup & Alignment
- [x] Finalize feature scope for MVP (Smart Scheduling, Focus Timer, Progress Dashboard)
- [x] Define repository structure (current single app + shared docs)
- [x] Set up environment variable strategy (`.env.example`)
- [x] Add coding standards (linting, formatting, branch naming, PR checklist)
- [x] Define Definition of Done per feature (UI, API, tests, security checks)

## Phase 1 — UI Foundation (Next.js)
- [x] Build/clean core routes: login, dashboard, calendar, activities, settings
- [x] Connect reusable UI components consistently (cards, tabs, forms, buttons)
- [x] Add client-side state handling for temporary interactions
- [x] Add loading and empty states for each main page
- [x] Add basic responsive behavior for desktop/tablet/mobile

## Phase 2 — Authentication (Firebase Auth + App Session)
- [x] Implement Firebase email/password + Google sign-in flows cleanly
- [x] Add protected route handling for authenticated pages
- [x] Implement backend JWT issuance/verification strategy (if separate backend token is used) (N/A in current frontend-only architecture)
- [x] Add logout flow and session invalidation behavior
- [x] Add auth error handling and user-friendly messages

## Phase 3 — Backend API (Next.js Route Handlers)
- [x] Initialize modular route structure under `app/api/`
- [x] Implement `/api/auth/*` endpoints (register `POST`, session validation `GET`)
- [x] Implement `/api/tasks` CRUD endpoints (`GET`/`POST` + `GET`/`PUT`/`DELETE` by id)
- [x] Implement `/api/sessions` logging endpoint for focus timer data
- [x] Implement `/api/analytics` aggregation endpoint
- [x] Add centralized error handler (`lib/api-response.ts`) + consistent API response format

## Phase 4 — Database Layer (PostgreSQL + Prisma)
- [x] Design Prisma schema (`User`, `Task`, `FocusSession`, optional `Schedule`)
- [x] Create and run initial migrations
- [x] Implement repository/service layer for all data operations
- [x] Enforce per-user data ownership in all queries
- [x] Add seed data script for local development/demo
- [x] Add DB-level constraints (time ordering, non-negative durations, enum-like constraints)
- [x] Add composite indexes for common query paths (`Task.userId + updatedAt`, `FocusSession.userId + completedAt`)
- [x] Use transactions for multi-step write flows where partial failure is risky
- [x] Add pagination/filtering for list endpoints to avoid unbounded scans
- [x] Define migration governance (naming convention, rollback plan, pre-deploy checklist)
- [x] Separate dev/staging/prod database strategy and seed policy per environment
- [x] Document backup/restore runbook (pg_dump/restore) and verification cadence
- [x] Add database observability baseline (slow-query logging + DB error monitoring)

## Phase 5 — Smart Scheduling + AI Integration
- [x] Define scheduling input/output contract (task list + constraints -> schedule)
- [x] Implement deterministic scheduling baseline algorithm first
- [x] Surface deterministic schedule in AI Plan page and calendar AI toggle
- [x] Add AI prioritization endpoint (`/api/ai/prioritize`) — integrated into AI Plan page
- [x] Add burnout detection rule set + recommendation output
- [x] Add fallback behavior when AI service is unavailable
- [x] Add AI planning preferences (preferred hours, max sessions/day, break cadence) (SETTINGS)

## Phase 6 — Focus Timer + Progress Dashboard
- [x] Implement timer start/pause/reset/complete flow
- [x] Persist completed focus sessions to backend
- [x] Build dashboard metrics (completion rate, hours studied, weekly minutes)
- [x] Add priority breakdown metrics visualization
- [x] Ensure analytics are user-scoped and time-filtered
- [x] Add monthly trend visualizations
- [x] Add streak tracking and streak visualizations

## Phase 7 — Security Hardening (WADS focus)
- [x] Validate all request payloads using Zod
- [x] Enforce auth middleware on protected routes
- [x] Add authorization checks on all resource-level operations (row-level security)
- [x] Add rate limiting and abuse protection on auth + critical endpoints
- [x] Secure cookie/token handling strategy (JWT validation middleware)
- [x] Add security test checklist (IDOR, injection, auth bypass, input fuzzing) — tests in `__tests__/integration/security.test.ts`

## Phase 8 — UX/Auth/API Hardening (Post-MVP)
- [x] Run accessibility pass (keyboard navigation, focus order, ARIA labels) — via shadcn/ui components
- [x] Polish responsive UI consistency (spacing, typography, empty/error states) — mobile bottom nav, responsive sidebar
- [x] Improve session-expiry/token-refresh UX handling across protected pages
- [x] Add login-throttling UX messaging for repeated auth failures
- [x] Add account-linking conflict handling notes (Google + email/password)
- [x] Standardize paginated API response metadata (`page`, `pageSize`, `total`) — implemented in task/session endpoints
- [x] Add consistent API error envelope + error-code mapping across all endpoints — via `lib/api-response.ts`

## Phase 9 — Testing & Quality
- [x] Expand unit tests (components, utility functions) — tests in `__tests__/unit/`
- [x] Add backend integration tests for key API paths — tests in `__tests__/integration/`
- [x] Add end-to-end happy-path tests (login -> session/dashboard/focus-timer smoke path)
- [x] Add lint/typecheck/test scripts to CI pipeline
- [x] Add bug triage checklist and regression test matrix

## Phase 10 — Containerization & Deployment
- [x] Create Dockerfiles for frontend and backend
- [x] Create Docker Compose for local full-stack runs
- [x] Configure production env variables and secrets handling — `.env.example` in place
- [x] Deploy frontend (e.g., Vercel) and backend (selected host)
- [x] Run post-deploy smoke tests and rollback plan

## Phase 11 — Documentation & Final Delivery
- [x] Update README with accurate run/setup instructions
- [x] Document API endpoints with request/response examples — Swagger UI at `/api-docs`
- [x] Document architecture decisions and threat/security controls — in `docs/SECURITY_IMPLEMENTATION.md` and `docs/ENGINEERING_STANDARDS.md`
- [ ] Prepare demo script (feature flow + technical explanation)
- [ ] Prepare final submission checklist (code, docs, evidence, test results)
## Impromptu Additions (Features Added Beyond Original Roadmap)

### User Experience Enhancements
- [x] **Profile Photo Upload** — User can upload and store profile pictures
- [x] **Profile Setup Flow** — Post-signup profile completion with university, major, and personal info
- [x] **Email verification** — Firebase email verification during registration
- [x] **Dark/Light Theme Support** — Full theme switching via next-themes
- [x] **API Documentation UI** — Swagger UI endpoint at `/api-docs` with OpenAPI spec

### Focus Timer Extensions
- [x] **Multiple Ambient Sounds** — 16 preset environments (white noise, rain, cafe, forest, ocean, etc.)
- [x] **YouTube Music Integration** — Integrated Lofi Girl, Deep Focus, and Binaural Beats tracks
- [x] **Volume Control** — Granular volume adjustment for ambient sounds
- [x] **Multiple Timer Modes** — Focus (25m), Short Break (5m), Long Break (15m) presets

### Task Management Enhancements
- [x] **Task Attachments** — Support for file attachments (links and file uploads up to 10MB)
- [x] **Attachment Metadata** — Store MIME type and data URLs for file attachments
- [x] **Course/Category Tracking** — Tasks can be tagged with course and category info
- [x] **Quick Status Toggle** — Inline status transitions on dashboard (Pending → In Progress → Completed)

### Settings & Preferences
- [x] **AI Preferences Tab** — Prompt style, response length, and study-mode preferences
- [x] **Notification Settings Tab** — Placeholder for notification preferences
- [x] **Security Settings Tab** — Password change and account deletion controls
- [x] **Account Deletion** — Complete user account removal with cascading data deletion

### AI Assistant & Chat Enhancements
- [x] **Gemini AI Integration** — Added Gemini SDK service with model configuration via environment variables
- [x] **Dedicated AI Chat Room** — New `/ai-chat` page integrated into app navigation
- [x] **AI Conversation Management** — Rename and delete conversations from sidebar
- [x] **Chat Persistence** — Conversation/message storage with Prisma-backed chat models
- [x] **Chat Guardrails** — Rate limiting, message length limits, safer system prompt, and graceful fallbacks
- [x] **AI Settings Panel** — Dedicated settings UI for chat behavior customization
- [x] **Markdown Rendering in Chat** — Assistant markdown output now rendered cleanly in UI
- [x] **Chat UX Fixes** — Fixed nested button hydration bug and message pane scrolling behavior

### Analytics & Insights
- [x] **Priority Breakdown Metrics** — See task distribution by priority level
- [x] **Weekly Focus Minutes** — Track weekly focus session accumulation
- [x] **Task Completion Rate** — Percentage calculation of completed vs. total tasks
- [x] **Dashboard Analytics Widget** — Central metrics display on main dashboard

### Infrastructure & Developer Experience
- [x] **API Response Standardization** — Unified error/success response envelope across all endpoints
- [x] **Pagination Support** — Implemented on tasks and sessions lists with page/pageSize/total
- [x] **Input Sanitization** — XSS protection via sanitization middleware
- [x] **Route Organization** — Modular API structure with clear separation of concerns
- [x] **Seeding Script** — Development database population for testing (`prisma/seed.ts`)
- [x] **Auth Middleware** — Reusable JWT verification middleware across protected routes
- [x] **ESLint Configuration** — Project linting standards set up

---

## Post-Delivery Backlog (Optional)

### Phase 12 — Settings Expansion
- [x] Add notification rules settings (deadline reminders, daily planning reminder, quiet hours)
- [x] Add calendar behavior settings (default view, week-start preference, show completed toggle)
- [x] Add focus timer defaults (focus/break duration presets, auto-start toggle)
- [x] Add account/privacy controls (data export, retention options, visibility summary)
- [x] Add appearance/accessibility settings (density, font size, reduced motion, contrast)

### Phase 13 — Dashboard Enhancements
- [ ] Add Today Snapshot panel (due today count, urgent count, next planned item)
- [ ] Add Quick Actions panel (add task, start focus, open AI plan, quick capture)
- [ ] Add progress widgets (daily completion %, weekly streak, focus minutes today)
- [x] Add Smart Recommendation card (suggested next task from AI plan)
- [ ] Add Overdue shortcut section for immediate triage
- [ ] Add collapsible dashboard sections to keep layout clean at scale

### Phase 14 — Security Recommendations Backlog
- [ ] Integrate security checks into existing endpoints (registration rate limiting + task validation utilities)
- [ ] Add CI/CD security test gates (fail build on security test regressions)
- [ ] Implement distributed rate limiting (Redis-based)
- [ ] Add API key management + rotation strategy
- [ ] Add 2FA/MFA support for accounts
- [ ] Add comprehensive security audit logging
- [ ] Tune security headers per endpoint profile
- [ ] Add OWASP dependency scanning in CI
- [ ] Define and test security incident response procedure
- [ ] Run scheduled penetration testing and remediation loop
- [ ] Define long-term compliance/security program (e.g., SOC 2 readiness)
- [ ] Plan recurring security audits cadence

---

## Milestone Progress Summary

✅ **Completed** — Phases 0–10 (foundation, auth, API, DB, scheduling, timer, dashboard, security hardening, UX/API hardening, testing & quality, containerization)
🔄 **In Progress** — Phase 11 (documentation and deployment automation)
⏳ **Planned** — Production deployment and post-deploy smoke tests (automation + CI)
📋 **Backlog** — Phases 12–14 (optional post-delivery enhancements)
