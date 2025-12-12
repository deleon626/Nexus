# Next Steps: Phase 1 MVP Implementation

## Overview
The environment is fully set up. Time to implement Phase 1 features.

**Phase 1 Scope**: Single schema, scale reading images, voice input, confirmation modal, simple approval queue

## Critical Files to Create Next

### Backend (Priority: HIGH)

#### 1. Agent Service (`backend/app/services/agent_service.py`)
```python
# Key responsibilities:
- Initialize Claude SDK client
- Build system prompt with schema context
- Process user messages with vision + text
- Call agent tools (show_confirmation_modal, commit_qc_data)
- Handle tool responses

# Key methods:
- __init__() - Initialize Anthropic client
- process_message() - Main message processing
- _build_system_prompt() - Create agent instructions
- _build_user_content() - Format message + images
```

#### 2. Tool: Confirmation Modal (`backend/app/tools/show_confirmation_modal.py`)
```python
# Purpose: Display extracted data to user
# Inputs: extracted_data array, validation status, summary message
# Output: Store in Redis for client to fetch
# Trigger: ALWAYS called before commit
```

#### 3. Tool: Commit QC Data (`backend/app/tools/commit_qc_data.py`)
```python
# Purpose: Save report to database + create audit event
# Inputs: report_data, schema_id, schema_version, attachments
# Output: report_id on success
# Side effects: Insert report + create event in database
```

#### 4. Session Routes (`backend/app/api/sessions.py`)
```python
# Endpoints:
- POST /api/sessions - Create new session
- GET /api/sessions/{id} - Get session state
- POST /api/sessions/{id}/messages - Send message to agent
- POST /api/sessions/{id}/images - Upload image
- GET /api/sessions/{id}/modal - Fetch confirmation modal data
- DELETE /api/sessions/{id} - End session
```

#### 5. Session Service (`backend/app/services/session_service.py`)
```python
# Key methods:
- create_session(schema_id, user_id) → session_id
- get_session(session_id) → session data
- save_session_context(session_id, data) → store in Redis
- end_session(session_id) → cleanup
```

#### 6. STT Service (`backend/app/services/stt_service.py`)
```python
# Purpose: Convert speech to text using Whisper API
# Input: audio file bytes or URL
# Output: transcribed text
# Key method: transcribe(audio_data) → text
```

### Web Dashboard (Priority: HIGH)

#### 1. Real-time Hook (`web/src/hooks/useRealtimeQueue.ts`)
```typescript
// Already has basic structure, enhance with:
- Error handling
- Auto-refresh on failure
- Subscription cleanup
- Type safety
```

#### 2. Report Details Component (`web/src/components/ReportDetails.tsx`)
```typescript
// Show full report with:
- All fields and values
- Extracted images
- Confidence scores
- Validation status
```

#### 3. Approval Actions (`web/src/components/ApprovalActions.tsx`)
```typescript
// Provide:
- Approve button
- Reject button with reason
- Request revision
- Add comments
```

#### 4. Status Badge (`web/src/components/StatusBadge.tsx`)
```typescript
// Display:
- pending_approval (yellow)
- approved (green)
- rejected (red)
- needs_revision (orange)
```

### Mobile App (Priority: MEDIUM)

#### 1. Camera Service (`mobile/lib/services/camera_service.dart`)
```dart
// Implement:
- Initialize camera
- Capture image
- Save to gallery
- Error handling
```

#### 2. Image Upload Service (`mobile/lib/services/image_upload_service.dart`)
```dart
// Implement:
- Upload to Supabase Storage
- Generate public URL
- Handle errors
- Progress tracking
```

#### 3. Session Service (`mobile/lib/services/session_service.dart`)
```dart
// Key methods:
- createSession(schemaId) → sessionId
- sendMessage(sessionId, message, images) → agentResponse
- pollForModal(sessionId) → modalData
- submitReport(sessionId, confirmData) → reportId
- sendVoiceMessage(sessionId, audioFile) → agentResponse
```

#### 4. Data Entry Screen Enhancements (`mobile/lib/screens/data_entry_screen.dart`)
```dart
// Implement:
- Camera integration
- Image upload
- Voice recording button
- Real message sending to backend
- Modal display + user interaction
```

#### 5. Confirmation Modal Widget (`mobile/lib/widgets/confirmation_modal.dart`)
```dart
// Display:
- Extracted field values
- Validation status icons
- Confidence scores
- Correction input
- Confirm/Modify buttons
```

#### 6. Voice Recording Widget (`mobile/lib/widgets/voice_input_button.dart`)
```dart
// Implement:
- Record audio
- Show recording indicator
- Upload to Supabase
- Handle permissions
```

## Implementation Priority

### Week 1: Backend + Basic Web Integration
```
1. Agent Service (Claude SDK)
2. Confirmation Modal Tool
3. Commit Data Tool
4. Session Service + Routes
5. Test API endpoints
6. Connect Web Dashboard
```

### Week 2: Mobile + Polish
```
1. Image Upload Service
2. Session Service
3. Camera Integration
4. Voice Recording
5. Data Entry Screen
6. End-to-end testing
```

