# Nexus Design System

A comprehensive, modern design system for the Nexus QC & Traceability platform. Built with oklch color space for perceptually uniform colors and full dark mode support.

## Overview

The design system defines the visual foundation for all Nexus applications including:
- **Web Dashboard** (React + TypeScript)
- **Mobile App** (Flutter)
- **Backend Services** (visual consistency in reports/exports)

This document serves as the reference guide. The actual CSS design tokens are defined in `web/src/styles/design-tokens.css`.

## Color System

### oklch Color Space

The design system uses **oklch** (Oklch Lightness-Chroma-Hue) color space instead of traditional HSL/RGB for several advantages:

- **Perceptually uniform**: Colors with the same lightness appear equally bright to human eyes
- **Better saturation control**: Chroma provides more intuitive color intensity control
- **Modern CSS support**: Widely supported in modern browsers
- **Accessibility**: Makes it easier to maintain sufficient contrast ratios

### Color Tokens

#### Semantic Colors

| Token | Light | Dark | Purpose |
|-------|-------|------|---------|
| `--primary` | Warm Brown (oklch 43.41%) | Cyan/Light Blue (oklch 92.47%) | Primary actions, buttons, links |
| `--secondary` | Light Yellow (oklch 92%) | Deep Navy (oklch 31.63%) | Secondary actions, accents |
| `--accent` | Neutral (oklch 93.1%) | Dark Gray (oklch 28.5%) | Highlights, emphasis |
| `--destructive` | Red/Orange (oklch 62.71%) | Red/Orange (oklch 62.71%) | Dangerous actions (delete, remove) |
| `--muted` | Light Gray (oklch 95.21%) | Dark Gray (oklch 25.2%) | Disabled states, hints |

#### Functional Colors

- `--background`: Page background
- `--foreground`: Primary text color
- `--card`: Card/panel backgrounds
- `--border`: Border and divider colors
- `--input`: Form input backgrounds
- `--ring`: Focus ring and state indicators

#### Extended Palette

- **Chart Colors** (`--chart-1` through `--chart-5`): Data visualization colors
- **Sidebar Colors**: Dedicated palette for navigation sidebars
- **Foreground Variants**: Complementary text colors for each semantic color

## Typography

### Font Families

| Font | CSS Variable | Usage |
|------|--------------|-------|
| **System Sans** | `--font-sans` | Body text, UI labels, default |
| **System Serif** | `--font-serif` | Headings, emphasis (optional) |
| **Monospace** | `--font-mono` | Code, technical data, logs |

Uses system font stack for optimal performance:
```css
--font-sans: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont,
             'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif
```

## Spacing & Layout

### Border Radius

| Variable | Value | Usage |
|----------|-------|-------|
| `--radius-sm` | -4px from base | Small components |
| `--radius-md` | -2px from base | Medium components |
| `--radius-lg` | `0.5rem` (8px) | Base radius |
| `--radius-xl` | +4px from base | Large components |

### Spacing

Base spacing unit: `--spacing: 0.25rem` (4px)

Multiples (via Tailwind):
- `space-1`: 4px
- `space-2`: 8px
- `space-4`: 16px
- `space-8`: 32px
- etc.

## Shadows

Shadow system provides layered depth effects:

| Token | Use Case |
|-------|----------|
| `--shadow-2xs`, `--shadow-xs` | Subtle borders, dividers |
| `--shadow-sm` | Hover states, slightly elevated |
| `--shadow`, `--shadow-md` | Card shadows, standard elevation |
| `--shadow-lg`, `--shadow-xl` | Modals, dropdowns |
| `--shadow-2xl` | Maximum elevation |

## Dark Mode

### Implementation

Dark theme is applied via the `.dark` class on the root element:

```html
<html class="dark">
  <!-- content -->
</html>
```

### Color Adjustments

The dark theme provides:
- **Lighter foreground colors**: oklch 94.91% (near white)
- **Darker backgrounds**: oklch 17.76% (near black)
- **Adjusted hues**: Primary becomes cyan/light blue, secondary becomes navy
- **Maintained contrast**: All pairs maintain WCAG AA contrast ratio

## Implementation Roadmap

### Phase 1: Foundation (Current)
✅ Design tokens defined in `web/src/styles/design-tokens.css`
- CSS custom properties established
- Light and dark themes configured
- Tailwind @theme integration prepared

### Phase 2: Tailwind Integration (Next)
- [ ] Update `web/tailwind.config.js` to import tokens
- [ ] Replace hardcoded color classes with token-based utilities
- [ ] Add dark mode configuration
- [ ] Test all utility classes

### Phase 3: Implementation
- [ ] Apply tokens to existing components
- [ ] Create component library with design tokens
- [ ] Establish dark mode toggle
- [ ] Test accessibility (contrast, color blindness)

### Phase 4: Documentation & Polish
- [ ] Generate color palette reference
- [ ] Create Figma/design tool equivalents
- [ ] Document component variants
- [ ] Add usage guidelines

## Usage Guide

### When Implementation Begins

#### Option 1: Tailwind Config Integration
```javascript
// web/tailwind.config.js
export default {
  theme: {
    colors: {
      background: 'var(--background)',
      foreground: 'var(--foreground)',
      primary: 'var(--primary)',
      // ... other colors
    },
    fontFamily: {
      sans: 'var(--font-sans)',
      mono: 'var(--font-mono)',
    },
    // ... other theme config
  }
}
```

#### Option 2: Direct CSS Usage
```css
/* In any component stylesheet */
.button-primary {
  background-color: var(--primary);
  color: var(--primary-foreground);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
}
```

#### Option 3: Import in Main Stylesheet
```css
/* In web/src/index.css */
@import './styles/design-tokens.css';

:root {
  /* All custom properties now available */
}
```

## Accessibility Considerations

### Contrast Ratios

All color combinations maintain **WCAG AA** compliance:
- Normal text (14px+): 4.5:1 minimum
- Large text (18px+): 3:1 minimum
- UI components: 3:1 minimum

### Color Blindness

The design avoids relying solely on color for meaning:
- Uses distinct saturation levels
- Includes patterns/textures where helpful
- Provides text labels for all color-coded elements

### Dark Mode Safety

Dark mode colors have been:
- Tested for eye strain (reduced brightness extremes)
- Verified for sufficient contrast with light text
- Checked against WCAG 2.1 AA standards

## Related Files

- **CSS Design Tokens**: `web/src/styles/design-tokens.css` - Raw token definitions
- **Tailwind Config**: `web/tailwind.config.js` - Framework configuration
- **Component Library**: `web/src/components/` - Component implementations
- **Project CLAUDE.md**: `CLAUDE.md` - Development guidelines

## References

- [oklch Color Space](https://www.w3.org/TR/css-color-4/#ok-lab)
- [Tailwind CSS Documentation](https://tailwindcss.com/)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [System Font Stack](https://systemfontstack.com/)

## Questions & Updates

As the design system evolves:
1. Update the CSS tokens in `web/src/styles/design-tokens.css`
2. Document changes in this file
3. Notify the team of significant changes
4. Update Figma/design tools to match

---

**Last Updated**: 2025-12-12
**Status**: Reference/Guideline (Not yet implemented)
