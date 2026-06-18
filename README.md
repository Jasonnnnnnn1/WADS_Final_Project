# HelpImTooLazy.com - Study Planner and Productivity Tracker

## 1. Project Information

- **Project Title:** HelpImTooLazy
- **Project Domain:** Study Planner & Productivity Tracker
- **Course:** Web Application Development and Security (COMP6703001)
- **Class:** L4BC

**Group Members:**
- **Michael Arianno Chandrarieta** / SID: 2802499711 / Role: Backend, AI-Designer, Security Handler / Github: MichaelFirstAC
- **Timothy Jonathan Imannuel** / SID: 2802521825 / Role: Frontend Lead, Debugger / Github: Timotimanuel12
- **Jason Franto Fong** / SID: 2802557781 / Role: Database, Deployment, UI-Tester, Documenter / Github: Jasonnnnnnn1

## 2. Instructor & Repository Access

This repository has been shared with: 

- **Instructor:** Ida Bagus Kerthyayana Manuaba (GitHub: `bagzcode`)
- **Instructor Assistant:** Juwono (GitHub: `Juwono136`)

---

## 3. Project Overview

### 3.1 Problem Statement

Students struggle to manage their study time effectively due to the lack of planning, organization, and difficulty in tracking deadlines, tasks, and progress. Most students use tools such as notebooks, calendars, or messaging apps, which are usually too inefficient. This can cause students to miss deadlines and lead to last minute studying leading to overall lower academic performance. The study planner will help by providing a way to plan study tasks, manage schedules, and monitor deadlines in a single platform.

Our target users are students whether it be in school or university who are in need to manage several courses or schedules at the same time. The system is designed in a way where it can support students with different study habits and schedules. It can also benefit self learners who want a simple and effective way to plan their study routines and improve overall productivity.

### 3.2 Solution Overview

We are developing a full-stack "Smart Study Planner" that automates the scheduling process.

**Main Features:**

* **Smart Scheduling:** Auto-allocates tasks into free calendar slots based on priority and deadlines.
* **Focus Timer:** A built-in Pomodoro-style timer to track actual study duration, integrated with ambient sounds and YouTube Music.
* **Progress Dashboard:** Visual analytics of study habits, priority breakdowns, and task completion rates.

**AI Integration:**

* **AI Scheduler/Prioritization:** Uses an algorithm to generate optimal daily schedules, preventing overlaps and overloading.
* **Dedicated AI Chat Assistant:** Powered by Groq SDK, providing an interactive chat room for study advice, schedule adjustments, and burnout detection.

---

## 4. Technology Stack

| Layer                | Technology            | Description                                                                       |
| -------------------- | --------------------- | --------------------------------------------------------------------------------- |
| **Frontend**         | **Next.js**           | React framework (App Router) for responsive UI and client-side rendering.         |
| **Backend**          | **Node.js (Express)** | Separate service handling business logic, AI processing, and API routes.          |
| **API**              | **RESTful API**       | Standard HTTP methods (GET, POST, PUT, DELETE) with JSON responses.               |
| **Database**         | **PostgreSQL**        | Relational database managed via **Prisma ORM** for structured task/schedule data. |
| **Auth**             | **Firebase Auth**     | Handles user identity (Google Sign-In) and token generation.                      |
| **Containerization** | **Docker**            | Dockerfiles for both Frontend and Backend; Docker Compose for orchestration.      |
| **Deployment**       | **Hosting platform**  | Dedicated Server                                                                  |
| **Version Control**  | **GitHub**            | Repository with main and feature branches.                                        |

---

## 5. System Architecture

### 5.1 Architecture Diagram

```mermaid
graph TD
    subgraph Client_Side ["Frontend (User's Browser)"]
        UI[Next.js React UI]
        Timer[Study Timer Component]
        Calendar[Calendar Component]
    end

    subgraph Server_Side ["Backend (Next.js API Routes)"]
        Auth[Auth Middleware JWT]
        TaskAPI[Task Management API]
        AnalyticsAPI[Analytics Engine]
        AI_Service[AI Prioritization Service]
    end

    subgraph External_Services ["Infrastructure & External"]
        DB[(PostgreSQL Database)]
        Groq[Groq AI API]
    end

    %% Data Flow Connections
    UI -->|HTTPS Requests| Auth
    Auth -->|Validated Request| TaskAPI
    Auth -->|Validated Request| AnalyticsAPI

    TaskAPI -->|CRUD Operations| DB
    AnalyticsAPI -->|Query Logs| DB

    TaskAPI -->|Send Task Prompt| AI_Service
    AI_Service -->|Request Priority| Groq
    Groq -->|Return JSON/Markdown| AI_Service

    Timer -->|Sync Session Data| AnalyticsAPI

```

### 5.2 Architecture Explanation

