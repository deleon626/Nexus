# Implementation Guide: Conversational Schema Builder for Nexus
## Quick Start for React + FastAPI Integration

This guide translates research findings into actionable implementation steps for Nexus QC schema builder.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     React Frontend (Vite)                   │
│  ┌──────────────────┐  ┌─────────────┐  ┌───────────────┐  │
│  │  Conversation    │  │   Preview   │  │ Confirmation  │  │
│  │  Panel (Chat)    │  │   Panel     │  │   Modal       │  │
│  │ (useChat hook)   │  │ (Live Form) │  │ (FormTable)   │  │
│  └──────────────────┘  └─────────────┘  └───────────────┘  │
└─────────────────────────────────────────────────────────────┘
           ↓ /api/schemas/generate (streaming)
┌─────────────────────────────────────────────────────────────┐
│               FastAPI Backend (Python)                      │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ POST /api/schemas/generate                            │  │
│  │  1. Build few-shot prompt                             │  │
│  │  2. Stream LLM response                               │  │
│  │  3. Extract + validate JSON                           │  │
│  │  4. Return schema (streaming chunks)                  │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
           ↓ Store in Redis (transient)
┌─────────────────────────────────────────────────────────────┐
│                      Redis Cache                            │
│  schema:session:{sid} → conversation history                │
│  modal:{sid}          → pending confirmation (15 min TTL)   │
└─────────────────────────────────────────────────────────────┘
           ↓ On user confirmation
┌─────────────────────────────────────────────────────────────┐
│              Supabase (PostgreSQL)                          │
│  schemas table → finalized schema                           │
│  audit_events  → schema creation trail                      │
└─────────────────────────────────────────────────────────────┘
```

---

## Phase 1: MVP Implementation (2-3 weeks)

### Step 1: Backend Endpoint Setup

**File:** `backend/app/api/schemas.py`

```python
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from fastapi.responses import StreamingResponse
import json
from typing import AsyncGenerator
from app.services.agent_service import AgentService
from app.db.supabase import get_supabase_client
from app.db.redis import get_redis_client
from app.models import SchemaGenerationRequest, SchemaConfirmation

router = APIRouter(prefix="/schemas", tags=["schemas"])

@router.post("/generate")
async def generate_schema_streaming(
    request: SchemaGenerationRequest,
    agent_service: AgentService = Depends(),
    redis_client = Depends(get_redis_client),
    session_id: str = None
) -> StreamingResponse:
    """
    Generate a QC form schema from natural language description.
    Streams JSON chunks as they're generated.
    """

    async def schema_generator() -> AsyncGenerator[str, None]:
        try:
            # 1. Build few-shot prompt for QC schema generation
            prompt = build_qc_schema_prompt(
                user_description=request.description,
                examples=get_qc_schema_examples()
            )

            # 2. Stream from AI backend (Agno agent)
            schema_chunks = []
            async for chunk in agent_service.stream_schema_generation(prompt):
                # Yield to client for streaming display
                yield f"data: {json.dumps({'chunk': chunk})}\n\n"
                schema_chunks.append(chunk)

            # 3. Parse complete JSON from chunks
            full_response = "".join(schema_chunks)
            schema_json = extract_json_from_response(full_response)

            # 4. Validate schema structure
            validation_result = validate_schema(schema_json)
            if not validation_result.valid:
                # Trigger repair on backend
                schema_json = await repair_invalid_schema(
                    schema_json,
                    validation_result.errors,
                    agent_service
                )

            # 5. Store in Redis for confirmation flow
            confirmation_id = await redis_client.set(
                f"modal:{session_id}",
                {
                    "schema": schema_json,
                    "raw_response": full_response,
                    "validated": True,
                    "created_at": datetime.now().isoformat()
                },
                ex=900  # 15 minute TTL
            )

            # 6. Send final validated schema
            yield f"data: {json.dumps({'final': schema_json, 'confirmation_id': confirmation_id})}\n\n"

        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

    return StreamingResponse(
        schema_generator(),
        media_type="text/event-stream"
    )


