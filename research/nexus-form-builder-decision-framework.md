# Nexus Form Builder: Implementation Decision Framework

**Document Purpose**: Guide technical decision-making for Nexus schema/form builder implementation
**Audience**: Engineering team, product leads
**Decision Date**: January 2026
**Implementation Window**: Q1 2026

---

## Executive Summary

**RECOMMENDED APPROACH**: Phase 1 MVP using RJSF + React Hook Form + shadcn/ui with code-based schema editor

**Expected Outcomes**:
- Form rendering capability within 2-3 weeks
- Complete MVP in 3-4 weeks
- Cost: ~$10-15k engineering time
- Zero licensing fees
- Full integration with existing Nexus stack
- Clear upgrade path to visual builder (Phase 2)

**Success Criteria**:
- Supervisors can define QC forms in JSON within 15 minutes using templates
- 100% data validation at submission time
- WCAG AA accessibility compliance
- < 1 second schema change propagation
- Conditional field logic works reliably

---

## Core Context: Why Nexus Needs This

### Problem Statement
The Nexus QC system currently has hardcoded form fields:
- Scale weight reading
- Quality status selection
- Optional notes

**Limitation**: Each new QC scenario (temperature reading, dimensional measurement, visual inspection) requires code changes and redeployment.

### Desired Future State
Supervisors should be able to:
1. Define new QC form templates (schema)
2. Configure validation rules
3. Set up conditional field visibility
4. Customize for their facility's procedures
5. Deploy without code changes

### Business Impact
- **Time Savings**: 2-4 hours/week per supervisor (vs. requesting dev changes)
- **Agility**: Deploy new procedures in minutes, not sprints
- **Data Quality**: Schema-enforced validation prevents bad QC data
- **Compliance**: Audit trail of schema versions linked to submissions

---

## Technical Architecture Decision

### Current Flow (Hardcoded)

```
Operator Voice/Image → Backend Agno Agent
                       ↓
                     Extract Data
                       ↓
                    Show Modal (Hardcoded Form)
                       ↓
                  Supervisor Confirms
                       ↓
              Persist to Supabase + Audit
```

### Proposed Flow (Schema-Driven)

```
Define Schema              Use Schema
    ↓                          ↓
Supabase                   Operator Voice/Image
schemas table              → Backend Agno Agent
    ↓                          ↓
Schema Cache              Fetch Schema from Cache
(Redis)                        ↓
    ↓                       Extract Data
  ↓                            ↓
Frontend                   Render Form from Schema
Render Form             (RJSF + React Hook Form)
from Schema                    ↓
                        Show Modal (Dynamic Form)
                               ↓
                      Supervisor Confirms
                               ↓
                  Persist to Supabase + Audit
```

### Key Components

| Component | Technology | Purpose | Status |
|-----------|-----------|---------|--------|
| Schema Storage | Supabase PostgreSQL | Persist form definitions | New |
| Schema Editor | React + shadcn/ui | Allow supervisors to create/edit schemas | New |
| Form Renderer | RJSF + React Hook Form | Display forms from schemas | New |
| Validation | AJV + Zod | Validate form data and schemas | New |
| Schema Cache | Redis | Fast schema lookup (optional, Phase 2) | Future |
| Visual Builder | Custom React builder | Drag-drop schema designer | Future |

---

## Technology Selection Matrix

### Evaluation Criteria

1. **Integration Fit** (Weight: 30%)
   - Works with existing stack (React, TypeScript, Tailwind, shadcn/ui)
   - Compatible with Supabase backend
   - Compatible with Agno agent for extraction

2. **Time to Market** (Weight: 25%)
   - Can be implemented in 2-4 weeks
   - Minimal learning curve for team
   - Existing examples/documentation

3. **Flexibility** (Weight: 20%)
   - Supports QC-specific features (conditional logic, custom validation)
   - Allows future customization
   - Doesn't create vendor lock-in

4. **Maintenance** (Weight: 15%)
   - Low ongoing burden
   - Active community/support
   - Low dependency risks

5. **Cost** (Weight: 10%)
   - Minimal licensing fees
   - Predictable engineering costs
   - Clear ROI

### Scoring Results

