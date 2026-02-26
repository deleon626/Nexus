# Feature Research

**Domain:** Mobile QC Form Data Entry for Factory/Industrial Use
**Researched:** 2026-02-26
**Confidence:** HIGH

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Offline Mode** | Factory floors have unreliable connectivity; workers go offline for 30min-2hrs | MEDIUM | Forms cache locally, sync when connected. All competitors offer this (Device Magic, NestForms, SafetyCulture, GoAudits, Flowdit) |
| **Photo Capture** | Visual evidence of defects/compliance is fundamental for QC | LOW | Camera integration, annotate on photo. Universal feature across all QC apps |
| **Form Builder (Admin)** | Companies need custom forms for their specific QC processes | MEDIUM | Drag-and-drop interface, field types, validation. Standard in all products (SafetyCulture, Axonator, NestForms) |
| **Draft Auto-Save** | Prevents data loss from accidental closure or battery issues | MEDIUM | Local storage persistence. Expected behavior for any data entry app |
| **Real-Time Sync Status** | Users need to know when data will sync/has synced | LOW | Visual indicators (pending/synced/failed). Critical for offline-first UX |
| **Role-Based Access** | Different roles (Admin, Worker, Reviewer) need different permissions | MEDIUM | Basic RBAC is table stakes for enterprise software |
| **Mobile App (iOS + Android)** | Factory workers use personal phones; must support both platforms | HIGH | Native apps preferred over PWA for camera/offline reliability, though PWA is viable |
| **Digital Form Filling** | Core functionality - replace paper with digital forms | LOW | Manual input for all field types. This is the baseline |
| **Form Validation** | Prevent invalid submissions at the source | LOW | Required fields, min/max, format validation. Standard in all form builders |
| **Report Generation (PDF)** | External auditors, stakeholders expect PDF reports | MEDIUM | Export submissions as PDF. Universal requirement (SafetyCulture, GoAudits, Device Magic) |
| **Cloud Storage/Backup** | Data must be secure and retrievable for audits/compliance | MEDIUM | All competitors offer cloud backup with secure access |

### Differentiators (Competitive Advantage)

Features that set the product apart. Not required, but valuable.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Voice Input (Online)** | 10x faster than typing; hands-free for workers wearing gloves | HIGH | Whisper API + Agno LLM extraction. None of the researched competitors offer voice-to-form-field filling |
| **Per-Batch Form Association** | Matches factory workflow (QC happens per production batch) | MEDIUM | Nexus-specific pattern; most apps are form-centric, not batch-centric |
| **Review Workflow with Approvals** | Adds quality gate between worker and final record | MEDIUM | Some competitors have this (GoAudits), but not all. Adds process control |
| **Multi-Language Voice (EN + ID)** | Addresses Indonesian manufacturing market specifically | HIGH | Most competitors are English-first or support limited languages |
| **Grid-Style Paper Form Emulation** | Direct 1:1 replacement for existing paper forms | MEDIUM | Most apps use linear questions; grid input (10 fields x 10 batches) is factory-specific |
| **PWA Delivery** | No app store approval needed; instant updates; lower friction | MEDIUM | Most competitors use native apps. PWA is viable but less common |
| **Template Versioning with Audit Trail** | Track form template changes over time | MEDIUM | Essential for regulated industries (HACCP, FDA), but competitors vary on implementation |
| **Simplicity/Single-Purpose** | Enterprise QC apps are bloated; focused app wins adoption | LOW | Feature-lite vs. feature-rich. Appeal to factory workers who want simple tools |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| **Offline Voice Input** | Hands-free data entry anywhere | Whisper WASM is 200-300MB; crashes low-end Android phones; iOS IndexedDB eviction risk | Online-only voice for MVP (Whisper API via OpenRouter) |
| **Real-Time Collaboration** | "See changes as they happen" | Adds WebSocket complexity; race conditions; not needed for QC workflow | Async sync with clear status indicators is sufficient |
| **Advanced Analytics Dashboard** | "Data-driven decisions" | Most factories export to Excel/BI tools anyway; building full analytics is scope creep | Export data; let customers use their existing BI tools |
| **Barcode/QR Scanning** | Quick identification | Adds camera permissions complexity; many factories don't barcode items; v1.1 deferral is prudent | Manual batch ID entry is simpler and works |
| **Electronic Signatures** | "Sign-off on inspections" | Legal complexity; not required for QC workflow (approvals are sufficient) | Reviewer approval status is sufficient for v1 |
| **Multi-Language UI** | "Support non-English workers" | i18n is complex; voice supporting EN + ID covers the critical need | English UI + Bahasa voice input |
| **Push Notifications** | "Alert workers to new forms" | Overkill for factory workflow; workers check app when doing QC | In-app form list is sufficient |
| **Advanced Conditional Logic** | "Smart forms that adapt" | Complexity explodes; hard to debug; most QC forms are linear | Simple skip logic is enough for v1 |

