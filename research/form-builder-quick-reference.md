# Form Builder Libraries - Quick Reference Guide

## Quick Comparison Table

| Library | Type | Cost | React | Learning Curve | Best For |
|---------|------|------|-------|-----------------|----------|
| **React Hook Form** | Headless | Free | Yes | Very Low | Any form, any UI |
| **TanStack Form** | Headless | Free | Framework-agnostic | Low | Type-safe forms |
| **react-jsonschema-form (RJSF)** | Schema-Driven | Free | Yes | Low | Dynamic forms |
| **SurveyJS** | Full-Stack | $530/yr (Creator) | Multi | Medium | Fast deployment |
| **Formily** | Schema-Driven | Free | Multi | Medium | Enterprise forms |
| **Form.io** | Full-Stack | $600-900/mo | Multi | Medium | Comprehensive platform |
| **shadcn-form-builder** | Hybrid | Free | Yes | Medium | shadcn/ui specific |

---

## For Nexus: Recommended Stack

```
┌─────────────────────────────────────────┐
│        QC Schema Definition             │
│  (JSON in Supabase, visual builder TBD) │
└────────────────────┬────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────┐
│     Schema Validation (AJV + Zod)       │
│  - JSON Schema Draft 7 compliance        │
│  - Type-safe validation                 │
└────────────────────┬────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────┐
│     Form Rendering (React Hook Form)    │
│  - Uncontrolled inputs                  │
│  - Minimal re-renders                   │
│  - Zod integration                      │
└────────────────────┬────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────┐
│    UI Components (shadcn/ui)            │
│  - Form, FormField, Input, Select, etc. │
│  - Tailwind CSS styling                 │
│  - Radix UI accessibility               │
└────────────────────┬────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────┐
│    Confirmation Modal (existing)        │
│  - Human-in-the-loop approval           │
│  - Data persistence to Supabase         │
└─────────────────────────────────────────┘
```

---

## JSON Schema Examples for QC

### Example 1: Simple Scale Reading Form

```json
{
  "type": "object",
  "title": "Scale Reading QC",
  "properties": {
    "scale_id": {
      "type": "string",
      "title": "Scale ID",
      "description": "Unique identifier of the scale"
    },
    "reading_value": {
      "type": "number",
      "title": "Reading (kg)",
      "minimum": 0,
      "maximum": 999.99,
      "multipleOf": 0.01
    },
    "quality_status": {
      "type": "string",
      "enum": ["pass", "fail", "recheck"],
      "title": "Quality Status"
    },
    "notes": {
      "type": "string",
      "title": "Additional Notes",
      "maxLength": 500
    }
  },
  "required": ["scale_id", "reading_value", "quality_status"]
}
```

### Example 2: Complex Multi-Step Inspection Form

```json
{
  "type": "object",
  "title": "Product Quality Inspection",
  "properties": {
    "batch_id": {
      "type": "string",
      "title": "Batch Number"
    },
    "inspection_type": {
      "type": "string",
      "enum": ["visual", "dimensional", "functional"],
      "title": "Inspection Type"
    },
    "visual_check": {
      "type": "object",
      "title": "Visual Inspection",
      "properties": {
        "surface_defects": {
          "type": "boolean",
          "title": "Surface Defects Detected?"
        },
        "color_match": {
          "type": "string",
          "enum": ["perfect", "acceptable", "reject"],
          "title": "Color Match"
        }
      },
      "required": ["surface_defects", "color_match"]
    },
    "dimensional_check": {
      "type": "object",
      "title": "Dimensional Inspection",
      "properties": {
        "length_mm": {
          "type": "number",
          "title": "Length (mm)",
          "minimum": 99,
          "maximum": 101
        },
        "width_mm": {
          "type": "number",
          "title": "Width (mm)",
          "minimum": 49,
          "maximum": 51
        },
        "tolerance_pass": {
          "type": "boolean",
          "title": "Tolerances Met?"
        }
      }
    },
    "final_status": {
      "type": "string",
      "enum": ["approved", "rejected", "rework_needed"],
      "title": "Final QC Status"
    }
  },
  "required": ["batch_id", "inspection_type", "final_status"],
  "dependentRequired": {
    "inspection_type": {
      "visual": ["visual_check"],
      "dimensional": ["dimensional_check"]
    }
  }
}
```

### Example 3: Conditional Fields (Show/Hide)

```json
{
  "type": "object",
  "title": "Defect Assessment",
  "properties": {
    "defect_found": {
      "type": "boolean",
      "title": "Defect Found?"
    },
    "defect_severity": {
      "type": "string",
      "enum": ["minor", "major", "critical"],
      "title": "Severity Level",
      "description": "Only shown if defect_found is true"
    },
    "root_cause": {
      "type": "string",
      "title": "Root Cause",
      "description": "Only shown if severity is 'major' or 'critical'"
    },
    "corrective_action": {
      "type": "string",
      "title": "Corrective Action",
      "description": "Required if severity is 'critical'"
    }
  },
  "required": ["defect_found"]
}
```