The system is built on a **Client-Server Architecture** utilizing the Next.js framework to handle both the frontend interface and the backend API logic. The system follows a strict **Separation of Concerns** principle, ensuring that business logic, data access, and presentation layers are decoupled.

**Frontend (Presentation Layer):**
  - Built with **Next.js (App Router)** and **React** to ensure a responsive and interactive user interface.
  - Utilizes **Server-Side Rendering (SSR)** for the initial dashboard load to ensure performance and SEO, while using Client-Side Rendering (CSR) for interactive elements like the drag-and-drop calendar and study timer.
  - **Constraint:** The frontend never accesses the database directly; it strictly communicates via the REST API.

**Backend & API (Application Layer):**
  - Implemented using **Node.js** within **Next.js API Routes**.
  - Acts as the secure gateway and orchestrator of the system. It processes incoming HTTP requests, enforces business rules (e.g., checking for conflicting study sessions), and manages authentication sessions.
  - **AI Service:** The backend acts as a secure proxy to the AI provider (OpenAI). It receives raw user input, constructs the prompt, sends it to the LLM, and sanitizes the JSON response before returning it to the client. This ensures API keys are never exposed to the browser.

**Database Interaction (Data Layer):**
  - **PostgreSQL** is used as the primary relational database.
  - **Prisma ORM** is used for all database interactions. It provides type safety and prevents SQL injection by abstracting raw queries. We define a strict schema (`schema.prisma`) which enforces data integrity for Users, Tasks, and Study Sessions.

- **Security Enforcement:**
  - **Authentication:** Security is enforced using **JWT (JSON Web Tokens)** stored in HTTP-Only cookies to prevent XSS attacks.
  - **Authorization:** Middleware runs before every protected API route to verify the token signature. Row-Level Security logic is applied at the application layer; every database query includes a `where: { userId: currentUserId }` clause to ensure users can strictly access only their own data.
  - **Input Validation:** All incoming API payloads are validated using **Zod** schemas to reject malformed data before it reaches the database.

### 6. API Design

#### 6.1 API Endpoints

#### Endpoints for Authentication

| Endpoint | Method | Description | Auth Required |
| --- | --- | --- | --- |
| `/api/auth/register` | POST | Registers a new user account. | No |
| `/api/auth/session` | GET | Validates Firebase ID token and returns session info. | Yes |

#### Endpoints for Task CRUD

| Endpoint | Method | Description | Auth Required |
| --- | --- | --- | --- |
| `/api/tasks` | GET | Retrieves paginated tasks for the logged-in user. | Yes |
| `/api/tasks` | POST | Creates a new task. | Yes |
| `/api/tasks/[id]` | PUT | Updates task fields (e.g., status toggles). | Yes |
| `/api/tasks/[id]` | DELETE | Deletes a specific task. | Yes |

#### Endpoints for Sessions & Analytics

| Endpoint | Method | Description | Auth Required |
| --- | --- | --- | --- |
| `/api/sessions` | POST | Logs a completed study session (timer data). | Yes |
| `/api/analytics` | GET | Retrieves productivity stats (e.g., total study hours). | Yes |

#### Endpoints for AI Features

| Endpoint | Method | Description | Auth Required |
| --- | --- | --- | --- |
| `/api/ai/prioritize` | POST | **AI Feature:** Analyzes task details to suggest priority. | Yes |
| `/api/ai/chat` | POST | **AI Feature:** Handles messages for the AI study assistant. | Yes |

* **Swagger UI Link:** Available locally at `http://localhost:3000/api-docs` when the server is running.
* **Example Request & Response (JSON):**

**POST `/api/tasks` Request:**

```json
{
  "title": "Complete WADS Final Project",
  "description": "Finish the README and presentation video.",
  "dueDate": "2026-06-20T23:59:00Z",
  "priority": "HIGH"
}

```

**Response (201 Created):**

```json
{
  "success": true,
  "data": {
    "id": "clx123abc0000def",
    "userId": "user_firebase_uid",
    "title": "Complete WADS Final Project",
    "status": "PENDING",
    "createdAt": "2026-06-14T11:00:00Z"
  }
}

```

## 7. Database Design

### 7.1 Database Choice

We chose **PostgreSQL** (managed via **Prisma ORM**).

* **Relational Structure:** Study planners require strict relationships (e.g., One User has Many Tasks; One Task has Many Study Sessions). SQL handles these foreign key relationships robustly.
* **Data Integrity & Security:** Prisma provides type safety and helps prevent SQL injection. It also allows us to easily enforce application-level row security constraints.
* **Performance:** PostgreSQL supports composite indexes (e.g., `userId + updatedAt`) which are critical for fast paginated queries on the dashboard. Firebase is used *only* for the Authentication layer to securely issue tokens.

### 7.2 Schema / Data Structure

