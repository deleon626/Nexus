# Research: Frontend Data Input MVP

**Feature**: `004-frontend-data-input-mvp`
**Date**: 2025-12-16

## Research Tasks Completed

### 1. SQLite Async Patterns with aiosqlite

**Decision**: Use `aiosqlite` with `SQLAlchemy[asyncio]` for async database operations.

**Rationale**:
- aiosqlite provides async/await support for SQLite3
- SQLAlchemy 2.0+ has native async support via `create_async_engine`
- Connection string format: `sqlite+aiosqlite:///./data/nexus.db`
- Compatible with existing FastAPI async patterns

**Alternatives Considered**:
- Raw aiosqlite (rejected: loses ORM benefits, more boilerplate)
- Synchronous SQLite with thread pool (rejected: blocks event loop, inconsistent with existing async code)
- Databases library (rejected: less mature than SQLAlchemy, smaller community)

**Implementation Pattern**:
```python
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

DATABASE_URL = "sqlite+aiosqlite:///./data/nexus.db"
engine = create_async_engine(DATABASE_URL, echo=False)
async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
```

---

### 2. OpenAI Whisper API Integration

**Decision**: Use OpenAI's cloud Whisper API via the `openai` Python SDK.

**Rationale**:
- Simplest integration path - single API call
- High accuracy for voice transcription
- Supports webm/opus format from MediaRecorder
- Existing OPENAI_API_KEY can be reused (already in user's config)

**Alternatives Considered**:
- Local Whisper model (rejected: requires GPU, large model download, complex setup)
- Google Cloud Speech-to-Text (rejected: additional API key, different pricing)
- Browser Web Speech API (rejected: user explicitly requested Whisper)

**Implementation Pattern**:
```python
from openai import AsyncOpenAI

client = AsyncOpenAI()

async def transcribe(audio_file: UploadFile) -> str:
    transcript = await client.audio.transcriptions.create(
        model="whisper-1",
        file=audio_file.file,
        response_format="text"
    )
    return transcript
```

**Audio Format Support**:
- Supported: mp3, mp4, mpeg, mpga, m4a, wav, webm
- MediaRecorder default: webm/opus (fully supported)
- Max file size: 25 MB
- Max duration: No hard limit, but 60s enforced by frontend

---

### 3. MediaRecorder API Browser Compatibility

**Decision**: Use MediaRecorder API with webm/opus codec as primary, with graceful degradation.

**Rationale**:
- Native browser API, no external dependencies
- webm/opus provides good compression and quality
- Supported by all target browsers (Chrome, Firefox, Edge, Safari 14.1+)

**Alternatives Considered**:
- RecordRTC library (rejected: unnecessary abstraction for simple recording)
- Web Audio API manual recording (rejected: complex, MediaRecorder is simpler)

**Browser Support Matrix**:
| Browser | MediaRecorder | webm/opus | Notes |
|---------|--------------|-----------|-------|
| Chrome 49+ | Yes | Yes | Full support |
| Firefox 25+ | Yes | Yes | Full support |
| Edge 79+ | Yes | Yes | Full support |
| Safari 14.1+ | Yes | Partial | Uses mp4 fallback |

**Implementation Pattern**:
```typescript
const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
  ? 'audio/webm;codecs=opus'
  : 'audio/mp4';

const mediaRecorder = new MediaRecorder(stream, { mimeType });
```

---

### 4. shadcn/ui Dialog and Form Patterns

**Decision**: Use shadcn Dialog with React Hook Form for confirmation modal.

**Rationale**:
- shadcn Dialog already installed (003-shadcn-setup)
- React Hook Form + Zod already in project dependencies
- Consistent with existing form patterns
- Accessible by default (Radix UI primitives)

**Alternatives Considered**:
- Custom modal (rejected: reinvents accessible patterns)
- AlertDialog (rejected: doesn't support form inputs)

**Implementation Pattern**:
```tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Form, FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

// Confirmation modal with editable fields
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Confirm Extracted Data</DialogTitle>
    </DialogHeader>
    <Form {...form}>
      {/* Editable fields for extracted data */}
    </Form>
    <DialogFooter>
      <Button variant="outline" onClick={onReject}>Reject</Button>
      <Button onClick={onConfirm}>Confirm</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

---

### 5. In-Memory Session Context (Redis Replacement)

**Decision**: Use Python dict with TTL-based cleanup for session context in MVP.

**Rationale**:
- Eliminates Docker dependency
- Sufficient for single-user local development
- Easy to migrate to Redis later (same key-value interface)

**Alternatives Considered**:
- SQLite for session context (rejected: adds complexity for transient data)
- File-based storage (rejected: slower, more complex)

**Implementation Pattern**:
```python
from datetime import datetime, timedelta
from typing import Dict, Any

class InMemorySessionStore:
    def __init__(self, ttl_seconds: int = 3600):
        self._store: Dict[str, tuple[Any, datetime]] = {}
        self._ttl = timedelta(seconds=ttl_seconds)

    async def get(self, key: str) -> Any:
        if key in self._store:
            value, expires = self._store[key]
            if datetime.now() < expires:
                return value
            del self._store[key]
        return None

    async def set(self, key: str, value: Any) -> None:
        self._store[key] = (value, datetime.now() + self._ttl)
```

---

## Unresolved Items

None. All technical decisions have been made based on:
- User requirements (OpenAI Whisper, SQLite, shadcn)
- Constitution compliance (layered architecture, security)
- Existing project patterns (Agno framework, FastAPI async)

## Dependencies to Add

**Backend** (`backend/pyproject.toml`):
```toml
[project.dependencies]
aiosqlite = "^0.19.0"
sqlalchemy = {version = "^2.0", extras = ["asyncio"]}
# openai already present for agent
```

**Frontend** (already present from 003-shadcn-setup):
- React Hook Form
- Zod
- shadcn/ui components
