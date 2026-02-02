# Hybrid AI + Visual Builder: Quick Reference
## One-Page Summary for Decision Making

---

## The Core Pattern: Co-Pilot Architecture

**Human-in-the-Loop + AI Suggestions + Visual Editing**

```
User Action (Canvas/Form) → AI Generates Suggestions → UI Presents → User Accept/Reject/Modify → Persist
```

---

## 5 Interaction Patterns (Choose Based on Context)

| Pattern | Icon | When to Use | Example |
|---------|------|-----------|---------|
| **Inline** | 💬 | Single suggestion, real-time | GitHub Copilot code completion |
| **Card Sidebar** | 📋 | Multiple options, ranked | Figma AI suggestions panel |
| **Floating Menu** | ⚡ | Context-specific actions | Right-click menu with AI options |
| **Modal Dialog** | 🎨 | Complex generation + params | Design generator with preview |
| **Split Panel** | 📊 | Detailed comparison | Document editor: original vs AI |

---

## Key Interaction Design Principles

### 1. Always Show Confidence
- **High (85%+)**: Visual indicator, subtle label
- **Medium (50-84%)**: Visible confidence badge
- **Low (<50%)**: Warning, recommend alternative or regenerate

### 2. Default to Augment, Not Automate
- **Augment**: Suggestions for user to review/modify (safest)
- **Automate**: System acts without user approval (only for low-risk)

### 3. Explain-Back Loop Before Action
```
User Input: "Make this modern"
AI Confirmation: "I'll update colors to current trends. OK?"
User: Confirms or refines
AI: Acts
```

### 4. Three Easy Actions Per Suggestion
- ✅ **Accept**: Apply immediately
- ❌ **Reject**: Dismiss and don't show again
- ✏️ **Modify**: Edit before accepting

### 5. Reversibility is Critical
- Every AI action must be undoable
- Show preview before applying
- Keep suggestion history

---

## Confidence Score Guide

```
95-100%  🟢 Deep Green   → Safe to show as primary suggestion
85-94%   🟢 Green         → Show with confidence label
75-84%   🟡 Light Green   → Show with medium confidence
50-74%   🟡 Yellow        → Show alternatives too
30-49%   🟠 Orange        → Low confidence, highlight alternatives
< 30%    🔴 Red           → Don't show, regenerate instead
```

### How to Calculate Confidence (Options)

1. **From Model**: Use softmax probability from LLM
2. **From Validation**: % of validation checks passed
3. **From Ensemble**: How many models agree?
4. **From User History**: How often user accepts this type?
5. **Combined**: Weighted average of above

---

## Architecture Layers (For Developers)

```
┌─ Frontend (React/TypeScript)
│  ├─ Canvas / Editor Component
│  ├─ Suggestion UI (one of 5 patterns)
│  └─ State: selectedItem, suggestions, pendingChanges
│
├─ Backend (FastAPI/Node.js)
│  ├─ Request Handler: Validate + enrich context
│  ├─ Suggestion Generator: Call AI
│  └─ Ranker: Score + sort + validate suggestions
│
└─ AI Model (Claude/GPT-4/Domain-specific)
   ├─ Process prompt with context
   └─ Generate candidates
```

### Suggestion Pipeline

```
Raw AI Output
    ↓
Parse (Extract from JSON/markdown)
    ↓
Validate (Schema, safety, domain rules)
    ↓
Rank (Relevance + confidence + user preference)
    ↓
Present (Format for UI, truncate if needed)
    ↓
User Action (Accept/Reject/Modify)
    ↓
Log Feedback (For model improvement)
```

---

## UX Decision Checklist

### Before Implementing a Suggestion Feature:

- [ ] **Do we need it?** Is this task open-ended enough for AI to help?
- [ ] **Can we show confidence?** Will users understand the uncertainty?
- [ ] **Is preview possible?** Can users see what AI will do before applying?
- [ ] **Is it reversible?** Can it be undone easily?
- [ ] **Does it match mental models?** Is it familiar to users?
- [ ] **What's the failure mode?** What happens if AI is wrong?
- [ ] **Can supervisors review?** Is there a human approval step?
- [ ] **Is audit trail logged?** Can we track all AI actions?

### If ALL answers are YES → Safe to implement
### If any answer is NO → Need more design work

---

## Real-World Examples

### Example 1: QC Form with AI Extraction (Nexus)
```
User uploads image of product defect
    ↓
AI extracts: Type, Location, Severity
    ↓
Show as inline suggestions with confidence
    ↓
User can accept, modify, or request alternative
    ↓
Before submit: Show confirmation with all extractions
    ↓
Supervisor reviews; approves or rejects
    ↓
Log feedback to improve extraction model
```

**Pattern Used**: Inline + Card Sidebar + Confirmation Modal
**Confidence**: Per-field percentages shown

---

### Example 2: Design System Component Suggestion
```
User selects button element on canvas
    ↓
AI suggests from design system library
    ↓
Show 3 options in floating menu
    ↓
User clicks option → Shows in modal with preview
    ↓
User adjusts colors, sizes
    ↓
User clicks "Apply" → Updates canvas
    ↓
Undo available if user changes mind
```

**Pattern Used**: Floating Menu + Modal Dialog
**Confidence**: Highest-ranked option highlighted

---