* **User:** `id` (PK, matches Firebase UID), `email`, `name`, `themePreference`, `createdAt`
* **Task:** `id` (PK), `userId` (FK), `title`, `description`, `dueDate`, `priority`, `status`, `courseTag`
* **FocusSession:** `id` (PK), `userId` (FK), `taskId` (FK), `startTime`, `endTime`, `durationMinutes`
* **AIChat:** `id` (PK), `userId` (FK), `messageHistory` (JSON), `createdAt`

## 8. AI Features

### 8.1 AI Feature List

| AI Feature Purpose | AI Type |
| --- | --- |
| **Smart Task Prioritization & Scheduling:** Analyzes a user's pending tasks and constraints to automatically generate an optimized daily study schedule, identifying burnout risks. | Recommendation / Adaptive Logic |
| **Interactive Study Assistant:** A dedicated chat room powered by Groq that acts as an academic coach, capable of breaking down complex assignments into sub-tasks via natural language processing. | NLP / Conversational |

### 8.2 AI Integration Flow

1. **Input:** The user requests a schedule optimization or sends a chat message. The frontend securely sends this along with the JWT to the backend.
2. **AI Processing:** The Node.js backend retrieves the user's pending tasks and recent study history from PostgreSQL. It constructs a secure prompt containing this context and sends it to the Geroq SDK (via `GROQ_API_KEY` stored securely in server environment variables).
3. **Output:** The LLM returns a structured JSON payload (for scheduling) or Markdown text (for chat).
4. **Usage:** The backend sanitizes the output, logs the interaction, and sends it to the frontend. The frontend parses the JSON to render the calendar events or renders the Markdown in the chat UI.

---

## 9. Security Implementation

* **Authentication:** Handled via Firebase Auth. We utilize **JWT (JSON Web Tokens)** stored in HTTP-Only cookies to prevent XSS attacks.
* **Authorization:** A custom authentication middleware wraps every protected Next.js API route. It verifies the JWT signature. Furthermore, Row-Level Security logic is hardcoded into Prisma queries (e.g., `where: { userId: currentUserId }`) to guarantee users cannot access or modify others' data.
* **Input Validation:** All incoming request payloads are strictly validated against **Zod schemas**. Malformed requests are rejected with a standardized 400 error before ever reaching the database.
* **Protection against Attacks:**
* **SQL Injection:** Mitigated entirely by using Prisma ORM, which uses parameterized queries.
* **XSS:** Input sanitization middleware is applied. React automatically escapes variables in the frontend DOM.
* **CSRF:** Next.js App Router API routes inherently handle CORS. Auth tokens are validated strictly per request.


* **Secure API Key Handling:** Third-party API keys (Groq, Firebase Admin) are stored exclusively in backend `.env` variables and are never exposed to the client-side bundle.

---

## 10. Testing Documentation

**Tests run via Jest — 133 tests passed across 16 suites ✅**

```bash
npx jest --no-coverage
```

### 10.1 Frontend Unit Testing — UI Components

#### Button Component
| # | Test Case | What It Tests | Status |
|---|---|---|---|
| 1 | should render button with text | Button displays its label correctly | ✅ PASS |
| 2 | should handle click events | onClick callback fires when clicked | ✅ PASS |
| 3 | should be disabled when disabled prop is true | Button is unclickable when disabled | ✅ PASS |
| 4 | should support different variants | outline, ghost, destructive variants render | ✅ PASS |
| 5 | should support different sizes | sm, lg, icon sizes render | ✅ PASS |

#### AuthGuard Component
| # | Test Case | What It Tests | Status |
|---|---|---|---|
| 6 | should show loading state initially | Spinner shown before auth resolves | ✅ PASS |
| 7 | should call onAuthStateChanged on mount | Firebase auth listener attached on mount | ✅ PASS |
| 8 | should handle auth state changes | Component responds when user logs in/out | ✅ PASS |

#### LoginForm Component
| # | Test Case | What It Tests | Status |
|---|---|---|---|
| 9 | renders the login form heading | "Sign in" heading is visible | ✅ PASS |
| 10 | contains email and password inputs | Both input fields render | ✅ PASS |
| 11 | renders the Sign In button | Submit button is present | ✅ PASS |
| 12 | switches to create account mode | Clicking register toggle switches the form | ✅ PASS |