## Feature Dependencies

```
[Form Builder] ───requires──> [Field Types Definition]
                           └──requires──> [Validation Rules Engine]

[Offline Mode] ──requires──> [Local Storage (Dexie.js)]
                       └──requires──> [Sync Engine]
                                 └──requires──> [Conflict Resolution Strategy]

[Voice Input] ──requires──> [Whisper API Integration]
                    └──requires──> [Agno LLM Field Extraction]
                              └──requires──> [Online Connectivity Detection]

[Review Workflow] ──requires──> [Role-Based Access]
                     └──requires──> [Status Management (pending/approved/rejected)]

[Photo Capture] ──enhances──> [Form Filling] ──enhances──> [Report Generation]

[Per-Batch Association] ──requires──> [Batch Data Model]
                            └──conflicts──> [Generic Form-Only Model]

[PWA] ──conflicts──> [Native App Distribution]
        (No app store vs. app store visibility)
```

### Dependency Notes

- **Form Builder requires Field Types & Validation:** Cannot build forms without defining what fields exist and how they're validated. This is foundational.

- **Offline Mode requires Storage + Sync + Conflict Resolution:** Dexie.js handles storage, but sync engine and conflict resolution (what if two people edit same batch?) must be designed.

- **Voice Input requires Online Connectivity:** Whisper API is online-only for MVP. Must detect connectivity and disable voice when offline.

- **Review Workflow requires RBAC:** Cannot have approvers without roles. Admin, Worker, Reviewer roles must exist first.

- **Photo Capture enhances Form Filling & Reports:** Photos add value to both data entry and final reports, but forms work without them.

- **Per-Batch Association conflicts with Generic Form Model:** Most competitors are form-centric (fill any form). Nexus is batch-centric (QC happens per batch). This is a deliberate architectural choice.

- **PWA vs Native App Distribution:** PWA eliminates app store friction but reduces discoverability. Trade-off between update speed and user acquisition.

## MVP Definition

### Launch With (v1)

Minimum viable product — what's needed to validate the concept.

- [ ] **Offline Mode** — Factory floors have spotty connectivity; this is non-negotiable
- [ ] **Photo Capture** — Visual evidence is core to QC inspections
- [ ] **Form Builder (10 field types)** — Admins must be able to create custom forms
- [ ] **Form Filling (manual input)** — Workers need to enter data per batch
- [ ] **Draft Auto-Save** — Prevent data loss from common failure modes
- [ ] **Real-Time Sync Status** — Users must know connectivity state
- [ ] **Basic RBAC (Admin, Worker, Reviewer)** — Different roles for different permissions
- [ ] **Review Workflow** — Quality gate between worker and final record
- [ ] **PDF Export** — External stakeholders need readable reports
- [ ] **Per-Batch Form Association** — Matches factory workflow
- [ ] **Voice Input (online-only)** — Primary differentiator; must validate value

### Add After Validation (v1.1)

Features to add once core is working.

- [ ] **Barcode/QR Scanning** — Trigger: Users request faster batch ID entry
- [ ] **Signature Capture** — Trigger: Regulatory requirements emerge
- [ ] **Template Versioning** — Trigger: Multiple form template revisions create confusion
- [ ] **MultiSelect + Rating Field Types** — Trigger: Specific form requirements arise
- [ ] **HACCP/FDA Audit Trails** — Trigger: Food safety certification needed

### Future Consideration (v2+)

Features to defer until product-market fit is established.

- [ ] **Offline Voice Input** — Defer: Whisper WASM maturity and device capability improvements
- [ ] **Smart Assistant (Anomaly Detection)** — Defer: Requires substantial data accumulation
- [ ] **Photo OCR (paper → digital)** — Defer: Separate workflow; different user persona
- [ ] **Full Multi-Tenancy UI** — Defer: Single org for MVP; org switcher adds complexity
- [ ] **Advanced Analytics Dashboard** — Defer: Customers can export to existing BI tools

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Offline Mode | HIGH | MEDIUM | P1 |
| Photo Capture | HIGH | LOW | P1 |
| Form Builder | HIGH | MEDIUM | P1 |
| Form Filling (manual) | HIGH | LOW | P1 |
| Draft Auto-Save | HIGH | MEDIUM | P1 |
| Real-Time Sync Status | HIGH | LOW | P1 |
| Voice Input (online) | HIGH | HIGH | P1 |
| Review Workflow | MEDIUM | MEDIUM | P1 |
| RBAC | MEDIUM | MEDIUM | P1 |
| PDF Export | MEDIUM | MEDIUM | P1 |
| Per-Batch Association | HIGH | MEDIUM | P1 |
| Barcode/QR Scanning | MEDIUM | MEDIUM | P2 |
| Signature Capture | LOW | LOW | P2 |
| Template Versioning | MEDIUM | HIGH | P2 |
| MultiSelect Field Types | LOW | LOW | P2 |
| HACCP/FDA Audit Trails | MEDIUM | HIGH | P3 |
| Offline Voice Input | MEDIUM | HIGH | P3 |
| Smart Assistant (AI) | LOW | HIGH | P3 |
| Photo OCR | LOW | HIGH | P3 |
| Full Multi-Tenancy UI | MEDIUM | HIGH | P3 |
| Advanced Analytics Dashboard | LOW | HIGH | P3 |

