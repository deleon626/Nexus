# Flutter Cleanup Migration Plan

## Overview

This plan outlines the complete removal of Flutter mobile framework from the Nexus project. The project will continue with the web-based approach (Next.js + Supabase) which provides responsive mobile access via browser.

## Inventory Summary

| Category | Count | Notes |
|----------|-------|-------|
| Flutter source files | 133 files | `mobile/` directory |
| Platform targets | 6 | Android, iOS, macOS, Linux, Windows, Web |
| Documentation files to update | 4 | CLAUDE.md, QUICK_START.md, NEXT_STEPS.md, PRD.md |
| Config files to update | 1 | .gitignore |
| Wireframes to remove | 1 | mobile-data-entry.html |

---

## Phase 1: Remove Flutter Directory

**Action**: Delete the entire `mobile/` directory

```
mobile/
├── lib/                    # Dart source code
│   ├── main.dart
│   ├── screens/
│   ├── services/
│   ├── theme/
│   └── utils/
├── android/                # Android build files
├── ios/                    # iOS build files
├── macos/                  # macOS support
├── linux/                  # Linux support
├── windows/                # Windows support
├── web/                    # Flutter web support
├── test/                   # Widget tests
├── pubspec.yaml            # Dependencies
├── pubspec.lock            # Lock file
├── analysis_options.yaml   # Linter config
└── .metadata               # Flutter metadata
```

**Command**: `rm -rf mobile/`

---

## Phase 2: Update Documentation

### 2.1 CLAUDE.md

**Remove/Update**:
- Line 13: Remove "Flutter (mobile)" from Architecture statement
- Lines 36-38: Remove Flutter CLI commands section
- Lines 72-78: Remove mobile directory from project structure
- Lines 110-159: Remove mobile implementation sections

**New Architecture Statement**:
```
**Architecture**: Full-stack with Next.js (web dashboard), Python FastAPI (backend),
Supabase (PostgreSQL + Auth + Storage), and Agno framework with OpenRouter (agent orchestration).
```

### 2.2 docs/QUICK_START.md

**Remove**:
- Lines 28-36: Terminal 4 Flutter setup section
- Lines 126-129: Mobile connection troubleshooting
- Line 154: Mobile file location reference
- Line 162: Hot reload instructions for mobile

### 2.3 docs/NEXT_STEPS.md

**Remove**:
- Lines 110-168: Entire "Mobile App (Priority: MEDIUM)" section
- Lines 181-189: Week 2 mobile implementation plan
- Lines 301-302: Mobile testing section

### 2.4 docs/PRD.md

**Update**:
- Lines 79-113: Update architecture overview (remove mobile client)
- Lines 501, 503: Update technology stack recommendations
- Lines 621-627: Update Phase 2 & 3 roadmap

---

## Phase 3: Update Configuration Files

### 3.1 .gitignore

**Remove Flutter patterns** (lines 24-28):
```gitignore
# Flutter
mobile/.dart_tool/
mobile/build/
mobile/.flutter-plugins
mobile/.flutter-plugins-dependencies
```

---

## Phase 4: Remove Wireframes

**Action**: Delete mobile-specific wireframe

```
wireframes/mobile-data-entry.html
```

---

## Phase 5: Verification

1. Run `git status` to confirm all changes
2. Ensure no broken references in remaining documentation
3. Verify backend still functions (no mobile-specific endpoints)
4. Confirm web app runs correctly: `cd web && npm run dev`

---

## Implementation Order

1. **Delete mobile directory** - Single command, removes 133 files
2. **Update CLAUDE.md** - Primary project documentation
3. **Update QUICK_START.md** - Developer onboarding
4. **Update NEXT_STEPS.md** - Task tracking
5. **Update PRD.md** - Product requirements
6. **Clean .gitignore** - Remove Flutter patterns
7. **Remove wireframes** - Delete mobile-data-entry.html
8. **Commit changes** - Single cleanup commit

---

## Rollback Plan

If needed, Flutter code can be recovered from git history:
```bash
git checkout <commit-before-cleanup> -- mobile/
```

---

## Post-Cleanup Notes

- Backend API remains unchanged (platform-agnostic)
- Web app provides mobile-responsive access via browser
- Design tokens from Flutter (`mobile/lib/theme/design_tokens.dart`) already exist in web (`web/src/styles/design-tokens.css`)
- No breaking changes to existing functionality