#### Sidebar Component
| # | Test Case | What It Tests | Status |
|---|---|---|---|
| 13 | renders all navigation links | Dashboard, Tasks, Calendar, Focus Timer etc. all render | ✅ PASS |
| 14 | renders the app brand name | Brand/logo text is visible | ✅ PASS |
| 15 | renders the Log Out button | Logout button exists in sidebar | ✅ PASS |
| 16 | navigates to /dashboard when Dashboard is clicked | Link routing works correctly | ✅ PASS |
| 17 | navigates to /calendar when Calendar is clicked | Link routing works correctly | ✅ PASS |
| 18 | navigates to /settings when Settings is clicked | Link routing works correctly | ✅ PASS |
| 19 | navigates to /activities?new=1 when Add New Task is clicked | Link includes query param | ✅ PASS |
| 20 | calls firebase signOut when Log Out is clicked | Firebase signOut is triggered | ✅ PASS |
| 21 | redirects to /login after a successful logout | Router navigates to login page | ✅ PASS |
| 22 | shows "Signing Out..." and disables button while in progress | Loading state shown during async signOut | ✅ PASS |
| 23 | re-enables the Log Out button if signOut throws an error | Button recovers from error | ✅ PASS |
| 24 | calls setTheme with "dark" when the theme toggle is clicked | Theme toggle switches dark mode on | ✅ PASS |
| 25 | renders "Enable AI Auto-Plan" button when AI plan is disabled | AI toggle shows when feature is off | ✅ PASS |
| 26 | calls setAiPlanEnabled when the AI Auto-Plan toggle is clicked | AI plan toggle updates state | ✅ PASS |

#### MobileBottomNav Component
| # | Test Case | What It Tests | Status |
|---|---|---|---|
| 27 | renders all 7 navigation items | All 7 nav icons/labels are present | ✅ PASS |
| 28 | navigates to each route when item is clicked | Each nav button routes correctly | ✅ PASS |
| 29 | highlights Dashboard as active when pathname is /dashboard | Active state styling on current route | ✅ PASS |
| 30 | highlights Settings as active when pathname is /settings | Active state styling on current route | ✅ PASS |
| 31 | highlights Calendar as active when pathname is /calendar | Active state styling on current route | ✅ PASS |
| 32 | renders inside a semantic nav element | Accessible semantic HTML | ✅ PASS |
| 33 | renders exactly 7 navigation buttons | Correct count of buttons | ✅ PASS |

#### ProfileSetupForm Component
| # | Test Case | What It Tests | Status |
|---|---|---|---|
| 34 | shows a loading spinner before data arrives | Spinner shows during API fetch | ✅ PASS |
| 35 | renders the "Complete Your Profile" heading after loading | Page title renders | ✅ PASS |
| 36 | renders Username, First Name, Last Name fields | All required fields present | ✅ PASS |
| 37 | renders the "Continue to Dashboard" submit button | Submit button exists | ✅ PASS |
| 38 | redirects to /dashboard if profile is already completed | Completed users skip to dashboard | ✅ PASS |
| 39 | shows invalid username message for short usernames (< 3 chars) | Validation: minimum length enforced | ✅ PASS |
| 40 | shows invalid message for usernames with invalid characters | Validation: special chars blocked | ✅ PASS |
| 41 | shows error when submitting with an empty/invalid username | Validation fires on submit | ✅ PASS |
| 42 | pre-populates fields with existing profile data from API | API data fills the form | ✅ PASS |
| 43 | shows the username availability error inside the form body | Availability feedback displayed | ✅ PASS |
| 44 | redirects to /login if no authenticated user is found | Auth guard on setup form | ✅ PASS |

#### ProfileSettings Component
| # | Test Case | What It Tests | Status |
|---|---|---|---|
| 45 | renders all profile form fields after loading | All inputs visible | ✅ PASS |
| 46 | shows a loading state before profile data arrives | Skeleton/spinner during load | ✅ PASS |
| 47 | populates inputs with the fetched profile data | API data fills the form | ✅ PASS |
| 48 | renders the Save Changes button | Save button present | ✅ PASS |
| 49 | Save Changes button is disabled when form is unchanged | Button disabled when no edits made | ✅ PASS |
| 50 | becomes dirty when a field is edited | Editing a field marks form as changed | ✅ PASS |
| 51 | shows "No unsaved changes." when form is in initial state | Default clean state message shown | ✅ PASS |
| 52 | hides the "No unsaved changes" message once a field is edited | Message disappears when editing | ✅ PASS |
| 53 | shows an error message if profile loading fails | API error shown in UI | ✅ PASS |
| 54 | University Email field is disabled (read-only) | Email field cannot be edited | ✅ PASS |
| 55 | shows "Complete" badge when all required fields are filled | Profile completion badge logic | ✅ PASS |
| 56 | shows missing required fields when username is empty | Incomplete badge lists missing fields | ✅ PASS |
| 57 | renders the Change Photo and Remove buttons | Avatar action buttons present | ✅ PASS |

