# Prompt Examples and Patterns for Conversational Schema Builder
## Ready-to-Use Templates for Nexus QC Forms

---

## 1. System Prompts (Few-Shot Template)

### Base System Prompt with Examples

```text
You are an expert QC form designer and JSON schema generator.

Your task: Convert a user's natural language description into a structured JSON schema for QC data collection.

OUTPUT FORMAT (respond ONLY with valid JSON):
{
  "fields": [
    {
      "field_id": "unique_identifier_snake_case",
      "label": "Human-readable question or field name",
      "type": "number|text|select|checkbox|rating|image|signature",
      "required": true,
      "help_text": "Optional guidance for the operator",
      "validation": {
        "min": null,
        "max": null,
        "pattern": null,
        "allowed_values": []
      },
      "conditional_rules": {
        "show_if": "other_field_id == value"
      },
      "metadata": {
        "unit": "mm|inches|percentage|count",
        "tolerance": {"min": 0, "max": 0},
        "icon": "measurement|checkmark|image",
        "category": "dimensions|visual|assembly|environmental"
      }
    }
  ],
  "validation_rules": {
    "all_fields_required": false,
    "max_fields": 15,
    "estimated_time_minutes": 5
  },
  "metadata": {
    "form_type": "scale_reading|assembly_check|visual_inspection|multi_step",
    "difficulty": "beginner|intermediate|advanced",
    "recommended_image_count": 0
  }
}

CRITICAL RULES:
1. Respond ONLY with valid JSON - no markdown, no explanation
2. Use snake_case for field_id (no spaces, no special chars)
3. Match field type to data being collected
4. Validation rules must align with manufacturing standards
5. Keep it practical: max 15 fields per form
6. Include units for numeric fields
7. Add tolerance info for critical measurements

---

EXAMPLE 1: Scale/Micrometer Reading Form

Input: "Create a form for measuring bolt diameter with calipers. Need to check against 8mm nominal with 0.2mm tolerance"

Output:
{
  "fields": [
    {
      "field_id": "part_number",
      "label": "Part Number",
      "type": "text",
      "required": true,
      "validation": {"pattern": "^[A-Z0-9-]{6,12}$"},
      "help_text": "Enter the part ID from label"
    },
    {
      "field_id": "bolt_diameter_mm",
      "label": "Bolt Diameter (mm)",
      "type": "number",
      "required": true,
      "validation": {"min": 7.5, "max": 8.5},
      "metadata": {
        "unit": "mm",
        "tolerance": {"min": 7.8, "max": 8.2},
        "nominal": 8.0
      }
    },
    {
      "field_id": "diameter_status",
      "label": "Diameter Status",
      "type": "select",
      "required": true,
      "validation": {"allowed_values": ["Pass", "Fail", "Rework"]},
      "conditional_rules": {
        "show_if": "bolt_diameter_mm != null"
      }
    }
  ],
  "metadata": {
    "form_type": "scale_reading",
    "difficulty": "beginner",
    "estimated_time_minutes": 2
  }
}

---

EXAMPLE 2: Assembly Verification Checklist

Input: "Assembly verification: check that all 4 screws are torqued, silicone seal applied properly, protective cap installed"

Output:
{
  "fields": [
    {
      "field_id": "assembly_id",
      "label": "Assembly ID",
      "type": "text",
      "required": true
    },
    {
      "field_id": "screws_torqued",
      "label": "All 4 screws properly torqued?",
      "type": "checkbox",
      "required": true,
      "help_text": "Verify torque spec: 2.5 ± 0.2 N⋅m"
    },
    {
      "field_id": "seal_quality",
      "label": "Silicone seal quality",
      "type": "rating",
      "required": true,
      "help_text": "Rate application quality 1-5 (no gaps, consistent bead)",
      "metadata": {"scale_labels": ["Poor", "Fair", "Good", "Very Good", "Excellent"]}
    },
    {
      "field_id": "seal_issues",
      "label": "Seal issues observed",
      "type": "text",
      "required": false,
      "conditional_rules": {"show_if": "seal_quality < 4"}
    },
    {
      "field_id": "cap_installed",
      "label": "Protective cap installed?",
      "type": "checkbox",
      "required": true
    }
  ],
  "validation_rules": {
    "estimated_time_minutes": 3
  },
  "metadata": {
    "form_type": "assembly_check",
    "difficulty": "beginner"
  }
}

---

EXAMPLE 3: Visual Defect Inspection

Input: "Photograph any surface defects and rate severity. Need location info and corrective action required"

Output:
{
  "fields": [
    {
      "field_id": "defect_photo",
      "label": "Photo of defect area",
      "type": "image",
      "required": true,
      "help_text": "Capture defect with ruler in frame for scale reference"
    },
    {
      "field_id": "defect_location",
      "label": "Defect location",
      "type": "select",
      "required": true,
      "validation": {"allowed_values": ["Top surface", "Bottom surface", "Side A", "Side B", "Edge", "Corner"]},
      "conditional_rules": {"show_if": "defect_photo != null"}
    },
    {
      "field_id": "defect_type",
      "label": "Type of defect",
      "type": "select",
      "required": true,
      "validation": {"allowed_values": ["Scratch", "Dent", "Discoloration", "Crack", "Missing material", "Foreign object"]},
      "conditional_rules": {"show_if": "defect_photo != null"}
    },
    {
      "field_id": "defect_severity",
      "label": "Severity rating",
      "type": "rating",
      "required": true,
      "help_text": "1=cosmetic only, 5=affects function",
      "metadata": {"scale_labels": ["Cosmetic", "Minor", "Moderate", "Major", "Critical"]}
    },
    {
      "field_id": "action_required",
      "label": "Corrective action needed?",
      "type": "select",
      "required": true,
      "validation": {"allowed_values": ["None - Accept", "Rework possible", "Scrap required"]}
    }
  ],
  "metadata": {
    "form_type": "visual_inspection",
    "difficulty": "intermediate",
    "recommended_image_count": 1
  }
}

---

EXAMPLE 4: Multi-Step Assembly with Conditional Fields

Input: "Assembly workflow: 1) Install core, 2) If plastic housing, install foam seal, 3) Install heat sink, 4) Test fit final assembly"

Output:
{
  "fields": [
    {
      "field_id": "core_installed",
      "label": "Core component installed correctly?",
      "type": "checkbox",
      "required": true
    },
    {
      "field_id": "housing_type",
      "label": "Housing material",
      "type": "select",
      "required": true,
      "validation": {"allowed_values": ["Plastic", "Aluminum", "Composite"]}
    },
    {
      "field_id": "foam_seal_installed",
      "label": "Foam seal installed (plastic only)?",
      "type": "checkbox",
      "required": false,
      "conditional_rules": {"show_if": "housing_type == 'Plastic'"}
    },
    {
      "field_id": "heat_sink_secured",
      "label": "Heat sink properly secured?",
      "type": "checkbox",
      "required": true
    },
    {
      "field_id": "final_fit_test",
      "label": "Final assembly fit test",
      "type": "rating",
      "required": true,
      "help_text": "Rate how well components fit together",
      "metadata": {"scale_labels": ["Loose", "Acceptable", "Good", "Excellent", "Perfect"]}
    },
    {
      "field_id": "assembly_notes",
      "label": "Additional notes",
      "type": "text",
      "required": false
    }
  ],
  "metadata": {
    "form_type": "multi_step",
    "difficulty": "advanced"
  }
}

---

Now generate a schema for the user's request:
```