### Week 3: Refinement + Testing
```
1. Error handling
2. Edge cases
3. Performance optimization
4. User experience improvements
5. Documentation
```

## Key Implementation Details

### Agent System Prompt Template
```
You are a QC data entry assistant. Your role is to:
1. Extract data from uploaded images (scale readings, forms, labels)
2. Ask clarifying questions for missing information
3. ALWAYS call show_confirmation_modal before submitting
4. Only call commit_qc_data after user confirms

Schema being used: <schema JSON>

For scale readings:
- Extract numeric value
- Identify unit
- Note any warnings on display

For forms:
- Parse text/handwriting
- Structure data per schema
- Flag low-confidence fields

Communication style:
- Friendly and concise
- Guide user through process
- Be clear about what's required
```

### Confirmation Modal Data Structure
```typescript
{
  extracted_data: [
    {
      field_name: "weight_kg",
      field_value: 1250,
      source: "image_ocr",
      confidence: 95,
      validation_status: "valid",
      validation_message: null
    },
    {
      field_name: "pond_id",
      field_value: null,
      source: "default",
      confidence: 0,
      validation_status: "missing",
      validation_message: "Required field"
    }
  ],
  has_validation_errors: false,
  summary_message: "Review the extracted data above..."
}
```

### Session Context Structure (Redis)
```python
{
  "session_id": "uuid",
  "user_id": "uuid",
  "schema_id": "uuid",
  "status": "active",
  "messages": [...],
  "images": [...],
  "current_modal": {...},  # Shown to user
  "extracted_data": {...},  # Agent's current extraction
  "created_at": "timestamp",
  "expires_at": "timestamp"
}
```

## Testing Strategy

### Backend Tests
```bash
# Create tests/test_agent_service.py
- Test scale reading extraction
- Test confirmation modal generation
- Test data validation
- Test error handling

# Run with:
cd backend && uv run pytest
```

### Web Tests
```bash
# Component tests for ApprovalQueue
# Hook tests for useRealtimeQueue
# Service tests for Supabase client

# Run with:
cd web && npm run test
```

### Mobile Tests
```bash
# Widget tests for confirmation modal
# Service tests for session management
# Integration tests for camera

# Run with:
cd mobile && flutter test
```

### Integration Tests
```
End-to-end flow:
1. Mobile captures image
2. Uploads to backend
3. Agent extracts data
4. Modal shown to user
5. User confirms
6. Report saved to database
7. Web dashboard shows report
8. Supervisor approves
```

## API Contract Reference

### Session Endpoints

```
POST /api/sessions
├─ Input: { schema_id: string, user_id: string }
└─ Output: { session_id: string, expires_at: string }

POST /api/sessions/{session_id}/images
├─ Input: multipart/form-data (image file)
└─ Output: { image_url: string }

POST /api/sessions/{session_id}/messages
├─ Input: {
│   message: string,
│   image_urls: string[],
│   message_type: "voice" | "text"
│ }
└─ Output: { agent_response: string }

GET /api/sessions/{session_id}/modal
└─ Output: {
    extracted_data: array,
    has_validation_errors: boolean,
    summary_message: string
  }

POST /api/sessions/{session_id}/confirm
├─ Input: { action: "confirm" | "modify", message?: string }
└─ Output: { report_id: string, status: string }

DELETE /api/sessions/{session_id}
└─ Output: { status: "deleted" }
```

## Database Operations Needed

```python
# In agent tools:
- INSERT INTO reports (schema_id, schema_version, data, status, created_by) VALUES (...)
- INSERT INTO events (event_type, entity_id, payload) VALUES (...)

# In approval endpoints:
- SELECT FROM reports WHERE status = 'pending_approval'
- UPDATE reports SET status = 'approved' WHERE id = ...
- INSERT INTO approvals (report_id, action, actioned_by) VALUES (...)
```

## Common Pitfalls to Avoid

1. **Not calling confirmation modal** ❌
   - Agent MUST call show_confirmation_modal before commit_qc_data
   - Make this mandatory in system prompt

2. **Storing sensitive data in client** ❌
   - Keep API keys in backend .env only
   - Don't log user data to console

3. **Missing error handling** ❌
   - Handle network failures gracefully
   - Validate all inputs on backend

4. **Hardcoded environment variables** ❌
   - Always use .env files
   - Make config flexible for deployment

5. **Not cleaning up sessions** ❌
   - Set TTL on Redis session data
   - Delete expired sessions regularly

## Success Criteria for Phase 1 MVP

- ✓ Field operator can capture scale reading image
- ✓ AI agent extracts value from image
- ✓ Value shown in confirmation modal
- ✓ Operator can confirm or correct
- ✓ Data saved to database
- ✓ Supervisor sees report in approval queue
- ✓ Supervisor can approve/reject
- ✓ Audit log captures all actions

## Resources

- **FastAPI Docs**: http://localhost:8000/docs (auto-generated)
- **Claude SDK**: https://github.com/anthropics/anthropic-sdk-python
- **Supabase Docs**: https://supabase.com/docs
- **React Hooks**: https://react.dev/reference/react
- **Flutter Docs**: https://flutter.dev/docs

---

**Ready to build!** Start with the Backend Agent Service - it's the core of everything.