#### SecuritySettings Component
| # | Test Case | What It Tests | Status |
|---|---|---|---|
| 58 | renders the Security heading | Section title visible | ✅ PASS |
| 59 | renders the Change Password button | Submit button present | ✅ PASS |
| 60 | renders the Delete Account button | Danger zone button present | ✅ PASS |
| 61 | renders all three password input fields | Current, new, confirm fields render | ✅ PASS |
| 62 | shows error when current password is empty | Validation: empty field blocked | ✅ PASS |
| 63 | shows error when new password is shorter than 6 characters | Validation: min length enforced | ✅ PASS |
| 64 | shows error when passwords do not match | Validation: mismatch caught | ✅ PASS |
| 65 | shows success message after successful password change | Success feedback after API call | ✅ PASS |
| 66 | shows "Current password is incorrect" for wrong-password error | Firebase error mapped to UI message | ✅ PASS |
| 67 | shows error if Delete Account clicked without typing DELETE | Confirmation gate enforced | ✅ PASS |
| 68 | accepts lowercase "delete" (component uppercases before comparing) | Case-insensitive confirmation | ✅ PASS |
| 69 | shows error if user types wrong confirmation text | Wrong text blocked | ✅ PASS |
| 70 | calls accountApi.remove and signOut when DELETE is confirmed | Deletion flow calls correct APIs | ✅ PASS |
| 71 | shows error message if account deletion fails | API error shown in UI | ✅ PASS |
| 72 | toggles current password visibility when eye icon is clicked | Show/hide password toggle works | ✅ PASS |

#### SettingsPage — Sign Out
| # | Test Case | What It Tests | Status |
|---|---|---|---|
| 73 | renders the Sign Out button on the settings page | Button is accessible on mobile settings | ✅ PASS |
| 74 | Sign Out button is enabled on first render | Button starts in normal state | ✅ PASS |
| 75 | calls firebase signOut exactly once when clicked | signOut called once, not multiple times | ✅ PASS |
| 76 | redirects to /login after a successful sign out | Router pushes to login after logout | ✅ PASS |
| 77 | disables button and shows "Signing out..." while in progress | Loading state during async signOut | ✅ PASS |
| 78 | re-enables the button if firebase signOut throws an error | Error recovery, button not stuck | ✅ PASS |

#### NotificationsSettings Component
| # | Test Case | What It Tests | Status |
|---|---|---|---|
| 79 | renders the Notifications heading | Section title visible | ✅ PASS |
| 80 | renders the Save Preferences button | Save button present | ✅ PASS |
| 81 | shows a loading state before settings data arrives | Spinner shown on load | ✅ PASS |
| 82 | calls settingsApi.update when Save Preferences is clicked | API called on save | ✅ PASS |
| 83 | shows success message after a successful save | Feedback after save | ✅ PASS |
| 84 | shows "Saving..." state while the API call is in progress | Loading state during save | ✅ PASS |
| 85 | shows error message if save fails | API error shown in UI | ✅ PASS |
| 86 | shows error message if loading settings fails | Load error shown in UI | ✅ PASS |
| 87 | renders a theme selector dropdown | Theme select rendered | ✅ PASS |
| 88 | applies the loaded theme on mount | Theme applied from API data | ✅ PASS |

#### AISettingsPanel Component
| # | Test Case | What It Tests | Status |
|---|---|---|---|
| 89 | renders the AI Preferences heading | Section title visible | ✅ PASS |
| 90 | renders Save AI Preferences and Reset buttons | Both action buttons present | ✅ PASS |
| 91 | renders the Focus block and Break minute inputs | Number inputs for timer defaults | ✅ PASS |
| 92 | renders the Allow weekend scheduling toggle | Toggle switch present | ✅ PASS |
| 93 | shows the "Local only" badge when settings come from localStorage | Badge shown for local-only data | ✅ PASS |
| 94 | hides the "Local only" badge when settings loaded from API | Badge hidden for synced data | ✅ PASS |
| 95 | calls settingsApi.update when Save AI Preferences is clicked | API called on save | ✅ PASS |
| 96 | shows "AI preferences saved." after a successful save | Success feedback message | ✅ PASS |
| 97 | shows "AI preferences reset to defaults." after Reset | Reset feedback message | ✅ PASS |
| 98 | updates the focus block minutes input when changed | Input value updates on change | ✅ PASS |

---

### 10.2 Frontend Unit Testing — Library & Utilities

#### Utility Functions (`utils.test.ts`)
| # | Test Case | What It Tests | Status |
|---|---|---|---|
| 99 | should merge class names correctly | cn() combines multiple classes | ✅ PASS |
| 100 | should handle conditional classes | Falsy classes are ignored | ✅ PASS |
| 101 | should remove falsy values | false, null, undefined removed | ✅ PASS |
| 102 | should merge tailwind classes with priority | Conflicting Tailwind classes resolved | ✅ PASS |
| 103 | should handle arrays of classes | Array input works correctly | ✅ PASS |
| 104 | should handle empty input | Empty call returns empty string | ✅ PASS |

