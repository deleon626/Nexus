# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Nexus** is an AI-powered Quality Control (QC) & Traceability System. Field operators capture QC data via voice and images using a mobile app or web interface, while an AI agent (Claude SDK) assists with data extraction and validation. Supervisors review and approve submissions through a web dashboard. The system maintains complete audit trails for compliance.

**Architecture**: Full-stack with Flutter (mobile), React+TypeScript (web dashboard), Python FastAPI (backend), Supabase (PostgreSQL + Auth + Storage), Redis (session cache), and Claude SDK (agent orchestration).

## Bash Commands

### Backend (Python/FastAPI)
- `cd backend && uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000`: Start FastAPI server
- `cd backend && uv add package_name`: Add Python dependency
- `cd backend && uv run pytest`: Run tests
- `cd backend && uv run black app/`: Format code
- `cd backend && uv run ruff check app/`: Lint code
- `cd backend && uv run ruff check app/ --fix`: Auto-fix linting issues

### Web (Node.js/React)
- `cd web && npm run dev`: Start Vite dev server (http://localhost:5173)
- `cd web && npm run build`: Build for production
- `cd web && npm run lint`: Run ESLint
- `cd web && npm install package_name`: Add dependency

### Database
- `docker-compose up`: Start all services (PostgreSQL, Redis, Supabase Studio)
- `docker-compose down -v`: Stop services and remove volumes (WARNING: deletes data)
- `psql -h localhost -U postgres -d postgres`: Connect to PostgreSQL

### Mobile (Flutter)
- `cd mobile && flutter run`: Run on connected device/simulator
- `flutter doctor`: Check Flutter environment

## Project Structure

```
nexus/
├── backend/                          # Python FastAPI backend
│   ├── app/
│   │   ├── main.py                  # FastAPI app setup (CORS, lifespan)
│   │   ├── config.py                # Settings (env variables)
│   │   ├── api/                     # API route handlers (endpoints)
│   │   ├── services/                # Business logic (agent, session, STT)
│   │   ├── tools/                   # Agent tool implementations
│   │   ├── models/                  # Pydantic data models
│   │   ├── db/                      # Database clients (Supabase, Redis)
│   │   └── tests/                   # Unit tests
│   ├── pyproject.toml               # Python deps (anthropic, fastapi, pydantic)
│   └── main.py                      # Entry point (calls uvicorn)
│
├── web/                              # React + TypeScript web dashboard
│   ├── src/
│   │   ├── main.tsx                 # Entry point
│   │   ├── App.tsx                  # Root component (routing)
│   │   ├── pages/                   # Page components (ApprovalQueue, etc.)
│   │   ├── components/              # Reusable UI components
│   │   ├── services/                # API clients (Supabase, backend)
│   │   ├── hooks/                   # Custom hooks (useRealtimeQueue, etc.)
│   │   ├── lib/                     # Utilities
│   │   └── types/                   # TypeScript types
│   ├── package.json                 # Node deps (react, react-router, tailwind)
│   ├── tsconfig.json                # TypeScript config
│   ├── vite.config.ts               # Vite bundler config
│   └── tailwind.config.js           # Tailwind CSS config
│
├── mobile/                           # Flutter mobile app
│   ├── lib/
│   │   ├── main.dart                # Entry point
│   │   ├── screens/                 # UI screens
│   │   ├── services/                # API/agent services
│   │   └── models/                  # Data models
│   ├── pubspec.yaml                 # Flutter deps
│   └── pubspec.lock                 # Dependency lock
│
├── shared/                           # Shared resources
│   └── database/
│       └── migrations/              # SQL migration scripts
│
├── docker-compose.yml               # Docker services (PostgreSQL, Redis, Supabase)
├── PRD.md                           # Product Requirements Document
├── QUICK_START.md                   # Quick start guide
├── NEXT_STEPS.md                    # Phase 1 implementation tasks
└── tech-stack.md                    # Detailed tech stack explanation
```

## Code Architecture & Patterns

### Backend Architecture

**Layered Structure**:
- **API Layer** (`app/api/`): HTTP endpoints. Keep routes thin; delegate to services
- **Service Layer** (`app/services/`): Business logic and orchestration
  - `agent_service.py`: Claude SDK client, system prompt, tool calls
  - `session_service.py`: Session lifecycle, Redis context storage
  - `stt_service.py`: Speech-to-text via Whisper API
- **Tool Layer** (`app/tools/`): Agent tool implementations (validation, data commit)
- **DB Layer** (`app/db/`): Supabase and Redis clients (initialized at app startup)
- **Models** (`app/models/`): Pydantic schemas for validation and serialization

**Key Patterns**:
- Async/await throughout (FastAPI + asyncio)
- Dependency injection via FastAPI's `Depends()`
- Pydantic for validation and API contracts
- Redis for transient session state; Supabase for persistent data
- Tools called by Claude agent; results update Redis and trigger client fetches

### Frontend Architecture

**Web Dashboard** (`web/src/`):
- **Pages** (`pages/`): Top-level route components (ApprovalQueue, SchemaDesigner)
- **Components** (`components/`): Reusable UI widgets (Modal, Button, etc.)
- **Services** (`services/`): API clients for backend + Supabase
- **Hooks** (`hooks/`): Reusable logic (useRealtimeQueue for Realtime subscriptions)
- **Types** (`types/`): TypeScript interfaces for domain entities

**Styling**: Tailwind CSS utility classes. Use `@apply` sparingly; prefer composing utilities in className.

**Routing**: React Router v6 (see App.tsx).

**State Management**: Supabase Realtime subscriptions for live approval queue; React hooks for local UI state.

### Agent Service Flow

```
1. Client sends message + image to POST /api/sessions/{id}/messages
2. Session Service fetches session context from Redis
3. Agent Service builds prompt from schema + context
4. Claude SDK (with vision) processes message + images
5. Agent may call tools:
   - show_confirmation_modal: stores data in Redis
   - commit_qc_data: inserts into Supabase + creates audit event
6. Client polls GET /api/sessions/{id}/modal for confirmation data
7. Client submits confirmation → Agent continues or ends session
8. Session state persisted in Redis throughout
```

## Code Style & Conventions

### Python Backend
- Use type hints everywhere (Pydantic for inputs, native types for logic)
- Async functions for I/O; sync for CPU-bound work
- Prefix private methods with `_`
- Constants in UPPERCASE
- Use Ruff + Black (automate with CI/linting hooks)
- Dependency injection: FastAPI `Depends()` + explicit injection

### TypeScript/React
- ES modules (ESM) syntax
- Destructure imports when importing multiple items
- Use `const` by default; avoid `let` and `var`
- React functional components with hooks
- Props as destructured parameters with TypeScript types
- Use React Router for page navigation
- Supabase client initialized in `src/services/supabase.ts`

### File Naming
- Backend: `snake_case.py` (PEP 8)
- Frontend: `camelCase.ts/.tsx`
- Components: `PascalCase.tsx`
- Keep filenames short and descriptive

## Design System

**See**: `DESIGN_SYSTEM.md` (root) for comprehensive design guidelines

**CSS Design Tokens**: `web/src/styles/design-tokens.css`
- Defined using oklch color space for perceptual uniformity
- Includes light and dark theme color variables
- Typography, spacing, shadows, and layout tokens
- Tailwind v4 @theme inline integration ready

**Current Status**: Reference/Guideline (tokens defined, awaiting Tailwind config integration)

**Next Steps**:
- Integrate tokens into `web/tailwind.config.js`
- Apply design tokens to React components
- Implement dark mode toggle in web dashboard

## Database & Data Model

**Supabase (PostgreSQL)**:
- Run migrations from `shared/database/migrations/` at startup
- Use Row-Level Security (RLS) for multi-facility isolation
- Tables: `users`, `schemas`, `reports`, `audit_events`, `approvals`

**Redis**:
- Session state: `session:{session_id}` (JSON structure)
- Confirmation modal: `modal:{session_id}` (temporary; TTL 15 min)
- Schema cache: `schema:{schema_id}` (invalidate on updates)

**Authentication**: Supabase Auth (GoTrue) via JWT tokens.

## Development Workflow

### Adding a New Backend Endpoint
1. Define Pydantic model in `app/models/`
2. Create handler in `app/api/` route file
3. Call service method from `app/services/`
4. Add tests in `app/tests/`
5. Run `uv run pytest` to verify

### Adding a New Frontend Page
1. Create page component in `web/src/pages/`
2. Add route in `web/src/App.tsx`
3. Create API service method in `web/src/services/`
4. Use hooks for Realtime subscriptions if needed
5. Style with Tailwind classes

### Extending the Agent
1. Add system prompt context in `agent_service.py` (schema definitions)
2. Define tool in `app/tools/` with Pydantic input schema
3. Register tool in agent's `tools` parameter
4. Implement handler logic (validation, commit to DB)
5. Test with agent test cases

## Testing

**Backend**: Use pytest with asyncio support
- Test files in `app/tests/`
- Mock Supabase/Redis for unit tests
- Run: `cd backend && uv run pytest`

**Frontend**: ESLint for static analysis
- Run: `cd web && npm run lint`

## Environment Variables

See `.env` files (excluded from git):
- `backend/.env`: `ANTHROPIC_API_KEY`, `SUPABASE_URL`, `SUPABASE_KEY`, `REDIS_URL`
- `web/.env`: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`

Load via pydantic-settings (backend) and Vite's `import.meta.env` (frontend).

## Key Dependencies

**Backend**:
- `anthropic>=0.75.0`: Claude SDK for agent + vision
- `fastapi>=0.124.2`: Web framework
- `pydantic>=2.12.5`: Data validation
- `supabase>=2.25.1`: Database client
- `redis>=7.1.0`: Cache client
- `openai>=2.11.0`: Whisper API for STT

**Frontend**:
- `react@18`: UI framework
- `react-router-dom@6`: Client routing
- `@supabase/supabase-js@2`: Database + auth
- `tailwindcss@3`: Utility CSS

## Common Gotchas

1. **Agent tool names**: Tool functions must match names in tool schemas; Claude SDK calls them by name
2. **Session context**: Always fetch from Redis before agent processing; save after tool execution
3. **CORS**: Backend CORS middleware whitelists localhost:5173 (Vite). Update for production URLs
4. **Async/await**: Don't forget `await` on async functions; check all service calls
5. **Supabase RLS**: If queries return no data, check RLS policies match authenticated user's role/facility
6. **Image handling**: Vision API expects base64 or URLs; format correctly in agent_service._build_user_content()

## Git Workflow

- Create feature branches from main: `git checkout -b feature/description`
- Commit messages: imperative tone ("Add agent service" not "Added")
- Push to remote and open PR for review before merging to main
- Keep commits focused; use `git rebase` to squash WIP commits before merge

## Debugging

- **Backend**: Print debug info to stdout (FastAPI logs via uvicorn); check Redis values with `redis-cli`
- **Frontend**: Use browser DevTools (Console tab); check Supabase subscriptions in Network tab
- **Agent**: Log tool calls and responses; inspect session context in Redis
- **Database**: Connect via `psql` to inspect tables directly

## Phase 1 MVP Scope

Focus on single schema, scale reading, voice input, and approval queue:
- Agent processes scale images + voice commands
- Confirmation modal displays extracted data
- Supervisor approval queue (real-time updates)
- Audit trail for all data changes

See NEXT_STEPS.md for implementation priority and detailed task breakdown.