| Solution | Integration | Time | Flexibility | Maintenance | Cost | **Total** |
|----------|-------------|------|-------------|-------------|------|----------|
| **RJSF + React Hook Form (RECOMMENDED)** | 9/10 | 9/10 | 8/10 | 9/10 | 10/10 | **8.8/10** ✓ |
| SurveyJS Creator | 7/10 | 8/10 | 9/10 | 7/10 | 7/10 | 7.4/10 |
| Form.io | 5/10 | 7/10 | 8/10 | 6/10 | 3/10 | 5.8/10 |
| Formily | 6/10 | 7/10 | 8/10 | 6/10 | 9/10 | 6.9/10 |
| Custom React Builder | 10/10 | 4/10 | 10/10 | 5/10 | 6/10 | 6.6/10 |

---

## Detailed Recommendation: RJSF + React Hook Form

### Why This Approach

#### Strengths
1. **Perfect Stack Alignment**
   - RJSF: React-native, TypeScript-friendly, no framework assumptions
   - React Hook Form: De facto standard for React forms (1.2M developers)
   - shadcn/ui: Copy-paste component system, Tailwind-based, fully customizable
   - Zod: Type-safe validation, works seamlessly with React Hook Form

2. **Proven at Scale**
   - RJSF: 14.6k GitHub stars, used by Mozilla, Netflix, Uber
   - React Hook Form: 42.6k GitHub stars, used by Shopify, Stripe, Meta
   - Community support is excellent; solutions exist for all common problems

3. **Developer Experience**
   - Minimal boilerplate
   - Excellent TypeScript support
   - Familiar patterns (React developers feel comfortable immediately)
   - Can gradually add complexity

4. **Flexibility for QC Domain**
   - JSON Schema is industry standard (IETF RFC)
   - Supports complex validation logic (min/max, enum, patterns)
   - Extensible for custom QC validations
   - Can be extended with custom field types easily

5. **Cost Efficiency**
   - No licensing fees (all MIT)
   - Leverage existing React skill set (no new framework to learn)
   - No vendor lock-in (can switch tools later if needed)

#### Limitations
1. No built-in visual drag-drop builder
   - **Mitigation**: Start with code-based JSON editor (simple), upgrade to visual builder in Phase 2
2. Requires developer knowledge for initial setup
   - **Mitigation**: Provide templates for common QC scenarios
3. Less hand-holding than SurveyJS for complex forms
   - **Mitigation**: Document custom validations, provide examples

---

## Implementation Phases

### Phase 1: MVP (Weeks 1-3) - Code-Based Schema

**Goal**: Get schema-driven forms working with code-based schema editor

**Deliverables**:
- [ ] Schema database table + CRUD API
- [ ] JSON Schema validator (backend)
- [ ] Form renderer component (RJSF + shadcn/ui)
- [ ] Code-based schema editor (textarea + validator)
- [ ] Integration with existing confirmation modal
- [ ] Documentation & templates for supervisors

**Engineering Effort**: ~80 hours (2 engineers, 2 weeks)

**User Experience**:
```
Supervisor opens admin panel
  ↓
Click "Create QC Schema"
  ↓
Paste/edit JSON schema
  ↓
Click "Validate & Preview"
  ↓
See form rendered live
  ↓
Click "Save Schema"
  ↓
Schema available for new QC submissions
```

**Success Metrics**:
- ✓ Can define schema in < 15 minutes with template
- ✓ Schema validates before save
- ✓ Live preview shows exact form that operators will see
- ✓ Form renders in < 500ms for schemas with 10-20 fields
- ✓ All validations working (required, min/max, enum, regex)

**Example Template for Phase 1**:
```json
{
  "type": "object",
  "title": "Your QC Form Name",
  "description": "Description shown to operators",
  "properties": {
    "field_name": {
      "type": "string",
      "title": "Field Label",
      "description": "Help text for operator"
    }
  },
  "required": ["field_name"]
}
```

**Risk Mitigation**:
- Supervisors must be somewhat technical (require JSON understanding)
  - **Mitigation**: Provide 5-10 pre-made templates covering common QC scenarios
- Complex conditional logic hard to author in JSON
  - **Mitigation**: Document common patterns, provide examples

---

### Phase 2: Visual Builder (Weeks 4-8, Future) - Drag-Drop Designer

**Goal**: Enable non-technical supervisors to design schemas visually

**Deliverables**:
- [ ] Drag-drop form builder UI (custom React component)
- [ ] Visual field configuration panel
- [ ] Conditional logic builder (visual "if-then" rules)
- [ ] Real-time form preview
- [ ] Auto-generate JSON schema from visual design
- [ ] Migration path from Phase 1 (code) to Phase 2 (visual)

**Engineering Effort**: ~120 hours (2 engineers, 4-6 weeks)