**UISchema for Conditional Rendering** (RJSF extension):
```json
{
  "ui:field": "conditionalDisplay",
  "conditions": {
    "defect_severity": {
      "when": "defect_found",
      "equals": true
    },
    "root_cause": {
      "when": "defect_severity",
      "in": ["major", "critical"]
    },
    "corrective_action": {
      "when": "defect_severity",
      "equals": "critical"
    }
  }
}
```

---

## Installation & Setup

### Phase 1: Core Libraries

```bash
# Frontend
cd web
npm install react-hook-form zod @hookform/resolvers @rjsf/core @rjsf/validator-ajv8

# Backend
cd ../backend
uv add jsonschema pydantic-extra-types

# New dependencies
npm install ajv  # for JSON Schema validation
```

### Phase 2: Custom Theme (Optional)

For RJSF with shadcn/ui, create custom field components:

```bash
npm install @rjsf/validator-ajv8  # if not done in Phase 1
```

---

## Code Templates

### Template 1: RJSF with shadcn/ui (Recommended)

**File**: `web/src/components/QCFormRenderer.tsx`

```typescript
import React from 'react'
import Form from '@rjsf/core'
import { RJSFSchema } from '@rjsf/utils'
import validator from '@rjsf/validator-ajv8'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { AlertCircle } from 'lucide-react'

interface QCFormRendererProps {
  schema: RJSFSchema
  initialData?: any
  onSubmit: (data: any) => Promise<void>
  loading?: boolean
}

/**
 * Renders QC forms from JSON schemas
 * Supports validation, conditional fields, and custom styling
 */
export function QCFormRenderer({
  schema,
  initialData,
  onSubmit,
  loading = false,
}: QCFormRendererProps) {
  const [error, setError] = React.useState<string | null>(null)
  const [formData, setFormData] = React.useState(initialData || {})

  const handleSubmit = async ({ formData: submittedData }: any) => {
    try {
      setError(null)
      await onSubmit(submittedData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed')
    }
  }

  return (
    <Card className="w-full p-6">
      {error && (
        <div className="mb-4 flex gap-2 rounded-md bg-red-50 p-4 text-red-700">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <Form
        schema={schema}
        validator={validator}
        formData={formData}
        onChange={({ formData: newData }) => setFormData(newData)}
        onSubmit={handleSubmit}
        // Custom templates can go here
      >
        <div className="mt-6 flex gap-3">
          <Button type="submit" disabled={loading}>
            {loading ? 'Submitting...' : 'Submit QC Data'}
          </Button>
          <Button
            type="reset"
            variant="outline"
            onClick={() => setFormData(initialData || {})}
          >
            Reset
          </Button>
        </div>
      </Form>
    </Card>
  )
}
```

---

### Template 2: React Hook Form with shadcn/ui

**File**: `web/src/components/QCFormWithHookForm.tsx`

```typescript
import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'

// Example QC schema as Zod
const QCFormSchema = z.object({
  scaleId: z.string().min(1, 'Scale ID required'),
  reading: z.number().min(0).max(999.99),
  status: z.enum(['pass', 'fail', 'recheck']),
  notes: z.string().max(500).optional(),
})

type QCFormData = z.infer<typeof QCFormSchema>

interface QCFormWithHookFormProps {
  onSubmit: (data: QCFormData) => Promise<void>
  loading?: boolean
}

export function QCFormWithHookForm({
  onSubmit,
  loading = false,
}: QCFormWithHookFormProps) {
  const form = useForm<QCFormData>({
    resolver: zodResolver(QCFormSchema),
    defaultValues: {
      scaleId: '',
      reading: 0,
      status: 'pass',
      notes: '',
    },
  })

  const handleSubmit = async (data: QCFormData) => {
    try {
      await onSubmit(data)
      form.reset()
    } catch (error) {
      form.setError('root', {
        message: error instanceof Error ? error.message : 'Submission failed',
      })
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="scaleId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Scale ID</FormLabel>
              <FormControl>
                <Input placeholder="e.g., SCALE-001" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="reading"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Reading (kg)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  {...field}
                  onChange={(e) => field.onChange(parseFloat(e.target.value))}
                />
              </FormControl>
              <FormDescription>Between 0 and 999.99</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Quality Status</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="pass">Pass</SelectItem>
                  <SelectItem value="fail">Fail</SelectItem>
                  <SelectItem value="recheck">Recheck</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes (Optional)</FormLabel>
              <FormControl>
                <Textarea placeholder="Additional comments..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {form.formState.errors.root && (
          <div className="text-sm text-red-600">
            {form.formState.errors.root.message}
          </div>
        )}

        <Button type="submit" disabled={loading}>
          {loading ? 'Submitting...' : 'Submit QC Data'}
        </Button>
      </form>
    </Form>
  )
}
```

