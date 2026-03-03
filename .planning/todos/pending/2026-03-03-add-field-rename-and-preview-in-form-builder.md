---
created: 2026-03-03T08:41:49.223Z
title: Add field rename and preview in form builder
area: ui
files:
  - src/features/formBuilder/
---

## Problem

When clicking the "Add Field" button for different element types (text, number, decimal, etc.), the newly inserted field cannot be renamed inline. The user wants to:
1. Be able to rename the field label immediately after inserting it
2. See a preview that shows the field name (e.g., "New Text Field", "New Number Field") so they know what was added

Currently the field is inserted but there is no rename capability or visible preview label.

## Solution

- Add inline rename functionality for newly added fields in the form builder
- Add a preview area that displays the field type label (e.g., "New Text Field", "New Number Field") when a field is inserted
- Consider auto-focusing the rename input when a field is added so the user can immediately type the name