@router.post("/confirm")
async def confirm_schema(
    confirmation: SchemaConfirmation,
    supabase = Depends(get_supabase_client),
    redis_client = Depends(get_redis_client),
) -> dict:
    """
    User confirms the generated schema.
    Persist to database with audit trail.
    """

    # 1. Retrieve from Redis
    modal_data = await redis_client.get(f"modal:{confirmation.session_id}")
    if not modal_data:
        raise HTTPException(status_code=410, detail="Confirmation expired")

    # 2. Apply any user modifications
    final_schema = merge_modifications(
        modal_data["schema"],
        confirmation.modifications
    )

    # 3. Final validation
    if not validate_schema(final_schema).valid:
        raise HTTPException(status_code=422, detail="Schema validation failed")

    # 4. Persist to Supabase
    result = supabase.table("schemas").insert({
        "name": confirmation.name,
        "description": confirmation.description,
        "definition": final_schema,
        "created_by": confirmation.user_id,
        "created_at": datetime.now().isoformat(),
        "facility_id": confirmation.facility_id
    }).execute()

    schema_id = result.data[0]["id"]

    # 5. Audit trail
    supabase.table("audit_events").insert({
        "event_type": "schema_created",
        "entity_type": "schema",
        "entity_id": schema_id,
        "user_id": confirmation.user_id,
        "changes": {
            "schema": final_schema,
            "ai_generated": True
        },
        "created_at": datetime.now().isoformat()
    }).execute()

    # 6. Clean up Redis
    await redis_client.delete(f"modal:{confirmation.session_id}")

    return {
        "schema_id": schema_id,
        "status": "published",
        "name": confirmation.name
    }
```

### Step 2: Pydantic Models

**File:** `backend/app/models/schema.py`

```python
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any, Literal
from datetime import datetime

class SchemaField(BaseModel):
    field_id: str
    label: str
    type: Literal["number", "text", "select", "checkbox", "rating", "image", "signature"]
    required: bool = True
    placeholder: Optional[str] = None
    validation: Optional[Dict[str, Any]] = None
    conditional_rules: Optional[Dict[str, Any]] = None
    metadata: Optional[Dict[str, Any]] = None

class QCSchema(BaseModel):
    name: str
    description: str
    fields: List[SchemaField]
    validation_rules: Optional[Dict[str, Any]] = None
    metadata: Optional[Dict[str, Any]] = None

class SchemaGenerationRequest(BaseModel):
    """User's natural language request for schema"""
    description: str = Field(..., description="What form do you want to create?")
    form_type: Optional[str] = Field(None, description="scale_reading|assembly|inspection|custom")
    facility_id: Optional[str] = None
    session_id: str

class SchemaConfirmation(BaseModel):
    """User confirms and publishes generated schema"""
    session_id: str
    confirmation_id: str
    name: str
    description: str
    user_id: str
    facility_id: str
    modifications: Optional[Dict[str, Any]] = None
```

### Step 3: Few-Shot Prompt Builder

**File:** `backend/app/services/schema_prompt_builder.py`

```python
from typing import List, Dict