#### Security & Input Sanitization (`security.test.ts`)
| # | Test Case | What It Tests | Status |
|---|---|---|---|
| 105 | should accept valid HTTP/HTTPS URLs | Valid URLs allowed through | ✅ PASS |
| 106 | should reject non-HTTP protocols | ftp://, javascript: blocked | ✅ PASS |
| 107 | should reject invalid URLs | Malformed URLs blocked | ✅ PASS |
| 108 | should allow empty URLs | Empty string is valid | ✅ PASS |
| 109 | should accept whitelisted MIME types | image/png, image/jpeg allowed | ✅ PASS |
| 110 | should reject non-whitelisted MIME types | application/exe blocked | ✅ PASS |
| 111 | should reject non-string MIME types | Non-string input blocked | ✅ PASS |
| 112 | should remove script tags | `<script>` stripped from input | ✅ PASS |
| 113 | should remove event handlers | onclick=, onload= stripped | ✅ PASS |
| 114 | should remove style tags | `<style>` stripped from input | ✅ PASS |
| 115 | should preserve safe HTML | `<b>`, `<i>` kept intact | ✅ PASS |
| 116 | should remove control characters | Non-printable chars stripped | ✅ PASS |
| 117 | should trim whitespace | Leading/trailing spaces removed | ✅ PASS |
| 118 | should remove directory traversal attempts | ../ patterns blocked | ✅ PASS |
| 119 | should remove null bytes | \0 characters stripped | ✅ PASS |
| 120 | should remove leading slashes | /filename → filename | ✅ PASS |
| 121 | should remove directory separators | \ and / removed from filenames | ✅ PASS |
| 122 | should limit filename length | Max filename length enforced | ✅ PASS |
| 123 | should keep valid characters | Normal filenames unchanged | ✅ PASS |
| 124 | should handle edge cases | Empty string, special-only strings | ✅ PASS |
| 125 | should normalize email addresses | Lowercased and trimmed | ✅ PASS |
| 126 | should remove spaces from email | Spaces stripped from email | ✅ PASS |
| 127 | should escape HTML special characters | <, >, & escaped | ✅ PASS |
| 128 | should handle quotes | " and ' escaped | ✅ PASS |
| 129 | should prevent XSS through email field | XSS payloads in email neutralised | ✅ PASS |
| 130 | should prevent SQL injection patterns in strings | SQL keywords flagged and blocked | ✅ PASS |
| 131 | should enforce enum validation strictly | Only allowed enum values pass | ✅ PASS |
| 132 | should reject extremely long inputs | Max length limits enforced | ✅ PASS |
| 133 | should reject large data URLs | Base64 data URL size limited | ✅ PASS |

---

### 10.3 Backend & API Testing

| Test Case | Endpoint | Input | Expected Output | Status |
| --- | --- | --- | --- | --- |
| S01 | `/api/auth/register` | Valid new email + password >= 6 | 201 | Pass / Fail |
| S02 | `/api/auth/register` | Missing/invalid body (e.g., no email) | 400 | Pass / Fail |
| S03 | `/api/auth/register` | Email already exists | 409 | Pass / Fail |
| S04 | `/api/auth/register` | Firebase Admin failure (misconfigured credentials) | 500 | Pass / Fail |
| S05 | `/api/auth/session` | Valid bearer token | 200 | Pass / Fail |
| S06 | `/api/auth/session` | Missing/invalid bearer token | 401 | Pass / Fail |
| S07 | `/api/tasks` | Valid token | 200 | Pass / Fail |
| S08 | `/api/tasks` | Missing/invalid bearer token | 401 | Pass / Fail |
| S09 | `/api/tasks` | Valid payload (title, startTime, endTime) | 201 | Pass / Fail |
| S10 | `/api/tasks` | Invalid payload (e.g., endTime before startTime) | 400 | Pass / Fail |
| S11 | `/api/tasks` | Missing/invalid bearer token | 401 | Pass / Fail |
| S12 | `/api/tasks/{id}` | User A gets own task | 200 | Pass / Fail |
| S13 | `/api/tasks/{id}` | Missing/invalid bearer token | 401 | Pass / Fail |
| S14 | `/api/tasks/{id}` | User B tries to read User A task | 403 | Pass / Fail |
| S15 | `/api/tasks/{id}` | Non-existent id | 404 | Pass / Fail |
| S16 | `/api/tasks/{id}` | User A updates own task | 200 | Pass / Fail |
| S17 | `/api/tasks/{id}` | Invalid payload (e.g., bad date / end before start) | 400 | Pass / Fail |
| S18 | `/api/tasks/{id}` | Missing/invalid bearer token | 401 | Pass / Fail |
| S19 | `/api/tasks/{id}` | User B tries to update User A task | 403 | Pass / Fail |
| S20 | `/api/tasks/{id}` | Non-existent id | 404 | Pass / Fail |
| S21 | `/api/tasks/{id}` | User A deletes own task | 200 | Pass / Fail |
| S22 | `/api/tasks/{id}` | Missing/invalid bearer token | 401 | Pass / Fail |
| S23 | `/api/tasks/{id}` | User B tries to delete User A task | 403 | Pass / Fail |
| S24 | `/api/tasks/{id}` | Non-existent id | 404 | Pass / Fail |
| S25 | `/api/sessions` | Valid token | 200 | Pass / Fail |
| S26 | `/api/sessions` | Missing/invalid bearer token | 401 | Pass / Fail |
| S27 | `/api/sessions` | Valid payload | 201 | Pass / Fail |
| S28 | `/api/sessions` | Invalid payload (e.g., durationMinutes <= 0) | 400 | Pass / Fail |
| S29 | `/api/sessions` | Missing/invalid bearer token | 401 | Pass / Fail |
| S30 | `/api/analytics` | Valid token | 200 | Pass / Fail |
| S31 | `/api/analytics` | Missing/invalid bearer token | 401 | Pass / Fail |