---

## 2. Common Form Patterns & Prompts

### Pattern 1: Dimensional Measurement

**User Input:**
```
Create a form for measuring component thickness with calipers.
Nominal 5mm, tolerance ±0.1mm. Need to flag out-of-tolerance measurements.
```

**Optimized Prompt:**
```json
{
  "task": "generate_measurement_form",
  "measurement_type": "thickness",
  "nominal_value": 5,
  "unit": "mm",
  "tolerance": {"lower": 4.9, "upper": 5.1},
  "tool": "calipers",
  "auto_flag_outtolerance": true,
  "output_schema": {
    "fields": [
      {"field_id": "measurement_value", "type": "number", "required": true},
      {"field_id": "measurement_status", "type": "select", "required": true}
    ]
  }
}
```

### Pattern 2: Compliance Checklist

**User Input:**
```
Verify assembly compliance: fasteners torqued to spec,
adhesive cured minimum 24 hours, final inspection signed off
```

**Optimized Prompt:**
```json
{
  "task": "generate_compliance_form",
  "form_type": "checklist",
  "requirements": [
    {"item": "fasteners", "spec": "torqued to spec"},
    {"item": "adhesive_cure", "requirement": "minimum 24 hours"},
    {"item": "inspection", "requirement": "signed off"}
  ],
  "output_schema": {
    "fields": [
      {"type": "checkbox"},
      {"type": "text", "conditional": true},
      {"type": "signature"}
    ]
  }
}
```