**User Experience**:
```
Supervisor opens schema designer
  ↓
Click "Add Field"
  ↓
Drag field type to canvas
  ↓
Configure in side panel (label, validation, required, etc.)
  ↓
Add conditional rules ("Show this field if...")
  ↓
Live preview updates in real-time
  ↓
Click "Save"
  ↓
JSON schema auto-generated and stored
```

**Options for Phase 2**:
1. **Custom React Builder** (Recommended)
   - ~120 hours dev, full control, perfect fit

2. **SurveyJS Creator** (Alternative)
   - ~40 hours integration, $530/year license
   - Less control but faster deployment

3. **Third-party Integration** (Not recommended)
   - Would require iframe/embedding, less integration

**When to Pursue Phase 2**:
- Post-MVP feedback shows supervisors want self-service
- Time savings justify engineering investment
- Non-technical supervisors need form design capability

---

### Phase 3: Advanced Features (Future) - Conditional Logic, Custom Validators

**Goal**: Support advanced QC scenarios (material type-specific rules, SKU-based validation)

**Potential Features**:
- [ ] Cross-field validation (field A must be > field B)
- [ ] API-based validation (lookup in production database)
- [ ] Custom field types (barcode scanner, image annotation, signature)
- [ ] Form versioning & rollback
- [ ] A/B testing form designs
- [ ] Analytics on form field usage

**When to Pursue Phase 3**:
- User feedback requests specific features
- Business case shows ROI
- Team capacity available

---

## Database Schema

### `schemas` Table

```sql
CREATE TABLE schemas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id UUID NOT NULL REFERENCES facilities(id),
  name TEXT NOT NULL,
  description TEXT,
  json_schema JSONB NOT NULL,  -- The JSON Schema definition
  ui_schema JSONB,             -- RJSF UI customization (optional)
  category TEXT,               -- e.g., 'scale', 'dimensional', 'visual'
  version INT DEFAULT 1,
  active BOOLEAN DEFAULT true,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT schema_unique_name_per_facility UNIQUE(facility_id, name)
);

-- Enable RLS for facility isolation
ALTER TABLE schemas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Supervisors can manage facility schemas"
  ON schemas
  USING (facility_id IN (
    SELECT facility_id FROM users WHERE id = auth.uid()
  ));
```

### `schema_versions` Table (for audit trail)

```sql
CREATE TABLE schema_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schema_id UUID NOT NULL REFERENCES schemas(id) ON DELETE CASCADE,
  version INT NOT NULL,
  json_schema JSONB NOT NULL,
  changed_by UUID NOT NULL REFERENCES auth.users(id),
  changed_at TIMESTAMPTZ DEFAULT now(),
  change_notes TEXT,

  UNIQUE(schema_id, version)
);
```

---

## API Endpoints

### Schema Management

```typescript
// GET /api/schemas - List all schemas for facility
GET /api/schemas
Response: {
  schemas: [
    {
      id: "uuid",
      name: "Scale Reading QC",
      description: "...",
      category: "scale",
      version: 2,
      created_at: "2026-01-16T...",
      active: true
    }
  ]
}

// GET /api/schemas/:id - Get schema by ID
GET /api/schemas/:id
Response: {
  id: "uuid",
  name: "Scale Reading QC",
  json_schema: { ... },
  ui_schema: { ... },
  version: 2,
  created_by: "...",
  history: [ ... ]
}

// POST /api/schemas - Create new schema
POST /api/schemas
Body: {
  name: "New QC Form",
  description: "...",
  category: "scale",
  json_schema: { ... }
}
Response: { id: "uuid", ... }

// PUT /api/schemas/:id - Update schema
PUT /api/schemas/:id
Body: {
  json_schema: { ... },
  change_notes: "Updated field validation"
}
Response: { version: 3, ... }

// DELETE /api/schemas/:id - Archive schema
DELETE /api/schemas/:id
Response: { success: true }
```

### Schema Validation

```typescript
// POST /api/schemas/validate - Validate schema syntax
POST /api/schemas/validate
Body: {
  json_schema: { ... }
}
Response: {
  valid: true,
  errors: []
}

// POST /api/schemas/:id/validate-data - Validate QC data against schema
POST /api/schemas/:id/validate-data
Body: {
  data: { ... }
}
Response: {
  valid: true,
  errors: [],
  data: { ... }  // Validated & coerced data
}
```

---

## Frontend Components

### Component Hierarchy

