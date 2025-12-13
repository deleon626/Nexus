# Revised Tech Stack Summary: AI-Powered QC & Traceability System

With Supabase self-hosted as the data platform, here's the consolidated architecture:

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                             │
│  ┌────────────────────┐       ┌────────────────────┐           │
│  │   Mobile App       │       │   Web Dashboard    │           │
│  │   (Flutter)        │       │   (React + TS)     │           │
│  │   • Camera/Voice   │       │   • Approval Queue │           │
│  │   • Offline SQLite │       │   • Schema Designer│           │
│  └─────────┬──────────┘       └─────────┬──────────┘           │
└────────────┼────────────────────────────┼───────────────────────┘
             │                            │
             ▼                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API LAYER                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              Python + FastAPI                            │   │
│  │   • Agent orchestration    • Tool execution              │   │
│  │   • Session management     • Business logic              │   │
│  └─────────────────────────────────────────────────────────┘   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ Claude SDK   │  │ Whisper API  │  │  External OCR        │  │
│  │ (Agent+Vision)│  │ (STT)        │  │  (FormX/DocParser)   │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────┐
│                 SUPABASE SELF-HOSTED                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │  PostgreSQL  │  │  Supabase    │  │  Supabase            │  │
│  │  + TimescaleDB│  │  Auth        │  │  Storage             │  │
│  │  (Events)    │  │  (GoTrue)    │  │  (S3-compatible)     │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
│  ┌──────────────┐  ┌──────────────────────────────────────────┐│
│  │  Supabase    │  │  Row-Level Security (RLS)                ││
│  │  Realtime    │  │  • Facility isolation • Role-based access││
│  └──────────────┘  └──────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────┐
│                 SUPPORTING INFRASTRUCTURE                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │    Redis     │  │   AWS SQS    │  │  Kubernetes (EKS)    │  │
│  │ (Session     │  │ (Async jobs, │  │  (Orchestration)     │  │
│  │  Cache)      │  │  Notifications)│ │                      │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Component Summary

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Mobile Client** | Flutter | Cross-platform app for field operators (camera, voice, offline) |
| **Web Dashboard** | React + TypeScript | Supervisor approval queue, schema designer, analytics |
| **API Layer** | Python + FastAPI | Agent orchestration, tool execution, business logic |
| **AI Agent** | Claude SDK (Anthropic) | Conversational agent with vision + tool-use |
| **Speech-to-Text** | OpenAI Whisper API | Voice input transcription |
| **External OCR** | Configurable (FormX, DocParser) | Complex form parsing |
| **Database** | PostgreSQL (via Supabase) | Primary relational data store |
| **Event Store** | TimescaleDB extension | Immutable audit log, time-series optimized |
| **Authentication** | Supabase Auth (GoTrue) | OAuth 2.0/OIDC, role-based access |
| **Object Storage** | Supabase Storage | Images, voice recordings (S3-compatible) |
| **Real-time** | Supabase Realtime | Live dashboard updates, approval queue sync |
| **Access Control** | PostgreSQL RLS | Row-level security for multi-facility isolation |
| **Session Cache** | Redis | Fast session state, agent context |
| **Message Queue** | AWS SQS | Async notifications, background jobs |
| **Infrastructure** | Kubernetes (EKS) | Container orchestration, Supabase deployment |

---

## What Supabase Consolidates

Previously separate components now unified under Supabase:

| Before (Separate) | After (Supabase) |
|-------------------|------------------|
| PostgreSQL (managed RDS) | Supabase PostgreSQL |
| AWS S3 + presigned URLs | Supabase Storage |
| Auth0 / Cognito / custom OAuth | Supabase Auth |
| Redis pub/sub for real-time | Supabase Realtime |
| Custom RLS implementation | Native PostgreSQL RLS |

