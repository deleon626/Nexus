# Quick Start Guide - Nexus QC System

## Start All Services (4 Terminals)

### Terminal 1: Docker Services
```bash
cd ~/Documents/Cursor\ Workspaces/Nexus
docker-compose up
```
**Wait 30 seconds** for PostgreSQL to initialize

**Verify**: `docker ps | grep nexus` should show 3 containers

### Terminal 2: Backend API (FastAPI)
```bash
cd ~/Documents/Cursor\ Workspaces/Nexus/backend
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
**Verify**: `curl http://localhost:8000/health` returns `{"status": "healthy"}`

### Terminal 3: Web Dashboard (React)
```bash
cd ~/Documents/Cursor\ Workspaces/Nexus/web
npm run dev
```
**Opens**: http://localhost:5173 automatically

## Service URLs

| Service | URL | Purpose |
|---------|-----|---------|
| Backend API | http://localhost:8000 | REST API for agent orchestration |
| Web Dashboard | http://localhost:5173 | Supervisor approval interface |
| Supabase Studio | http://localhost:3000 | Database GUI (optional) |
| Database | localhost:5432 | PostgreSQL (psql) |
| Cache | localhost:6379 | Redis (redis-cli) |

## Common Commands

### Database Operations
```bash
# Connect to PostgreSQL
psql -h localhost -U postgres -d postgres

# Reset database (WARNING: deletes all data)
docker-compose down -v
docker-compose up -d
sleep 10
psql -h localhost -U postgres -d postgres -f shared/database/migrations/001_initial_schema.sql
```

### Backend
```bash
# Install new dependency
cd backend && uv add package_name

# Run tests
cd backend && uv run pytest

# Format code
cd backend && uv run black app/

# Lint code
cd backend && uv run ruff check app/
```

### Web
```bash
# Install new dependency
cd web && npm install package_name

# Build for production
cd web && npm run build

# Lint code
cd web && npm run lint
```

### Docker
```bash
# View logs
docker-compose logs -f postgres
docker-compose logs -f redis

# Restart services
docker-compose restart

# Stop services
docker-compose down

# Full reset
docker-compose down -v
```

## Troubleshooting

### Services Won't Start
1. Check if ports are in use: `lsof -i :5432` (PostgreSQL), `lsof -i :6379` (Redis)
2. Kill processes if needed: `kill -9 <PID>`
3. Restart Docker: `docker-compose down && docker-compose up`

### Backend Can't Connect to Database
```bash
# Verify PostgreSQL is running
docker ps | grep postgres

# Check connection
psql -h localhost -U postgres -d postgres -c "SELECT 1"
```

### Web Dashboard Shows Blank Page
1. Check browser console for errors (F12)
2. Verify backend is running: `curl http://localhost:8000/health`
3. Check for CORS errors and verify backend CORS config

## Git Commands

```bash
# Check status
git status

# Commit changes
git add .
git commit -m "Your message"

# View log
git log --oneline

# Create branch for features
git checkout -b feature/feature-name
```

## File Locations

| Component | Main File | Config | Port |
|-----------|-----------|--------|------|
| Backend | `backend/app/main.py` | `backend/.env` | 8000 |
| Web | `web/src/App.tsx` | `web/.env` | 5173 |
| Database | `shared/database/migrations/` | Docker Compose | 5432 |

## Development Tips

### Hot Reload
- **Backend**: Automatic with `--reload` flag
- **Web**: Automatic in Vite dev mode

### Debugging
- **Backend**: Add `import pdb; pdb.set_trace()` in Python
- **Web**: Use React DevTools browser extension

### Code Quality
```bash
# Format all code
cd backend && uv run black app/
cd web && npm run lint -- --fix

# Type checking (TypeScript)
cd web && npx tsc --noEmit
```

## Database Schema

Core tables ready in PostgreSQL:
- `users` - User accounts and roles
- `schemas` - QC report definitions
- `sessions` - Data entry sessions
- `reports` - QC submissions
- `approvals` - Supervisor approvals
- `events` - Audit log

Query examples:
```sql
-- Check pending reports
SELECT id, schema_id, status, created_at FROM reports WHERE status = 'pending_approval' ORDER BY created_at DESC;

-- Check approvals
SELECT * FROM approvals ORDER BY actioned_at DESC;

-- View audit log
SELECT event_type, entity_id, timestamp FROM events ORDER BY timestamp DESC LIMIT 20;
```

## Performance Monitoring

### Backend
- Access FastAPI docs: http://localhost:8000/docs
- View metrics (if implemented): http://localhost:8000/metrics

### Web
- Use React DevTools for component performance
- Check Network tab for API response times

### Database
```bash
# Monitor active queries
psql -h localhost -U postgres -d postgres -c "SELECT pid, query, state FROM pg_stat_activity WHERE state != 'idle';"
```

## Next Steps

1. **Implement Phase 1 Features**:
   - Backend: Agent service with Claude SDK
   - Web: Approval workflow and data input

2. **Add API Endpoints**:
   - Session management
   - Message processing
   - Data submission

3. **Testing**:
   - Unit tests (pytest for backend)
   - Component tests (React Testing Library)
   - Integration tests

4. **Documentation**:
   - API docs (Swagger/OpenAPI)
   - Component Storybook
   - Development guide

---

**Pro Tip**: Keep this file open in a terminal tab for quick reference while developing!

For detailed information, see `SETUP_COMPLETE.md` or `/Users/dennyleonardo/.claude/plans/soft-herding-hummingbird.md`