### Example 3: Code Refactoring
```
User highlights legacy function
    ↓
AI suggests refactored version
    ↓
Show in split panel (original vs refactored)
    ↓
User can see all changes color-coded
    ↓
User selects which suggestions to accept
    ↓
AI regenerates refactored code with only selected changes
    ↓
User accepts final version
```

**Pattern Used**: Split Panel + Inline edits
**Confidence**: Overall confidence + per-change confidence

---

## Mental Model Mapping

**Help users understand AI by building on what they know:**

| User's Existing Knowledge | How AI Works | How to Explain It |
|--------------------------|--------------|-----------------|
| Email autocomplete (predictive text) | Token prediction | "Like email suggestions, but for your domain" |
| Find & Replace | Pattern matching + transformation | "Can find patterns and suggest fixes" |
| Spell checker | Token validation | "Like spell check, but for your whole task" |
| Code snippets library | Retrieval + ranking | "Shows relevant examples ranked by relevance" |
| Undo/Redo history | State management | "Can step through AI attempts like undo history" |

---

## Common Pitfalls to Avoid

| Pitfall | Why It's Bad | How to Fix It |
|---------|------------|--------------|
| **No confidence scores** | Users over/under-trust AI | Always show how certain AI is |
| **No preview** | Users surprised by changes | Show before/after or live preview |
| **Auto-apply** | Harmful if wrong; violates autonomy | Always require explicit acceptance |
| **Buried in UI** | Users don't notice suggestions | Make prominent but not intrusive |
| **No undo** | Users trapped with bad suggestions | Make all AI actions reversible |
| **Vague explanations** | Users don't understand why | Show clear reasoning + evidence |
| **Too many options** | Analysis paralysis | Show 3-5 ranked options max |
| **Ignoring feedback** | Model doesn't improve | Log acceptance/rejection data |

---

## Decision Matrix: Which Pattern for Your Use Case?

```
                    Simple      Ranked      Complex
                    Suggestion  Options     Operation
                    ──────────────────────────────────
Quick acceptance    Inline      Card        Modal
(Text, small edits)             (Sidebar)   (with preview)

Detailed review     Inline      Split       Split
(Document edits)    (with hint)  Panel       Panel
                                           (dual window)

Canvas actions      Menu        Menu        Menu
(Design, diagram)   (floating)  (with       (with
                               submenu)    preview)
```

---

## For Your QC System (Nexus): Recommended Approach

### Suggestion UI (Choose One Per Form Type)

**For Text Fields** (Product ID, Defect Notes):
- **Pattern**: Inline Suggestion + Sidebar Card
- **Confidence**: Per-field percentage
- **Flow**: User sees suggestion inline, can accept with Tab, sees full context in sidebar

**For Image Analysis** (Defect Detection):
- **Pattern**: Modal with Preview + Bounding Boxes
- **Confidence**: Bounding box confidence color-coded
- **Flow**: User uploads image, AI draws boxes, user confirms detections

**For Structured Data** (Severity, Category):
- **Pattern**: Sidebar Card Suggestions
- **Confidence**: Confidence badge with reasoning
- **Flow**: User sees 2-3 options, selects best fit

### Confirmation Flow (Before Persistence)

```
User submits form
    ↓
Modal shows: "Extracted the following from your input"
    ├─ Field 1: Value [Confidence 92%] [Edit]
    ├─ Field 2: Value [Confidence 67%] [Edit]
    └─ Field 3: Value [Confidence 81%] [Edit]
    ↓
User can quick-edit inline or request AI regenerate
    ↓
User clicks "Confirm & Submit"
    ↓
Data persists to database with metadata:
   - extracted_by: "ai"
   - confidence_scores: {...}
   - supervisor_approved: null (pending review)
    ↓
Supervisor reviews in approval queue
    ↓
If approved: supervisor_approved = true
If rejected: supervisor_approved = false, notes = "why"
    ↓
Log for model improvement:
   did_supervisor_approve = true/false
   which_fields_corrected = [...]
```

---

## Resources & References

**Research Documents**:
1. `HYBRID_AI_VISUAL_BUILDER_RESEARCH.md` - Comprehensive patterns & architecture
2. `AI_SUGGESTION_UI_PATTERNS.md` - Detailed visual & code examples
3. This file - Quick reference

**Key Patterns**:
- 21 GenAI UX Patterns (Sharang Sharma, UX Design)
- Copilot Pattern Architecture (Vamsi Talks Tech)
- Explainable AI UI Design (Eleken)
- AI UX Design Patterns (Birdzhan Hassan)

**Tools to Study**:
- GitHub Copilot (code completion)
- Figma AI (design generation)
- Canva Magic (design generation)
- Notion AI (document assistance)
- Grammarly (inline editing suggestions)

---

## Implementation Priority (For Nexus)

### Phase 1: MVP (Week 1-2)
- [ ] Inline suggestions for text fields
- [ ] Confidence badge (percentage)
- [ ] Accept/Reject buttons
- [ ] Undo support

### Phase 2: Enhanced (Week 3-4)
- [ ] Sidebar card for ranked options
- [ ] Image bounding box preview
- [ ] Confirmation modal before submit
- [ ] Feedback logging

### Phase 3: Advanced (Week 5+)
- [ ] Explanation tooltips ("Why this suggestion?")
- [ ] Personalization (learn user preferences)
- [ ] Batch operations
- [ ] Model retraining loop with supervisor feedback

---

**Last Updated**: January 16, 2026
**For**: Nexus QC System Integration
**Status**: Ready for implementation