```
<AdminPanel>
  ├── <SchemaList />           # List all schemas
  │   ├── New button → <SchemaEditor />
  │   └── Each row has Edit, View, Delete
  │
  ├── <SchemaEditor />          # Main editor
  │   ├── <SchemaForm />        # Code-based JSON editor
  │   └── <SchemaPreview />     # Live form preview
  │
  └── <SchemaHistory />         # View schema versions
      └── Rollback capability
```

### Component Files

```
web/src/
├── components/
│   ├── SchemaList.tsx
│   ├── SchemaEditor.tsx
│   ├── SchemaForm.tsx
│   ├── SchemaPreview.tsx
│   ├── SchemaHistory.tsx
│   └── QCFormRenderer.tsx       # Reusable form renderer
│
├── hooks/
│   ├── useSchemaEditor.ts
│   ├── useSchemas.ts
│   └── useFormValidation.ts
│
├── lib/
│   ├── schemaValidator.ts       # AJV + JSON Schema validation
│   ├── schemaTemplates.ts       # Pre-made templates
│   └── schemaDefaults.ts
│
└── types/
    └── schemas.ts               # TypeScript types for schemas
```

---

## Testing Strategy

### Unit Tests

```typescript
// tests/schemaValidator.test.ts
describe('SchemaValidator', () => {
  test('validates correct JSON schema', () => {
    const schema = { /* valid */ }
    expect(() => validateSchema(schema)).not.toThrow()
  })

  test('rejects missing required properties', () => {
    const schema = { /* missing title */ }
    expect(() => validateSchema(schema)).toThrow()
  })

  test('validates data against schema', () => {
    const schema = { type: 'object', properties: { ... } }
    const data = { /* matching */ }
    expect(validateData(data, schema)).toBe(true)
  })

  test('catches validation errors', () => {
    const schema = { type: 'object', required: ['field'] }
    const data = { /* missing required */ }
    const errors = getValidationErrors(data, schema)
    expect(errors.length).toBeGreaterThan(0)
  })
})
```

### Integration Tests

```typescript
// tests/schemaAPI.test.ts
describe('Schema API', () => {
  test('supervisor can create schema', async () => {
    const schema = { title: 'Test', ... }
    const response = await fetch('/api/schemas', {
      method: 'POST',
      body: JSON.stringify(schema)
    })
    expect(response.status).toBe(201)
  })

  test('schema is immediately available for use', async () => {
    // Create schema
    // Fetch it
    // Render form
    // Validate data
    // Should all work
  })
})
```

### E2E Tests

```typescript
// tests/e2e/schema-workflow.test.ts
describe('Supervisor schema workflow', () => {
  test('can create, preview, and use schema', async () => {
    // 1. Navigate to schema editor
    // 2. Paste JSON schema
    // 3. Click validate
    // 4. See preview
    // 5. Save
    // 6. Create QC submission using schema
    // 7. Verify form renders correctly
    // 8. Verify validation works
  })
})
```

---

## Training & Documentation

### For Engineers
- [ ] README explaining architecture
- [ ] Code comments for complex validation logic
- [ ] Example schemas (scale, dimensional, visual inspection)
- [ ] Testing guide
- [ ] Deployment checklist

### For Supervisors (Phase 1)
- [ ] 5-minute video: "How to create a QC schema"
- [ ] JSON schema template library (with copy-paste)
- [ ] Quick reference card (laminated for on-site)
- [ ] FAQ: Common errors and fixes

### For Supervisors (Phase 2, after visual builder)
- [ ] Interactive tutorial for visual builder
- [ ] Drag-drop field demo
- [ ] Conditional logic examples
- [ ] Advanced scenarios (by role)

---

## Risk Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| **Schema syntax errors prevent form rendering** | High | High | Validate schema on save, show clear error messages, provide templates |
| **Supervisor creates invalid validation rules** | Medium | Medium | Provide examples, guide documentation, validation warnings |
| **Performance issues with complex schemas** | Low | Medium | Profile with 100+ fields, optimize renderer, implement pagination if needed |
| **Migration of existing hardcoded forms to schema format** | Medium | Low | Script conversion, test thoroughly, allow parallel operation during transition |
| **Schema version conflicts (multiple supervisors editing)** | Low | High | Implement locking, version control, audit trail |
| **Accessibility regression in form renderer** | Low | High | Test with NVDA/JAWS, run Lighthouse audits, follow WCAG guidelines |

---

## Success Criteria & Metrics

### Phase 1 MVP Success Criteria
- [ ] **Functionality**: All 5 common QC field types supported (text, number, select, checkbox, textarea)
- [ ] **Usability**: Supervisor can create schema in < 15 minutes with template
- [ ] **Reliability**: Form validation works for 100% of test cases
- [ ] **Performance**: Form renders in < 500ms; schema validation < 100ms
- [ ] **Accessibility**: WCAG AA compliance
- [ ] **Documentation**: Complete API docs + supervisor guide