---

### Template 3: Schema Validation (Backend)

**File**: `backend/app/services/schema_service.py`

```python
from jsonschema import validate, ValidationError, Draft7Validator
from jsonschema.exceptions import SchemaError
from pydantic import BaseModel, validator
from typing import Any, Dict
import json

class SchemaValidator:
    """Validates JSON schemas and form data against schemas"""

    @staticmethod
    def validate_schema(schema: Dict[str, Any]) -> bool:
        """
        Validates that a schema is valid JSON Schema Draft 7
        Raises SchemaError if invalid
        """
        try:
            Draft7Validator.check_schema(schema)
            return True
        except SchemaError as e:
            raise ValueError(f"Invalid schema: {e.message}")

    @staticmethod
    def validate_data(data: Any, schema: Dict[str, Any]) -> bool:
        """
        Validates form data against a schema
        Raises ValidationError if data doesn't match schema
        """
        try:
            validate(instance=data, schema=schema)
            return True
        except ValidationError as e:
            raise ValueError(f"Data validation failed: {e.message}")

    @staticmethod
    def get_validation_errors(data: Any, schema: Dict[str, Any]) -> list[str]:
        """
        Returns list of all validation errors without raising
        """
        validator = Draft7Validator(schema)
        return [f"{'.'.join(str(x) for x in err.path)}: {err.message}"
                for err in validator.iter_errors(data)]


class QCSchema(BaseModel):
    """Database model for QC schemas"""
    id: str
    name: str
    description: str
    json_schema: Dict[str, Any]
    ui_schema: Dict[str, Any] = {}  # Optional RJSF UI customization
    created_by: str
    created_at: str

    @validator('json_schema')
    def validate_schema(cls, v):
        SchemaValidator.validate_schema(v)
        return v


# Usage in API endpoint
from fastapi import HTTPException

async def validate_qc_submission(schema_id: str, data: Dict, db):
    """
    Validates QC submission against stored schema
    """
    # Fetch schema from Supabase
    schema = await db.fetch_schema(schema_id)
    if not schema:
        raise HTTPException(status_code=404, detail="Schema not found")

    # Validate data
    errors = SchemaValidator.get_validation_errors(data, schema['json_schema'])
    if errors:
        raise HTTPException(
            status_code=422,
            detail={"validation_errors": errors}
        )

    return True
```

---

### Template 4: Simple Code-Based Schema Editor

**File**: `web/src/components/SchemaEditor.tsx`

```typescript
import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, CheckCircle2 } from 'lucide-react'

interface SchemaEditorProps {
  onSave: (schema: any) => Promise<void>
  initialSchema?: any
}

export function SchemaEditor({ onSave, initialSchema }: SchemaEditorProps) {
  const [schemaText, setSchemaText] = useState(
    JSON.stringify(initialSchema || {}, null, 2)
  )
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState<any | null>(null)

  const handleValidate = () => {
    try {
      setError(null)
      setSuccess(false)

      // Parse JSON
      const parsed = JSON.parse(schemaText)

      // Basic validation
      if (!parsed.type) {
        throw new Error('Schema must have a "type" property')
      }
      if (!parsed.title) {
        throw new Error('Schema must have a "title" property')
      }
      if (!parsed.properties) {
        throw new Error('Schema must have a "properties" object')
      }

      setPreview(parsed)
      setSuccess(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid JSON')
      setPreview(null)
    }
  }

  const handleSave = async () => {
    if (!preview) {
      handleValidate()
      return
    }

    setLoading(true)
    try {
      await onSave(preview)
      setSuccess(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Editor Panel */}
      <Card className="p-4">
        <h3 className="mb-2 font-semibold">Schema JSON</h3>
        <Textarea
          value={schemaText}
          onChange={(e) => {
            setSchemaText(e.target.value)
            setSuccess(false)
            setError(null)
          }}
          placeholder="Paste your JSON Schema here..."
          className="font-mono text-sm"
          rows={20}
        />

        <div className="mt-4 flex gap-2">
          <Button
            onClick={handleValidate}
            variant="outline"
            size="sm"
          >
            Validate
          </Button>
          <Button
            onClick={handleSave}
            disabled={!preview || loading}
            size="sm"
          >
            {loading ? 'Saving...' : 'Save Schema'}
          </Button>
        </div>

        {error && (
          <Alert className="mt-4 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-600">{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mt-4 border-green-200 bg-green-50">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-600">
              Schema is valid
            </AlertDescription>
          </Alert>
        )}
      </Card>

      {/* Preview Panel */}
      <Card className="p-4">
        <h3 className="mb-2 font-semibold">Preview</h3>
        {preview ? (
          <div className="space-y-4 overflow-auto max-h-96">
            <div>
              <h4 className="font-mono text-sm font-bold">{preview.title}</h4>
              <p className="text-xs text-gray-600">{preview.description}</p>
            </div>

            <div>
              <p className="mb-2 text-sm font-semibold">Fields:</p>
              {Object.entries(preview.properties || {}).map(([key, prop]: any) => (
                <div key={key} className="mb-2 rounded bg-gray-50 p-2 text-sm">
                  <div className="font-mono font-bold">{key}</div>
                  <div className="text-xs text-gray-600">{prop.title}</div>
                  <div className="text-xs text-gray-500">type: {prop.type}</div>
                  {prop.description && (
                    <div className="text-xs text-gray-500">{prop.description}</div>
                  )}
                </div>
              ))}
            </div>

            <div>
              <p className="mb-1 text-sm font-semibold">Required Fields:</p>
              <p className="text-xs text-gray-600">
                {preview.required?.join(', ') || 'None'}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-500">Validate schema to see preview</p>
        )}
      </Card>
    </div>
  )
}
```