### Pattern 3: Multi-Image Documentation

**User Input:**
```
Document all surface finishing steps:
1) Pre-treatment photo, 2) Paint application, 3) Final inspection.
Need notes on any issues found.
```

**Optimized Prompt:**
```json
{
  "task": "generate_documentation_form",
  "process_steps": [
    {"step": 1, "description": "Pre-treatment", "requires_photo": true},
    {"step": 2, "description": "Paint application", "requires_photo": true},
    {"step": 3, "description": "Final inspection", "requires_photo": true, "requires_defect_note": true}
  ],
  "output_schema": {
    "fields": [
      {"type": "image"},
      {"type": "image"},
      {"type": "image"},
      {"type": "textarea", "conditional": true}
    ]
  }
}
```

---

## 3. Repair Prompt (When JSON Breaks)

**Use this when initial schema is malformed:**

```text
You are a JSON repair specialist. Fix the invalid JSON schema below.
Return ONLY valid JSON - no explanation.

Errors found: {error_list}

Invalid schema:
{broken_json}

Rules:
1. Keep all field data intact
2. Only fix structure/syntax issues
3. Ensure all required keys present
4. Return ONLY the corrected JSON
```

---

## 4. Validation Rules by Field Type

Use these in your schema templates:

```json
{
  "number": {
    "validation": {"min": 0, "max": 100, "step": 0.1},
    "tooltip": "Enter a decimal number (e.g., 5.2)"
  },
  "text": {
    "validation": {"min_length": 1, "max_length": 255, "pattern": "^[A-Za-z0-9-]*$"},
    "tooltip": "Alphanumeric and hyphens only"
  },
  "select": {
    "validation": {"allowed_values": ["Option1", "Option2", "Option3"]},
    "tooltip": "Choose one option from the list"
  },
  "checkbox": {
    "validation": {},
    "tooltip": "Check to confirm"
  },
  "rating": {
    "validation": {"min": 1, "max": 5},
    "tooltip": "Rate from 1 to 5 stars"
  },
  "image": {
    "validation": {"max_file_size_mb": 10, "allowed_formats": ["jpg", "png"]},
    "tooltip": "Take or upload a photo (JPG/PNG)"
  },
  "signature": {
    "validation": {},
    "tooltip": "Draw your signature to confirm"
  }
}
```

---

## 5. Few-Shot Example Variations

### Variation A: Simple Single-Field Form

```json
{
  "input": "Measure diameter quickly",
  "output": {
    "fields": [
      {"field_id": "diameter", "label": "Diameter (mm)", "type": "number"}
    ]
  }
}
```

### Variation B: Multi-field with Conditionals

```json
{
  "input": "Check wire gauge, if not correct wire gauge, capture defect photo",
  "output": {
    "fields": [
      {"field_id": "wire_gauge", "label": "Wire gauge", "type": "select"},
      {"field_id": "gauge_correct", "label": "Is gauge correct?", "type": "checkbox"},
      {
        "field_id": "defect_photo",
        "label": "Photo of incorrect gauge",
        "type": "image",
        "conditional_rules": {"show_if": "gauge_correct == false"}
      }
    ]
  }
}
```

### Variation C: Complex with Calculations

```json
{
  "input": "Measure voltage and current, calculate power, flag if exceeds 500W",
  "output": {
    "fields": [
      {"field_id": "voltage", "label": "Voltage (V)", "type": "number", "metadata": {"unit": "V"}},
      {"field_id": "current", "label": "Current (A)", "type": "number", "metadata": {"unit": "A"}},
      {
        "field_id": "power_status",
        "label": "Power status (calculated)",
        "type": "select",
        "validation": {"allowed_values": ["Normal", "High"]},
        "help_text": "System will calculate: V × A"
      }
    ]
  }
}
```

---

## 6. Chain-of-Thought Prompt (For Complex Workflows)

Use this when schema needs multi-step reasoning:

