# AetherMind AI

> An AI-powered, full-stack task management platform that turns your task backlog into an actionable daily plan.

AetherMind AI is a production-grade monorepo application built with **React 19**, **Express**, **TypeScript**, **MongoDB**, and **Turborepo**. It combines classic task management (tasks, calendar, dashboards) with an autonomous AI cognitive layer that prioritizes work, plans your day, breaks down complex tasks, and reviews your week — powered exclusively by **Google Gemini 3.5 Flash**.

---

## Screenshots

| | |
|---|---|
| **Login** | **Dashboard** |
| ![Login](docs/screenshots/01-login.png) | ![Dashboard](docs/screenshots/02-dashboard.png) |
| **Tasks (Kanban)** | **Calendar** |
| ![Tasks](docs/screenshots/03-tasks.png) | ![Calendar](docs/screenshots/04-calendar.png) |
| **Plan My Day (AI)** | **AI Assistant** |
| ![Plan My Day](docs/screenshots/05-plan-my-day.png) | ![Assistant](docs/screenshots/06-assistant.png) |

---

## Features

### Task Management
- Full task CRUD with statuses (TODO, IN_PROGRESS, COMPLETED), priorities (LOW → URGENT), tags, estimated time, start/due dates
- Kanban-style board with drag-and-drop reordering (`@dnd-kit`)
- Calendar workspace with drag-and-drop scheduling and multiple views
- Powerful filtering, sorting, and pagination via a reusable `MongooseQueryBuilder`

### AI Cognitive Layer
- **Plan My Day** — generates an optimal daily schedule, productivity score, top priorities, and recommendations
- **Task Breakdown** — splits complex tasks into dependency-ordered subtasks with time estimates
- **Task Prioritization** — intelligently re-ranks task backlogs using urgency, deadlines, and effort
- **Smart Reschedule** — detects overdue tasks and calculates optimal future dates to balance workload
- **Weekly Review** — aggregates weekly completion statistics, highlights achievements, and surfaces insights
- **Productivity Insights** — analyzes productivity patterns, streaks, and focus strengths
- **AI Engine** — powered by **Google Gemini 3.5 Flash** (`@google/genai`) with configurable thinking budgets
- Strict **Zod schema validation** on LLM output with deterministic single-pass retry on `INVALID_JSON`
- In-memory **AI Response Caching** with configurable TTLs to accelerate repeat requests

### AI Assistant
- Conversational chat grounded strictly in authenticated user tasks, schedules, and metrics
- Conversation history stored in MongoDB
- Follow-up suggestion chips, typing indicator, and voice input

### Notifications & Reminders
- Full-stack notification center with unread badge, filters, and slide-out drawer
- Automated reminder engine (overdue, due today/tomorrow, weekly review, productivity milestones)
- Browser notifications (Web Notification API) and toast notifications
- React Query polling + optimistic updates

### Platform
- JWT access tokens + HttpOnly refresh cookie rotation with reuse detection
- Role-based access control (`USER`, `ADMIN`)
- Dashboard with charts (Recharts), insights, and quick actions
- Dark mode theming, command palette (⌘K), keyboard shortcuts
- Voice module with offline settings
- Docker Compose for MongoDB

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, TypeScript, Vite 8, React Router 7, TanStack Query 5, Tailwind CSS 4, Radix UI, Framer Motion, Recharts, Zod |
| **Backend** | Node.js, Express 5, TypeScript, Mongoose 9, Zod, JWT, Helmet, CORS, compression |
| **AI** | Google Gemini SDK (`@google/genai`) — Gemini 3.5 Flash |
| **Data** | MongoDB 8 (local or Docker) |
| **Monorepo** | Turborepo 2, pnpm 9 workspaces |

---

## Monorepo Structure

```text
aethermind-ai/
├── apps/
│   ├── web/                      # React + Vite frontend
│   │   └── src/
│   │       ├── app/              # Router, layout, providers
│   │       ├── pages/            # Dashboard, Tasks, Calendar, Assistant, Settings
│   │       ├── features/         # auth, tasks, calendar, dashboard, ai, assistant,
│   │       │                     # notifications, command-palette, voice, theme
│   │       └── shared/           # Components, hooks, utils, lib
│   └── api/                      # Express backend
│       └── src/
│           ├── modules/          # auth, tasks, calendar, dashboard, ai, assistant,
│           │                     # notifications, activity, voice
│           ├── middlewares/      # auth, error handling, rate limiting
│           ├── database/         # MongoDB connection
│           └── shared/           # events, query builder, utils
├── docs/
│   ├── screenshots/              # Project screenshots
│   ├── AI_PROVIDERS.md           # AI provider and Gemini integration architecture
│   └── AUTH_SESSION.md
├── Ai-Architecture.md            # Deep dive into the AI module pipeline
├── docker-compose.yml            # MongoDB service
├── package.json                  # Turborepo root
└── turbo.json
```

### Request Flow

```text
React Web App
  │  POST /api/v1/ai/plan-day (Bearer JWT)
  ▼
Express API Gateway ── requireAuth ──> AiController
  ▼
AiService ──> AIPipeline
  ├── ContextBuilder  (tasks, temporal state, user profile, settings)
  ├── AICacheService  (in-memory TTL cache check)
  ├── PromptBuilder   (versioned system/user prompts)
  ├── GeminiProvider  (@google/genai SDK — Gemini 3.5 Flash)
  └── ResponseParser  (double-pass Zod validation & auto-retry)
```