---

## Decision Tree: Which Solution to Use?

```
Does your form definition need to be dynamic/user-configurable?
│
├─ NO → React Hook Form + Zod + shadcn/ui ✓ (Build in component code)
│
└─ YES → Store as JSON Schema
        │
        ├─ Will non-technical users design forms?
        │
        ├─ NO → RJSF + custom code-based editor ✓ (Developers only)
        │
        └─ YES → Need visual builder?
               │
               ├─ Budget < $1k → Custom React builder (4-6 weeks) ✓
               │
               └─ Budget > $1k → SurveyJS Creator ($530/yr) ✓
```

---

## Testing Checklist

### Schema Validation Testing
- [ ] Valid schema passes validation
- [ ] Missing required fields rejected
- [ ] Type mismatches rejected
- [ ] Conditional logic works correctly
- [ ] Enum values validated
- [ ] Min/max constraints enforced
- [ ] Pattern matching works

### Form Rendering Testing
- [ ] All field types render correctly
- [ ] Validation errors display properly
- [ ] Disabled fields don't submit
- [ ] Conditional fields show/hide based on logic
- [ ] Initial data loads correctly
- [ ] Form resets properly

### Accessibility Testing
- [ ] Tab order is logical
- [ ] Labels properly associated with inputs
- [ ] Error messages announced by screen readers
- [ ] Color contrast meets WCAG AA
- [ ] Keyboard navigation works fully

### Performance Testing
- [ ] Form with 50+ fields renders in < 500ms
- [ ] Form interactions feel responsive (< 100ms)
- [ ] Validation doesn't cause lag
- [ ] Large schema loads without blocking

---

## Troubleshooting Guide

### Problem: RJSF not rendering custom field types
**Solution**: Check field type spelling matches schema. Create custom FieldTemplate if type not supported.

### Problem: Conditional fields not showing/hiding
**Solution**: Use `dependentRequired` in JSON Schema, or implement custom conditional logic wrapper.

### Problem: Form validation not triggering
**Solution**: Ensure validator instance is passed to Form component. Check schema syntax in browser console.

### Problem: Performance issues with large forms
**Solution**: Implement field-level lazy rendering. Use `virtualization` for lists. Profile with React DevTools.

### Problem: shadcn/ui components not styled correctly in form
**Solution**: Ensure Tailwind CSS is configured. Check class name conflicts. Use `cn()` utility for class merging.

---

## Resources & Links

**Official Documentation**:
- React Hook Form: https://react-hook-form.com
- RJSF: https://rjsf-team.github.io/react-jsonschema-form
- SurveyJS: https://surveyjs.io/documentation
- shadcn/ui: https://ui.shadcn.com

**JSON Schema**:
- Official Specification: https://json-schema.org
- JSON Schema Validator: https://www.jsonschemavalidator.net

**Validation Libraries**:
- Zod: https://zod.dev
- AJV: https://ajv.js.org
- Yup: https://github.com/jquense/yup

**Example Repositories**:
- RJSF Examples: https://github.com/rjsf-team/react-jsonschema-form/tree/master/packages/playground
- shadcn Form Examples: https://github.com/shadcn-ui/ui/blob/main/apps/www/content/docs/components/form.mdx

---

**Last Updated**: January 16, 2026
**For**: Nexus QC System
**Next Review**: After Phase 1 completion
