# Data Model: Frontend Data Input MVP

**Feature**: `004-frontend-data-input-mvp`
**Date**: 2025-12-16

## Entity Overview

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│   Session   │ 1───* │   Message   │       │             │
│             │       │             │       │   Report    │
│  id (PK)    │       │  id (PK)    │       │             │
│  status     │       │  session_id │       │  id (PK)    │
│  created_at │       │  role       │       │  session_id │
│             │       │  content    │       │  data       │
└─────────────┘       │  timestamp  │       │  status     │
       │              └─────────────┘       │  created_at │
       │                                    └─────────────┘
       │                                           │
       │              ┌─────────────┐               │
       └───────1───*──│Confirmation │───────*───1──┘
                      │             │
                      │  id (PK)    │
                      │  session_id │
                      │  data       │
                      │  status     │
                      │  expires_at │
                      └─────────────┘
```

## Entities

### Session

Represents an active conversation between an operator and the AI agent.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK, auto-generated | Unique session identifier |
| status | Enum | NOT NULL, default='active' | Session state: 'active', 'completed', 'cancelled' |
| created_at | DateTime | NOT NULL, auto-generated | Session start timestamp |
| updated_at | DateTime | auto-updated | Last activity timestamp |

**Validation Rules**:
- Status transitions: active → completed, active → cancelled
- Cannot transition from completed/cancelled back to active

**State Diagram**:
```
[created] ──→ active ──→ completed
                │
                └──→ cancelled
```

---

### Message

An individual communication within a session.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK, auto-generated | Unique message identifier |
| session_id | UUID | FK → Session.id, NOT NULL | Parent session |
| role | Enum | NOT NULL | Sender: 'user' or 'assistant' |
| content | Text | NOT NULL, min_length=1 | Message content |
| created_at | DateTime | NOT NULL, auto-generated | Message timestamp |

**Validation Rules**:
- Content must be non-empty
- Role must be either 'user' or 'assistant'
- session_id must reference an existing active session

---

### Report

The QC data record created when an operator confirms extracted data.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK, auto-generated | Unique report identifier |
| session_id | UUID | FK → Session.id | Originating session (nullable if standalone) |
| confirmation_id | UUID | FK → Confirmation.id | Source confirmation |
| data | JSON | NOT NULL | Extracted and confirmed QC measurements |
| status | Enum | NOT NULL, default='pending_approval' | Report state |
| created_at | DateTime | NOT NULL, auto-generated | Creation timestamp |
| created_by | String | optional | Operator identifier (future auth) |

**Validation Rules**:
- Data must be valid JSON object
- Status values: 'pending_approval', 'approved', 'rejected'
- confirmation_id must reference an existing confirmation

**State Diagram**:
```
[created] ──→ pending_approval ──→ approved
                     │
                     └──→ rejected
```

---

### Confirmation

A pending data extraction awaiting operator approval. Stored in-memory with TTL.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK, auto-generated | Unique confirmation identifier |
| session_id | UUID | NOT NULL | Parent session |
| schema_id | UUID | optional | QC schema reference (future) |
| extracted_data | JSON | NOT NULL | AI-extracted values |
| status | Enum | NOT NULL, default='pending' | Confirmation state |
| created_at | DateTime | NOT NULL, auto-generated | Creation timestamp |
| expires_at | DateTime | NOT NULL | TTL expiration (15 min from creation) |

**Validation Rules**:
- extracted_data must be valid JSON object
- Status values: 'pending', 'confirmed', 'rejected', 'expired'
- expires_at = created_at + 15 minutes
- Auto-expire when current time > expires_at

**State Diagram**:
```
[created] ──→ pending ──→ confirmed ──→ [creates Report]
                 │
                 ├──→ rejected
                 │
                 └──→ expired (auto, on timeout)
```

---

## Relationships

| From | To | Cardinality | Description |
|------|-----|-------------|-------------|
| Session | Message | 1:N | A session contains multiple messages |
| Session | Confirmation | 1:N | A session may have multiple confirmations (one active at a time) |
| Session | Report | 1:N | A session may produce multiple reports |
| Confirmation | Report | 1:1 | A confirmed confirmation creates one report |

---

## Storage Strategy

### SQLite Tables (Persistent)

**sessions**
```sql
CREATE TABLE sessions (
    id TEXT PRIMARY KEY,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TEXT NOT NULL,
    updated_at TEXT
);
CREATE INDEX idx_sessions_status ON sessions(status);
```

**messages**
```sql
CREATE TABLE messages (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL REFERENCES sessions(id),
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TEXT NOT NULL
);
CREATE INDEX idx_messages_session ON messages(session_id);
```

**reports**
```sql
CREATE TABLE reports (
    id TEXT PRIMARY KEY,
    session_id TEXT REFERENCES sessions(id),
    confirmation_id TEXT,
    data TEXT NOT NULL,  -- JSON
    status TEXT NOT NULL DEFAULT 'pending_approval',
    created_at TEXT NOT NULL,
    created_by TEXT
);
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_session ON reports(session_id);
```

### In-Memory Store (Transient)

**Confirmations** - stored in Python dict with TTL cleanup
- Key: `confirmation:{id}`
- Value: Confirmation object (JSON serializable)
- TTL: 15 minutes

**Session Context** - stored in Python dict with TTL cleanup
- Key: `session:{session_id}`
- Value: Context object with conversation history for agent
- TTL: 1 hour

---

## Data Flow

### Text Input Flow
```
1. User types message
2. Frontend sends POST /api/sessions/{id}/messages
3. Backend stores Message in SQLite
4. Agent processes message
5. If extraction: Agent calls show_confirmation_modal
6. Confirmation stored in-memory
7. Frontend polls GET /api/sessions/{id}/modal
8. User confirms → POST /api/sessions/{id}/modal/confirm
9. Confirmation status → 'confirmed'
10. commit_qc_data creates Report in SQLite
11. Success response to frontend
```

### Voice Input Flow
```
1. User presses record
2. MediaRecorder captures audio (webm)
3. User stops recording
4. Frontend sends POST /api/stt/transcribe
5. Backend sends to Whisper API
6. Transcript returned
7. Frontend populates text input
8. User presses send → continues as Text Input Flow
```