---

## Quick Start

### Prerequisites

- Node.js 18+ (LTS recommended)
- pnpm 9 (`npm install --global pnpm@9`)
- MongoDB (local install **or** Docker)
- Google Gemini API Key ([Google AI Studio](https://aistudio.google.com/))

### 1. Clone and install

```bash
git clone <YOUR_REPOSITORY_URL>
cd aethermind-ai
pnpm install
```

### 2. Start MongoDB

**Option A — Docker** (recommended):

```bash
docker compose up -d
```

**Option B — Local MongoDB**: install MongoDB Community Server and verify with `mongosh --eval "db.runCommand({ ping: 1 })"` (expect `{ ok: 1 }`).

### 3. Configure the API

Create `apps/api/.env`:

```env
PORT=4000
WEB_ORIGIN=http://localhost:5173
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/aethermind
JWT_ACCESS_SECRET=aethermind-development-access-secret-change-me
JWT_REFRESH_SECRET=aethermind-development-refresh-secret-change-me
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Google Gemini AI Configuration
AI_PROVIDER=gemini
GEMINI_API_KEY=your-gemini-api-key-here
GEMINI_MODEL=gemini-3.5-flash
AI_THINKING_LEVEL=medium
AI_GEMINI_TIMEOUT_MS=30000
```

### 4. Configure the web app

Create `apps/web/.env`:

```env
VITE_API_URL=http://localhost:4000/api/v1
VITE_APP_NAME=AetherMind
VITE_APP_VERSION=1.0.0
```

### 5. Run

```bash
pnpm dev
```

- Web app: http://localhost:5173
- API: http://localhost:4000
- Health check: http://localhost:4000/api/v1/health

### 6. Optional: seed demo data

```bash
pnpm --filter api seed
```

Creates a demo user and 10 sample tasks. Login with:

```text
Email:    demo@aethermind.ai
Password: DemoPassword123!
```

---

## Available Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Run web + API in watch mode |
| `pnpm build` | Build all packages |
| `pnpm lint` | Lint all packages |
| `pnpm check-types` | Type-check all packages |
| `pnpm format` | Prettier format |
| `pnpm --filter api test` | Run API tests (Vitest + supertest) |
| `pnpm --filter api seed` | Seed demo user and sample tasks |

---

## API Overview

All endpoints are prefixed with `/api/v1` and (except auth/health) require `Authorization: Bearer <token>`.

| Method | Path | Description |
|---|---|---|
| `POST` | `/auth/register` | Create an account |
| `POST` | `/auth/login` | Sign in (returns access token + refresh cookie) |
| `POST` | `/auth/refresh` | Rotate refresh token |
| `POST` | `/auth/logout` | Sign out |
| `GET` | `/tasks` | Paginated, filterable task list |
| `POST` / `PATCH` / `DELETE` | `/tasks` `/tasks/:id` | Task CRUD |
| `GET` | `/calendar` | Calendar data for a date range |
| `POST` | `/calendar/reschedule` | Reschedule a task in the calendar |
| `GET` | `/dashboard/stats` | Aggregated metrics, charts, insights |
| `POST` | `/ai/plan-day` | Generate daily plan |
| `POST` | `/ai/tasks/:taskId/breakdown` | Break a task into subtasks |
| `POST` | `/ai/prioritize` | Re-rank tasks |
| `POST` | `/ai/reschedule` | Suggest new task dates |
| `POST` | `/ai/weekly-review` | Generate weekly review |
| `POST` | `/ai/productivity-insights` | Productivity insights |
| `POST` | `/ai/chat` | Chat with the AI assistant |
| `GET` / `POST` | `/assistant/conversations` | List / create conversations |
| `GET` | `/notifications` | Paginated notification list |
| `PATCH` | `/notifications/:id/read` | Mark notification read |
| `PATCH` | `/notifications/read-all` | Mark all as read |
| `GET` | `/notifications/unread-count` | Unread count |
| `GET` | `/health` | Service health |
| `GET` | `/ai/health` | AI service & Gemini provider health |

---

## Production & Deployment Notes

- **AI Inference**: All AI requests are executed server-side by the Express API via `@google/genai` against Google's cloud infrastructure.
- **Security & Secrets**: `GEMINI_API_KEY` is strictly confined to the backend server environment. The frontend React application communicates solely through authenticated AetherMind API endpoints (`/api/v1/ai/*`) and never handles or exposes AI credentials.
- **Cloud & Serverless Compatibility**: With the complete removal of local Ollama daemons, the AI engine requires zero local GPU resources, persistent model files, or `localhost:11434` daemons. Gemini 3.5 Flash responses complete in ~1.5s–5s, operating comfortably within standard serverless and container execution limits.

---

## Learn More

- **[Ai-Architecture.md](Ai-Architecture.md)** — deep dive into the AI pipeline: context builders, prompt engineering, provider abstraction, Zod validation, retry logic, and telemetry
- **[docs/AI_PROVIDERS.md](docs/AI_PROVIDERS.md)** — detailed guide to the Gemini 3.5 Flash provider, structured outputs, and operational configuration
- **[docs/AUTH_SESSION.md](docs/AUTH_SESSION.md)** — authentication and session design
- **[apps/api/docs/api/README.md](apps/api/docs/api/README.md)** — API conventions and response envelope

---

## License

[MIT](LICENSE)