def build_qc_schema_prompt(
    user_description: str,
    examples: List[Dict]
) -> str:
    """Build a few-shot prompt for QC schema generation"""

    return f"""You are a JSON schema generator for manufacturing quality control forms.

Your task is to generate a JSON schema based on the user's description.

OUTPUT FORMAT (respond ONLY with valid JSON):
{{
  "fields": [
    {{
      "field_id": "unique-id",
      "label": "Human-readable label",
      "type": "number|text|select|checkbox|rating|image|signature",
      "required": true,
      "validation": {{"min": 0, "max": 10}},
      "metadata": {{"unit": "mm"}}
    }}
  ],
  "validation_rules": {{}},
  "metadata": {{"estimated_time": "5 minutes"}}
}}

EXAMPLES:

Example 1: Scale Reading Form
Input: "I need a form for measuring component dimensions. Scale readings from 0-25mm with tolerance check."
Output:
{{
  "fields": [
    {{
      "field_id": "component_id",
      "label": "Component ID",
      "type": "text",
      "required": true,
      "validation": {{"pattern": "^[A-Z0-9]{{6}}$"}}
    }},
    {{
      "field_id": "dimension_reading",
      "label": "Dimension (mm)",
      "type": "number",
      "required": true,
      "validation": {{"min": 0, "max": 25}},
      "metadata": {{"unit": "mm", "tolerance": {{"min": 10, "max": 15}}}}
    }},
    {{
      "field_id": "dimension_status",
      "label": "Status",
      "type": "select",
      "required": true,
      "validation": {{"allowed_values": ["Pass", "Fail", "Rework"]}}
    }}
  ]
}}

Example 2: Assembly Verification
Input: "Assembly checklist: verify all connectors seated, check seal integrity, verify wire harness routing"
Output:
{{
  "fields": [
    {{
      "field_id": "connector_check",
      "label": "All connectors properly seated?",
      "type": "checkbox",
      "required": true
    }},
    {{
      "field_id": "seal_integrity",
      "label": "Seal integrity verified?",
      "type": "checkbox",
      "required": true
    }},
    {{
      "field_id": "wire_routing",
      "label": "Wire harness routing correct?",
      "type": "checkbox",
      "required": true
    }},
    {{
      "field_id": "issues_found",
      "label": "Issues found (if any)",
      "type": "text",
      "required": false,
      "conditional_rules": {{"show_if": "connector_check OR seal_integrity OR wire_routing = false"}}
    }}
  ]
}}

Example 3: Visual Inspection
Input: "Capture photos of defects with location marking and severity"
Output:
{{
  "fields": [
    {{
      "field_id": "defect_image",
      "label": "Photo of defect",
      "type": "image",
      "required": true
    }},
    {{
      "field_id": "defect_location",
      "label": "Defect location",
      "type": "text",
      "required": true
    }},
    {{
      "field_id": "severity",
      "label": "Severity",
      "type": "rating",
      "required": true,
      "validation": {{"min": 1, "max": 5}},
      "metadata": {{"scale_labels": ["Minor", "Low", "Medium", "High", "Critical"]}}
    }}
  ]
}}

NOW GENERATE SCHEMA FOR:
{user_description}

Remember:
- Respond ONLY with valid JSON
- Include meaningful field_ids (snake_case)
- Match field types to data being collected
- Add validation rules where appropriate
- Keep metadata simple and useful
"""


def get_qc_schema_examples() -> List[Dict]:
    """Return curated examples for few-shot prompting"""
    return [
        {
            "description": "Scale reading form",
            "schema": {
                "fields": [
                    {"field_id": "reading_value", "label": "Reading", "type": "number"}
                ]
            }
        },
        {
            "description": "Pass/fail checklist",
            "schema": {
                "fields": [
                    {"field_id": "check_1", "label": "Check 1", "type": "checkbox"}
                ]
            }
        }
    ]
```

### Step 4: Validation and Repair Logic

**File:** `backend/app/services/schema_validator.py`

```python
import json
from typing import Tuple, Optional
from pydantic import ValidationError

class SchemaValidationResult:
    def __init__(self, valid: bool, errors: list = None):
        self.valid = valid
        self.errors = errors or []

def validate_schema(schema_json: dict) -> SchemaValidationResult:
    """Multi-stage validation"""

    # Stage 1: Structure validation
    required_keys = ["fields"]
    if not all(key in schema_json for key in required_keys):
        return SchemaValidationResult(
            valid=False,
            errors=[f"Missing required key: {k}" for k in required_keys if k not in schema_json]
        )

    # Stage 2: Field validation
    errors = []
    if not isinstance(schema_json.get("fields"), list):
        errors.append("fields must be an array")
    else:
        for i, field in enumerate(schema_json["fields"]):
            field_errors = validate_field(field, i)
            errors.extend(field_errors)

    if errors:
        return SchemaValidationResult(valid=False, errors=errors)

    return SchemaValidationResult(valid=True)

def validate_field(field: dict, index: int) -> list:
    """Validate individual field"""
    errors = []
    required_field_keys = ["field_id", "label", "type"]

    for key in required_field_keys:
        if key not in field:
            errors.append(f"Field {index}: missing '{key}'")

    valid_types = ["number", "text", "select", "checkbox", "rating", "image", "signature"]
    if "type" in field and field["type"] not in valid_types:
        errors.append(f"Field {index}: invalid type '{field['type']}'")

    return errors

