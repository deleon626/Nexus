# Quickstart: Frontend Data Input MVP

**Feature**: `004-frontend-data-input-mvp`
**Date**: 2025-12-16

## Prerequisites

- Python 3.11+
- Node.js 18+
- UV (Python package manager)
- OpenAI API key (for Whisper STT)
- OpenRouter API key (for Agno agent)

## Environment Setup

### 1. Set Environment Variables

Create or update `backend/.env`:
```bash
# OpenRouter (for Agno agent)
OPENROUTER_API_KEY=sk-or-v1-...
OPENROUTER_MODEL_ID=anthropic/claude-3.5-sonnet

# OpenAI (for Whisper STT)
OPENAI_API_KEY=sk-proj-...

# Database (SQLite - auto-created)
DATABASE_URL=sqlite+aiosqlite:///./data/nexus.db
```

### 2. Install Backend Dependencies

```bash
cd backend
uv add aiosqlite "sqlalchemy[asyncio]"
uv sync
```

### 3. Install Frontend Dependencies

```bash
cd web
npm install
```

## Running the Application

### Start Backend Server

```bash
cd backend
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend available at: http://localhost:8000
API docs at: http://localhost:8000/docs

### Start Frontend Dev Server

```bash
cd web
npm run dev
```

Frontend available at: http://localhost:5173

### Access Data Entry Page

Navigate to: http://localhost:5173/data-entry

## Quick Test

### 1. Text Input Test
1. Open http://localhost:5173/data-entry
2. Type: "Weight reading is 150.5 kg for batch ABC123"
3. Press Send
4. Wait for confirmation modal
5. Click Confirm
6. Verify success toast

### 2. Voice Input Test
1. Open http://localhost:5173/data-entry
2. Click the microphone button
3. Grant microphone permission if prompted
4. Speak: "Temperature reading twenty-three degrees"
5. Click stop
6. Verify text appears in input
7. Press Send and follow confirmation flow

## API Testing (curl)

### Create Session
```bash
curl -X POST http://localhost:8000/api/sessions
```

### Send Message
```bash
curl -X POST http://localhost:8000/api/sessions/{session_id}/messages \
  -H "Content-Type: application/json" \
  -d '{"content": "Weight reading is 150.5 kg"}'
```

### Get Confirmation Modal
```bash
curl http://localhost:8000/api/sessions/{session_id}/modal
```

### Confirm Data
```bash
curl -X POST http://localhost:8000/api/sessions/{session_id}/modal/confirm \
  -H "Content-Type: application/json" \
  -d '{"confirmed": true}'
```

### Transcribe Audio
```bash
curl -X POST http://localhost:8000/api/stt/transcribe \
  -F "file=@recording.webm"
```

## Database Location

SQLite database file: `backend/data/nexus.db`

To inspect:
```bash
sqlite3 backend/data/nexus.db
.tables
SELECT * FROM sessions;
SELECT * FROM reports;
```

## Troubleshooting

### "OPENAI_API_KEY not set"
Ensure your `.env` file has the OPENAI_API_KEY variable set.

### "Model unavailable" (502)
Check your OPENROUTER_API_KEY is valid and the model ID is correct.

### Microphone not working
- Check browser permissions
- Ensure HTTPS or localhost (MediaRecorder requires secure context)

### Database not created
The database is auto-created on first request. If issues persist:
```bash
mkdir -p backend/data
```

## Next Steps

After completing the quickstart:
1. Run `/speckit.tasks` to generate implementation tasks
2. Follow TDD: write tests first for backend services
3. Implement in order: SQLite → STT → Frontend