**Still separate:**
- Redis (session cache — Supabase doesn't replace this)
- SQS (async job queue)
- TimescaleDB (add as PostgreSQL extension)
- External services (Claude, Whisper, OCR APIs)

---

## Database Schema Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                    SUPABASE POSTGRESQL                      │
├─────────────────────────────────────────────────────────────┤
│  CORE TABLES (Regular PostgreSQL)                           │
│  ├── users (synced from Supabase Auth)                      │
│  ├── facilities                                             │
│  ├── schemas (QC report definitions)                        │
│  ├── schema_versions                                        │
│  ├── reports                                                │
│  ├── approvals                                              │
│  └── sessions                                               │
├─────────────────────────────────────────────────────────────┤
│  EVENT STORE (TimescaleDB Hypertable)                       │
│  └── events (immutable audit log, partitioned by time)      │
├─────────────────────────────────────────────────────────────┤
│  STORAGE BUCKETS (Supabase Storage)                         │
│  ├── report-images (scale photos, forms, labels)            │
│  └── voice-recordings (raw audio files)                     │
└─────────────────────────────────────────────────────────────┘
```

---

## Key Integration Points

### 1. FastAPI ↔ Supabase

```python
# Using supabase-py client
from supabase import create_client

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

# Query with RLS bypassed (service role)
reports = supabase.table("reports").select("*").eq("status", "pending").execute()

# Real-time subscription (server-side)
supabase.realtime.channel("reports").on("INSERT", handle_new_report).subscribe()
```

### 2. Flutter ↔ Supabase

```dart
// Direct client connection with user auth
final supabase = Supabase.instance.client;

// Auth
await supabase.auth.signInWithPassword(email: email, password: password);

// Real-time (approval status updates)
supabase.from('reports').stream(primaryKey: ['id']).listen((data) {
  // Update UI when report status changes
});

// Storage upload
await supabase.storage.from('report-images').upload(path, file);
```

### 3. React Dashboard ↔ Supabase

```typescript
// Real-time approval queue
const { data, error } = await supabase
  .from('reports')
  .select('*, schemas(*), users(*)')
  .eq('status', 'pending_approval')
  .order('created_at', { ascending: false });

// Subscribe to changes
supabase
  .channel('approval-queue')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'reports' }, 
    (payload) => updateQueue(payload))
  .subscribe();
```

---

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     AWS EKS CLUSTER                         │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐   │
│  │  SUPABASE NAMESPACE                                  │   │
│  │  ├── postgres (StatefulSet + PVC)                   │   │
│  │  ├── gotrue (Auth - Deployment)                     │   │
│  │  ├── storage-api (Deployment)                       │   │
│  │  ├── realtime (Deployment)                          │   │
│  │  ├── postgrest (API - Deployment)                   │   │
│  │  └── kong (API Gateway - Deployment)                │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  APPLICATION NAMESPACE                               │   │
│  │  ├── fastapi-agent (Deployment, HPA)                │   │
│  │  ├── redis (StatefulSet)                            │   │
│  │  └── worker (background jobs - Deployment)          │   │
│  └─────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│  EXTERNAL SERVICES                                          │
│  ├── AWS SQS (notifications queue)                         │
│  ├── AWS S3 (Supabase Storage backend)                     │
│  ├── Claude API (Anthropic)                                │
│  ├── Whisper API (OpenAI)                                  │
│  └── OCR API (FormX/DocParser)                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Phase Alignment

| Phase | Stack Components Active |
|-------|------------------------|
| **Phase 1 (MVP)** | Flutter + FastAPI + Supabase (core) + Claude + Whisper |
| **Phase 2 (Enhanced)** | + TimescaleDB extension + External OCR + Schema Designer |
| **Phase 3 (Scale)** | + Multi-facility RLS policies + Analytics dashboards + Anomaly detection |

---

## Quick Reference Card

| Need | Solution |
|------|----------|
| Store QC reports | Supabase PostgreSQL |
| Store audit events | TimescaleDB hypertable |
| Store images/voice | Supabase Storage |
| Authenticate users | Supabase Auth |
| Real-time dashboard | Supabase Realtime |
| Multi-tenant isolation | PostgreSQL RLS |
| Session state | Redis |
| Async jobs | AWS SQS + worker pods |
| AI agent | Claude SDK |
| Voice transcription | Whisper API |
| Form parsing | FormX / DocParser |
| Container orchestration | Kubernetes (EKS) |

---

Want me to detail the Supabase self-hosted deployment steps, the database schema design, or the FastAPI project structure next?