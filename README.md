# HelpImTooLazy.com - Study Planner and Productivity Tracker

## 1. Project Information

- **Project Title:** HelpImTooLazy
- **Project Domain:** Study Planner & Productivity Tracker
- **Course:** Web Application Development and Security (COMP6703001)
- **Class:** L4BC

**Group Members:**
- **Michael Arianno Chandrarieta** / SID: 2802499711 / Github: MichaelFirstAC
- **Timothy Jonathan Imannuel** / SID: 2802521825 / Github: Timotimanuel12
- **Jason Franto Fong** / SID: 2802557781 / Github: Jasonnnnnnn1

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
* **Dedicated AI Chat Assistant:** Powered by Gemini SDK, providing an interactive chat room for study advice, schedule adjustments, and burnout detection.

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

![System Architecture Diagram](./docs/architecture.png)

### 5.1 Architecture Diagram

```mermaid
graph TD
    subgraph Client_Side ["Frontend (User's Browser)"]
        UI[Next.js React UI]
        Timer[Study Timer Component]
        Calendar[Calendar Component]
    end

    subgraph Server_Side ["Backend (Next.js API Routes)"]
        Auth[Auth Middleware (JWT)]
        TaskAPI[Task Management API]
        AnalyticsAPI[Analytics Engine]
        AI_Service[AI Prioritization Service]
    end

    subgraph External_Services ["Infrastructure & External"]
        DB[(PostgreSQL Database)]
        Gemini[Gemini AI API]
    end

    %% Data Flow Connections
    UI -->|HTTPS Requests| Auth
    Auth -->|Validated Request| TaskAPI
    Auth -->|Validated Request| AnalyticsAPI

    TaskAPI -->|CRUD Operations| DB
    AnalyticsAPI -->|Query Logs| DB

    TaskAPI -->|Send Task Prompt| AI_Service
    AI_Service -->|Request Priority| Gemini
    Gemini -->|Return JSON/Markdown| AI_Service

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

| Method     | Endpoint             | Description                                                | Auth Required |
| :--------- | :------------------- | :--------------------------------------------------------- | :------------ |
| **POST**   | `/api/auth/register` | Registers a new user account.                              | No            |
| **GET**    | `/api/auth/session`  | Validates Firebase ID token and returns user session info. | Yes           |
| **GET**    | `/api/tasks`         | Retrieves all tasks for the logged-in user.                | Yes           |
| **POST**   | `/api/tasks`         | Creates a new task.                                        | Yes           |
| **GET**    | `/api/tasks/[id]`    | Retrieves a specific task by ID.                           | Yes           |
| **PUT**    | `/api/tasks/[id]`    | Updates task fields.                                       | Yes           |
| **DELETE** | `/api/tasks/[id]`    | Deletes a specific task.                                   | Yes           |
| **GET**    | `/api/sessions`      | Retrieves focus session logs for the logged-in user.       | Yes           |
| **POST**   | `/api/sessions`      | Logs a completed study session (timer data).               | Yes           |
| **GET**    | `/api/analytics`     | Retrieves productivity stats (e.g., total study hours).    | Yes           |



---