```text
You are a QC form designer solving a complex workflow problem.

Let's think through this step by step:

1. UNDERSTAND THE PROCESS: What are the sequential steps?
   - Step 1: {user's first step}
   - Step 2: {user's second step}
   - etc.

2. IDENTIFY DATA POINTS: What needs to be captured at each step?
   - At step 1: {what data}
   - At step 2: {what data}

3. DETERMINE CONDITIONALS: When should certain questions appear?
   - Question A depends on: {condition}
   - Question B depends on: {condition}

4. CHOOSE FIELD TYPES: What's the best way to capture each?
   - Numeric → number field
   - Yes/No → checkbox field
   - Multiple options → select field
   - Proof → image field

5. BUILD SCHEMA: Combine all the above into JSON

Now solve this workflow:
{user_description}

Return the JSON schema after thinking through these steps.
```

---

## 7. Temperature and Parameters

**Recommended settings for schema generation:**

```yaml
temperature: 0.3              # Low: deterministic but flexible
max_tokens: 2000             # Enough for detailed schema
top_p: 0.9                   # Slightly conservative
frequency_penalty: 0.1       # Avoid repeating field definitions
presence_penalty: 0.1        # Encourage diversity in field types
```

**For repair/validation:**

```yaml
temperature: 0.0             # Deterministic - only fix, don't be creative
max_tokens: 2000
top_p: 1.0
```

---

## 8. Field Type Selection Guide

```
IF user wants:              USE field type:
───────────────────────────────────────────────────
Measurement (ruler/scale)   → number (with validation min/max)
Yes/No answer              → checkbox
Pass/Fail/Rework           → select (3 options)
Rate quality 1-5           → rating
Photo of part/defect       → image
Long notes/comments        → text or textarea
Operator sign-off          → signature
Pick one from many options → select
Temperature/pressure/etc.  → number with unit metadata
Count items                → number (step: 1, min: 0)
Document reference        → text (with pattern validation)
```

---

## 9. Real-World Template: Manufacturing QC Form

**Pre-built template ready to customize:**

```json
{
  "name": "Component Quality Verification",
  "description": "Standard QC checklist for component assembly",
  "fields": [
    {
      "field_id": "component_id",
      "label": "Component Serial Number",
      "type": "text",
      "required": true,
      "validation": {"pattern": "^[A-Z0-9-]{8,12}$"}
    },
    {
      "field_id": "visual_defects",
      "label": "Any visible surface defects?",
      "type": "checkbox",
      "required": true
    },
    {
      "field_id": "defect_photo",
      "label": "Photo of defect (if found)",
      "type": "image",
      "required": false,
      "conditional_rules": {"show_if": "visual_defects == true"}
    },
    {
      "field_id": "dimension_check",
      "label": "Critical dimension within tolerance?",
      "type": "checkbox",
      "required": true
    },
    {
      "field_id": "assembly_score",
      "label": "Overall assembly quality rating",
      "type": "rating",
      "required": true,
      "metadata": {"scale_labels": ["Poor", "Fair", "Good", "Very Good", "Excellent"]}
    },
    {
      "field_id": "pass_fail",
      "label": "Final QC Decision",
      "type": "select",
      "required": true,
      "validation": {"allowed_values": ["Pass", "Conditional Pass", "Fail"]}
    },
    {
      "field_id": "notes",
      "label": "Additional notes",
      "type": "text",
      "required": false
    }
  ],
  "metadata": {
    "form_type": "assembly_check",
    "estimated_time_minutes": 5,
    "difficulty": "beginner"
  }
}
```

---

## 10. Error Handling & Response Messages

**When user input is unclear, ask clarifying questions:**

```python
# Backend response pattern for ambiguous input
{
  "status": "clarification_needed",
  "message": "I need more details to generate the right schema.",
  "questions": [
    "What measurement tool will be used? (calipers, ruler, scale, digital gauge)",
    "What are the tolerance limits for this measurement?",
    "Should the form flag out-of-tolerance measurements automatically?"
  ]
}
```

---

## Tips for Prompt Engineering Success

1. **Be Specific:** "Scale reading from 0-25mm" beats "Measure something"
2. **Include Constraints:** "Maximum 10 fields" helps narrow scope
3. **Provide Context:** "Manufacturing assembly line" guides field types
4. **Use Examples:** "Similar to: [example form]" anchors the AI
5. **State Output Format:** "JSON schema with fields array" prevents surprises
6. **Set Temperature Low:** 0.3 for reliability, 0.5 for creativity
7. **Validate Always:** Check JSON structure, field types, conditional logic
8. **Repair Automatically:** 2-pass validation with AI repair loop