async def repair_invalid_schema(
    invalid_json: dict,
    errors: list,
    agent_service
) -> dict:
    """Use AI to fix invalid schema"""

    repair_prompt = f"""Fix this schema. It has these errors: {', '.join(errors)}

Invalid schema:
{json.dumps(invalid_json, indent=2)}

Return ONLY valid JSON with fixes applied:"""

    # Use a smaller, faster model for repair (temperature=0 for determinism)
    result = await agent_service.generate_completion(
        prompt=repair_prompt,
        temperature=0,
        max_tokens=2000
    )

    # Extract JSON from response
    try:
        repaired = extract_json_from_response(result)
        return repaired
    except:
        # If repair fails, return original and let user fix
        return invalid_json

def extract_json_from_response(response: str) -> dict:
    """Extract JSON from LLM response (handles markdown code blocks, etc)"""
    import re

    # Try to find JSON block
    match = re.search(r'\{.*\}', response, re.DOTALL)
    if match:
        json_str = match.group(0)
        return json.loads(json_str)

    # Fallback: try parsing whole response
    return json.loads(response)
```

---

## Phase 2: Frontend Component

**File:** `web/src/pages/SchemaBuilder.tsx`

```typescript
import React, { useState, useRef, useEffect } from 'react';
import { useChat } from 'ai/react';
import type { Message } from 'ai';
import { useAuth } from '@supabase/auth-helpers-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormPreview } from '@/components/SchemaBuilder/FormPreview';
import { ConfirmationModal } from '@/components/SchemaBuilder/ConfirmationModal';
import { SchemaChat } from '@/components/SchemaBuilder/SchemaChat';