### Business Metrics
- **Time to Deploy New QC Procedure**: Reduce from 1-2 days (code + QA) to 15 minutes (schema edit)
- **Data Quality**: 100% schema-enforced validation (vs. previous ad-hoc)
- **User Satisfaction**: NPS > 7 from supervisors using schema editor

### Technical Debt
- [ ] Keep < 2000 lines of form-related code (clean & maintainable)
- [ ] Test coverage > 80% for validation logic
- [ ] Zero security vulnerabilities (JSON injection, XSS)

---

## Timeline & Resource Allocation

### Recommended Team
- **1x Full-Stack Engineer** (React + FastAPI): Lead implementation
- **1x QA Engineer**: Testing, documentation, training
- **1x Product Manager**: Requirements, feedback loops
- **1x Designer** (part-time): UI polish if Phase 2 pursued

### Detailed Timeline

```
Week 1 (Planning & Setup)
├── Design database schema
├── Create API endpoint stubs
├── Set up form rendering components
└── Write initial tests

Week 2 (Core Implementation)
├── Implement schema validation (backend)
├── Build form renderer (RJSF + shadcn)
├── Implement schema CRUD endpoints
└── Create code-based schema editor UI

Week 3 (Integration & Testing)
├── Connect editor to API
├── Test end-to-end schema → form flow
├── Accessibility testing
├── Write supervisor documentation
└── Deploy to staging

Week 4 (Feedback & Polish)
├── Supervisor testing/feedback
├── Bug fixes and UX improvements
├── Performance optimization
└── Deploy to production
```

---

## Decision Sign-Off

### Required Approvals
- [ ] **Engineering Lead**: Architecture, technical feasibility
- [ ] **Product Manager**: Business requirements, timeline
- [ ] **Infrastructure/DevOps**: Database, API deployment
- [ ] **Data/Security**: Data handling, validation approach

### Contingency Plan
If RJSF + React Hook Form approach hits unexpected issues:
1. **Fall back to SurveyJS**: Pre-built solution, familiar ecosystem
   - Trade-off: Loss of 4-6 weeks (re-implement with SurveyJS)
   - Cost: +$530/year licensing

2. **Continue with hardcoded forms**: Keep current approach
   - Trade-off: Miss flexible schema design benefit
   - Revisit decision 6 months later

---

## Appendix: Comparison with Alternatives

### Why Not SurveyJS?
**Pros**: Visual builder (saves Phase 2 engineering), well-documented
**Cons**: Less control over UI/UX, annual licensing ($530), overkill for MVP, tighter coupling to SurveyJS ecosystem

**When it makes sense**: If Phase 2 (visual builder) becomes critical within 3 months, SurveyJS Creator could accelerate that work.

### Why Not Form.io?
**Pros**: Complete platform, backend included
**Cons**: Massive overkill ($600-900/month), don't need full form submission platform, creates duplication with Supabase, expensive, vendor lock-in

**When it makes sense**: Never, for Nexus. Form.io targets companies building form-as-a-service products, not internal tools.

### Why Not Build Custom Visual Builder Immediately?
**Pros**: Complete control, no tech debt, tailored to QC domain
**Cons**: 120 hours engineering (6 weeks), delays MVP, high risk for bugs in complex UI

**Strategy**: Build code-based MVP (2 weeks) to unblock form dynamics, then invest in visual builder (4-6 weeks) based on feedback.

---

## Next Steps

1. **Approval** (This Week)
   - [ ] Confirm RJSF + React Hook Form approach with stakeholders
   - [ ] Assign engineering lead
   - [ ] Schedule kick-off meeting

2. **Design** (Week 1)
   - [ ] Create detailed technical spec
   - [ ] Design database schema
   - [ ] Define API contracts
   - [ ] Identify edge cases

3. **Implementation** (Weeks 2-4)
   - [ ] Follow implementation phases above
   - [ ] Daily standups
   - [ ] Weekly progress demos

4. **Launch** (End of Week 4)
   - [ ] Production deployment
   - [ ] Supervisor training
   - [ ] Monitor metrics
   - [ ] Gather feedback for Phase 2

---

**Document Owner**: Engineering Lead
**Last Updated**: January 16, 2026
**Review Cycle**: Monthly (until Phase 1 complete), then quarterly
**Version**: 1.0