### 10.4 Security Testing

| Test Case | Attack Type | Expected Behavior | Result |
| --- | --- | --- | --- |
| SEC-01 | XSS | Payload `<script>alert(1)</script>` in Task title | Sanitized by Zod/Middleware |
| SEC-02 | IDOR / Auth Bypass | Requesting `/api/tasks/USER_B_ID` while logged in as User A | Blocked by Prisma `userId` check (403/404) |

### 10.5 AI Functionality Testing

**AI Feature:** Smart Task Prioritization / Chat Assistant

| Test Case | Input | Expected Output | Actual Result | Status |
| --- | --- | --- | --- | --- |
| AI-01 | Valid input (List of 3 tasks) | Correct JSON array with assigned priorities | As Expected | Pass |
| AI-02 | Invalid input (Empty task list) | Graceful error / Fallback to default schedule | Handled | Pass |
| AI-03 | Prompt injection ("Ignore previous instructions") | Sanitized / Ignored by system wrapper prompt | Ignored | Pass |

**Failure Handling:**

* **AI Unavailable:** If the Groq SDK fails or returns a 500 error, the system catches the exception and returns a standardized error envelope. The frontend gracefully falls back to deterministic/manual scheduling.
* **Timeout:** Handled via `AbortController` in the fetch requests, triggering a timeout error message in the UI after 15 seconds.

---

## 11. Deployment & Production Setup

### 11.1 Docker Setup

* `Dockerfile` is included for containerizing the application.
* `docker-compose.yml` is configured to spin up the application and PostgreSQL database locally on `http://localhost:3000`.

### 11.2 Production Environment

* **Environment Variables:** Managed via `.env` (template provided in `.env.example`).
* **Secrets Handling:** Production secrets (Database URL, API Keys) are injected securely via the hosting platform's dashboard (e.g., Vercel Environment Variables). They are never hardcoded.
* **HTTPS:** Enforced automatically by Vercel for all frontend and API traffic.

### 11.3 Live Application URL