export function SchemaBuilder() {
  const { user } = useAuth();
  const [sessionId] = useState(() => crypto.randomUUID());
  const [generatedSchema, setGeneratedSchema] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Use AI SDK for chat state management
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/schemas/generate',
    body: { session_id: sessionId },
    onFinish: (message) => {
      // Parse final schema from message
      try {
        const content = message.content;
        const schemaMatch = content.match(/{"fields".*}/s);
        if (schemaMatch) {
          const schema = JSON.parse(schemaMatch[0]);
          setGeneratedSchema(schema);
          setIsValidating(false);
        }
      } catch (e) {
        console.error('Failed to parse schema:', e);
      }
    }
  });

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleGenerateSchema = (e: React.FormEvent) => {
    e.preventDefault();
    setIsValidating(true);
    handleSubmit(e);
  };

  return (
    <div className="flex h-screen gap-4 p-4 bg-gray-50">
      {/* Chat Panel */}
      <div className="flex-1 flex flex-col bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Schema Builder</h2>
          <p className="text-sm text-gray-600">Describe the form you want to create</p>
        </div>

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, idx) => (
            <div
              key={msg.id || idx}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs px-4 py-2 rounded-lg ${
                  msg.role === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {isValidating && (
            <div className="flex justify-start">
              <div className="bg-gray-100 text-gray-900 px-4 py-2 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                  Generating schema...
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleGenerateSchema} className="p-4 border-t">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={handleInputChange}
              disabled={isLoading || isValidating}
              placeholder="Describe the form you want to create..."
              className="flex-1"
            />
            <Button
              type="submit"
              disabled={isLoading || isValidating || !input}
              className="px-6"
            >
              {isLoading || isValidating ? 'Generating...' : 'Generate'}
            </Button>
          </div>
        </form>
      </div>

      {/* Preview Panel */}
      <div className="flex-1 flex flex-col bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Preview</h2>
        </div>

        {generatedSchema ? (
          <div className="flex-1 overflow-y-auto p-4">
            <FormPreview schema={generatedSchema} />

            <div className="mt-6 flex gap-2">
              <Button
                onClick={() => setShowConfirmation(true)}
                className="flex-1"
              >
                Confirm & Publish
              </Button>
              <Button
                onClick={() => setGeneratedSchema(null)}
                variant="outline"
                className="flex-1"
              >
                Generate Again
              </Button>
            </div>

            {/* Confirmation Modal */}
            {showConfirmation && (
              <ConfirmationModal
                schema={generatedSchema}
                sessionId={sessionId}
                userId={user?.id}
                onClose={() => setShowConfirmation(false)}
                onConfirm={(name, description) => {
                  // Handle confirmation
                  console.log('Published:', name, description);
                }}
              />
            )}
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <p>Generated form will appear here</p>
          </div>
        )}
      </div>
    </div>
  );
}
```

### FormPreview Component

**File:** `web/src/components/SchemaBuilder/FormPreview.tsx`

```typescript
import React from 'react';
import type { QCSchema, SchemaField } from '@/types/schema';

export function FormPreview({ schema }: { schema: QCSchema }) {
  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg">{schema.name || 'Untitled Form'}</h3>

      {schema.fields.map((field) => (
        <div key={field.field_id} className="border rounded-lg p-4 bg-gray-50">
          <label className="block font-medium text-sm mb-2">
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </label>

          {field.type === 'number' && (
            <input
              type="number"
              disabled
              placeholder={`e.g., ${field.validation?.min || 0}-${field.validation?.max || 10}`}
              className="w-full px-3 py-2 border rounded disabled:bg-gray-100"
            />
          )}

          {field.type === 'text' && (
            <input
              type="text"
              disabled
              placeholder={field.placeholder}
              className="w-full px-3 py-2 border rounded disabled:bg-gray-100"
            />
          )}

          {field.type === 'checkbox' && (
            <input
              type="checkbox"
              disabled
              className="w-4 h-4"
            />
          )}

          {field.type === 'rating' && (
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <span key={i} className="text-2xl cursor-pointer opacity-50">★</span>
              ))}
            </div>
          )}

          {field.metadata?.unit && (
            <p className="text-xs text-gray-500 mt-2">Unit: {field.metadata.unit}</p>
          )}
        </div>
      ))}
    </div>
  );
}
```

---

## Configuration & Environment

**File:** `backend/.env`

```env
# Existing vars
OPENROUTER_API_KEY=your-key
OPENROUTER_MODEL_ID=anthropic/claude-3.5-sonnet
SUPABASE_URL=your-url
SUPABASE_KEY=your-key
REDIS_URL=redis://localhost:6379

# Schema builder specific
SCHEMA_GENERATION_MODEL=anthropic/claude-3.5-sonnet
SCHEMA_GENERATION_TEMPERATURE=0.3
SCHEMA_REPAIR_MODEL=anthropic/claude-3.5-haiku  # Faster for repairs
SCHEMA_CONFIRMATION_TTL=900  # 15 minutes
```

**File:** `web/.env`

```env
VITE_SUPABASE_URL=your-url
VITE_SUPABASE_ANON_KEY=your-key
VITE_API_URL=http://localhost:8000
```

---

## Testing Checklist

- [ ] Backend endpoint accepts streaming and returns valid JSON chunks
- [ ] Frontend displays streaming chunks in real-time
- [ ] Schema validation catches common errors (missing fields, invalid types)
- [ ] Repair loop fixes malformed JSON automatically
- [ ] Redis stores and retrieves modal state correctly
- [ ] Confirmation flow persists to Supabase with audit trail
- [ ] All QC form types generate correct field structures
- [ ] Error messages are user-friendly
- [ ] TTL cleanup works (Redis expires after 15 min)

---

## Metrics to Track

- **Generation Time:** Avg time to first token, time to complete schema
- **Validation Success Rate:** % of schemas passing validation without repair
- **User Confirmation Rate:** % of users publishing without modifications
- **Field Type Accuracy:** % of fields matching intended QC operations
- **Error Rate:** % of generations requiring manual fixing

---

## Next Steps (Phase 2+)

1. **Template Library:** Pre-built schemas for common QC operations
2. **Multi-Turn Refinement:** "Add a date field" → Schema updates
3. **Conditional Logic:** Smart field visibility based on answers
4. **Historical Context:** Reference similar past schemas
5. **Collaborative Editing:** Multiple users refining schema together