**Priority key:**
- P1: Must have for launch
- P2: Should have, add when possible
- P3: Nice to have, future consideration

## Competitor Feature Analysis

| Feature | SafetyCulture | GoAudits | Device Magic | NestForms | Axonator | Flowdit | Our Approach |
|---------|--------------|----------|--------------|-----------|----------|---------|--------------|
| **Offline Mode** | YES | YES | YES | YES | YES | YES | Dexie.js + custom sync engine |
| **Photo Capture** | YES | YES | YES | YES | YES | YES | Camera API with annotation |
| **Form Builder** | YES | YES | YES | YES | YES | YES | Drag-and-drop admin interface |
| **Voice Input** | NO | NO | NO | NO | NO | NO | Whisper API + Agno (differentiator) |
| **Review Workflow** | Partial | YES | NO | NO | Partial | YES | Explicit approve/reject with comments |
| **Per-Batch Forms** | NO | NO | NO | NO | NO | NO | Batch-centric data model (unique) |
| **Barcode Scanner** | YES | NO | YES | YES | YES | NO | v1.1 - defer for simplicity |
| **Signature** | YES | NO | YES | YES | YES | NO | v1.1 - defer for simplicity |
| **PDF Export** | YES | YES | YES | YES | YES | YES | Standard PDF generation |
| **Real-Time Sync** | YES | YES | YES | NO | YES | YES | Async sync with status indicators |
| **Analytics Dashboard** | YES | YES | NO | NO | YES | YES | Export data; customers use own BI |
| **Multi-Language** | Multiple | Limited | Limited | Limited | Limited | Multiple | EN UI + EN/ID voice (MVP) |
| **Delivery** | Native | Native | Native | Native | Native | Native | PWA (faster updates, no app store) |

### Key Observations

1. **Voice input is a genuine differentiator** — None of the major competitors offer voice-to-form-field filling. This is an open space.

2. **Most competitors are feature-bloated** — They offer analytics, barcode scanning, signatures, multi-language, integrations. This creates complexity that factory workers don't need.

3. **PWA is underutilized** — All major competitors use native apps. PWA offers faster iteration and lower distribution friction.

4. **Per-batch workflow is unique** — Most competitors are form-centric. Nexus's batch-centric approach matches factory reality better.

5. **Simplicity is competitive advantage** — Enterprise QC apps are complex. A focused, simple app will win worker adoption.

## Sources

### Primary Sources (HIGH Confidence)
- SafetyCulture Quality Control Apps - https://safetyculture.com/apps/quality-control (comprehensive feature comparison, 10 QC apps analyzed)
- GoAudits Quality Inspection Software - https://goaudits.com/quality (feature set, value propositions)
- Device Magic Manufacturing Solutions - https://www.devicemagic.com/industries/manufacturing (manufacturing-specific features)
- Device Magic Offline Forms - https://www.devicemagic.com/offline-forms (offline capabilities detailed)
- NestForms Quality Control App - https://www.nestforms.com/Quality-control-app (feature overview, use cases)
- Axonator Manufacturing QC App - https://axonator.com/quality-control-checklist-app-for-manufacturing (manufacturing features, workflows)
- Flowdit Manufacturing Inspection - https://flowdit.com/ (AI-powered inspection software, comprehensive features)

### Secondary Sources (MEDIUM Confidence)
- AHG Mobile Forms for Manufacturing - https://www.ahg.com/qr-mobile-data/ready-to-use-business-digital-forms/digital-forms-workflow-for-manufacturing/mobile-form-manufacturing-quality-inspection.htm
- Kizeo Forms for Manufacturing - https://www.kizeo-forms.com/en/us/business-forms/manufacturing
- OrangeQC Janitorial Inspection - https://www.orangeqc.com/ (simplicity-focused alternative)
- Jotform Mobile Forms - https://www.jotform.com/products/mobile-forms/faq (offline capabilities)
- Form.com Quality Management - https://www.form.com/use-case/quality-management-software

### Web Search Results (LOW-MEDIUM Confidence)
- Various mobile form app comparisons and feature lists (verified against primary sources)
- Barcode scanner implementation patterns (Forms on Fire, Orcascan)
- GPS location capture patterns (Jotform, Dynoforms)
- Signature capture patterns (Mobile Forms Pro, FormTab)

---
*Feature research for: Mobile QC Form Data Entry for Factory/Industrial Use*
*Researched: 2026-02-26*