[https://helpimtoolazy.com](http://e2526-wads-b4bc.csbihub.id)

## 12. GitHub Contribution Summary (INDIVIDUAL)

**Student Name:** Michael Arianno Chandrarieta
* **Features implemented:** Designed and implemented the Node.js/Next.js backend architecture. Engineered the core AI assistant and smart scheduling logic using the Groq SDK.
* **API endpoints handled:** Managed AI-related endpoints (`/api/ai/prioritize`, `/api/ai/chat`) and core API routing middleware.
* **Tests written:** Authored backend integration tests and security/validation test suites.
* **Security work:** Implemented JWT authentication middleware, Zod input validation, XSS sanitization, and route protection.
* **AI-related work:** Designed system prompts, context retrieval logic, and fallback mechanisms for the Groq AI integration.

**Student Name:** Timothy Jonathan Imannuel
* **Features implemented:** Led the development of the Next.js React frontend, including the Dashboard, Drag-and-drop Calendar, and AI Chat UI. Handled complex cross-component state management and bug fixes.
* **API endpoints handled:** Integrated frontend fetch logic to securely communicate with all backend REST endpoints.
* **Tests written:** Authored unit tests for frontend UI components (e.g., ActivityCard, AddTaskModal) and handled end-to-end UI debugging.
* **Security work:** Ensured secure client-side routing, protected route redirection based on auth state, and handled client-side form validation.
* **AI-related work:** Built the interactive chat interface and implemented markdown rendering for the AI Assistant's outputs.

**Student Name:** Jason Franto Fong
* **Features implemented:** Designed the PostgreSQL database schema using Prisma ORM. Containerized the application using Docker and handled the live production deployment.
* **API endpoints handled:** Developed CRUD operations for Tasks and Sessions linked directly to the database layer, as well as the `/api/analytics` endpoint.
* **Tests written:** Executed comprehensive UI testing and end-to-end smoke tests post-deployment.
* **Security work:** Applied Row-Level Security (RLS) concepts in Prisma queries to ensure data isolation (users can only query their own data).
* **AI-related work:** Documented the AI integration flow, generated architectural diagrams, and maintained the OpenAPI/Swagger documentation (`/api-docs`).


---

## 13. AI Usage Disclosure

**AI tools used:** Groq API (Groq), Gemini (Google), Claude (Anthropic), Github Copilot.

* **Groq:** Used as a core system feature for the AI Assistant chat, task prioritization, burnout detection, and AI analytics.
* **Gemini:** Used during development to assist with brainstorming database schema optimizations, generating boilerplate unit test scenarios, and debugging Docker Compose port conflicts.
* **Claude:** Used during documentation to assist with weekly progress report deliverables.
* **Copilot:** Used during development to assist with the AI's design, algorithm, restrictions, and testing scenarios. 

All generated code was thoroughly reviewed, modified, and integrated manually by the team to ensure understanding and security compliance.

---

## 14. Known Limitations & Future Improvements

* **Current limitations:** * The calendar view does not yet sync directly with external Google/Outlook calendars.
* AI scheduling relies on prompt processing time, which can occasionally take up to 5-8 seconds depending on LLM load.


* **Possible future enhancements:** * Add a "Today Snapshot" panel and Quick Actions panel for immediate triage.
* Implement distributed rate limiting (Redis-based) and add 2FA/MFA support for accounts.


* **AI limitations and risks:** The AI may occasionally hallucinate incorrect task durations or fail to perfectly pack tasks if the schedule is mathematically impossible. The system relies on human-in-the-loop validation (the user can edit the generated schedule).

---

## 15. Final Declaration

We declare that:

* This project is our own work.
* AI usage is disclosed honestly.
* All group members understand the system.

**Signed by Group Members:**

* Michael Arianno Chandrarieta
* Timothy Jonathan Imannuel
* Jason Franto Fong

---

## 16. SETUP

1. **Clone & Install:**
```bash
git clone [repo_url]
cd helpimtoolazy
npm install

```


2. **Environment Setup:** Copy `.env.example` to `.env` and fill in your Firebase, Database, and Groq keys.
3. **Database Initialized:**
```bash
npx prisma generate
npx prisma migrate dev
npx prisma db seed

```


4. **Run via Docker (Recommended):**
```bash
docker-compose up --build

```


Access the app at `http://localhost:3000`.

## 17. DEPLOYMENT INSTRUCTIONS

Our application is deployed on a private Ubuntu server which was provided by our university using a fully automated CI/CD pipeline. The deployment relies on Docker for containerization and GitHub Actions for continuous integration.

### 17.1 Infrastructure & Environment Setup
* **Server Access:** The project is hosted via a CSBI infrastructure. We authenticated using our university credentials and accessed our private Ubuntu server environment through the web-based SSH terminal provided at csbiweb-ssh.csbihub.id.
* **Environment Variables:** All sensitive keys (Firebase credentials, Groq API Key, Database URL) are securely stored as a single GitHub Secret (`ENV_FILE`) in our repository settings to prevent exposing them in version control.
* **Firebase Authorization:** Because the app is deployed to a live domain, the domain (`e2526-wads-b4bc.csbihub.id`) was added to the **Authorized Domains** list inside the Firebase Authentication console to allow Google Sign-In outside of `localhost`.

### 17.2 CI/CD Pipeline (GitHub Actions)
* **Self-Hosted Runner:** We installed and configured a self-hosted GitHub Actions runner directly on the Ubuntu server. 
* **Service Execution:** The runner is kept alive in the background using `./run.sh` to continuously listen for new commits.
* **Pipeline Workflow (`cicd.yml`):**
   - Triggers automatically upon pushing to the `master` branch.
   - Securely injects the `.env` file from GitHub Secrets.
   - Executes deployment commands via the self-hosted runner.

### 17.3 Docker & Port Configuration
* **Production Compose File:** We use a specific `docker-compose.prod.yml` to control the frontend/backend services.
* **Port Mapping:** The application is explicitly mapped to run on port `3022` (`"3022:3000"`) inside the Docker configuration to match the port specifically assigned to our project by the lecturer.
* **Nginx Reverse Proxy:** The university's Nginx configuration forwards external traffic from our provided domain directly to our application's local port (`3022`).

### 17.4 Automated Deployment Steps
Whenever new code is pushed to `master`, the GitHub Action automatically performs the following on the Ubuntu server:
* `git pull` to fetch the latest codebase.
* Generates the `.env` file from GitHub Secrets.
* `docker-compose -f docker-compose.prod.yml down` to gracefully stop the old containers.
* `docker-compose -f docker-compose.prod.yml up -d --build` to rebuild the images and spin up the new containers in detached mode.

