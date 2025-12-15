# Quickstart: shadcn/ui Setup

**Feature**: 003-shadcn-setup
**Date**: 2025-12-16

## Prerequisites

- Node.js 18+
- npm or pnpm
- Existing web project at `web/`

## Quick Setup (5 minutes)

### 1. Install Node types

```bash
cd web
npm install -D @types/node
```

### 2. Configure path aliases

**tsconfig.json** - Add to `compilerOptions`:
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

**vite.config.ts** - Replace with:
```typescript
import path from "path"
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    strictPort: false,
    open: true
  }
})
```

### 3. Initialize shadcn/ui

```bash
npx shadcn@latest init
```

Answer the prompts:
- Style: **Default**
- Base color: **Slate**
- CSS variables: **Yes**

### 4. Add core components

```bash
npx shadcn@latest add button card dialog input label badge table
```

### 5. Verify setup

```bash
npm run dev
```

Open http://localhost:5173 - no errors should appear.

## Using Components

### Import pattern

```tsx
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
```

### Example usage

```tsx
export function ExampleForm() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>QC Data Entry</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="weight">Weight (kg)</Label>
            <Input id="weight" type="number" placeholder="0.00" />
          </div>
          <Button type="submit">Submit</Button>
        </div>
      </CardContent>
    </Card>
  )
}
```

## Adding More Components

```bash
# Single component
npx shadcn@latest add select

# Multiple components
npx shadcn@latest add form tabs alert skeleton sonner

# View available components
npx shadcn@latest add --help
```

## Dark Mode

Toggle dark mode by adding/removing `.dark` class on `<html>`:

```typescript
// Enable dark mode
document.documentElement.classList.add('dark')

// Disable dark mode
document.documentElement.classList.remove('dark')

// Toggle
document.documentElement.classList.toggle('dark')
```

## Customization

### Colors

Edit `src/styles/design-tokens.css` to change color values:

```css
:root {
  --primary: oklch(0.4341 0.0392 41.9938);
  /* Change to your brand color */
}
```

### Border radius

```css
:root {
  --radius: 0.5rem;
  /* Increase for more rounded corners */
}
```

## Troubleshooting

### Path alias not working

1. Restart dev server after tsconfig changes
2. Verify both tsconfig.json and vite.config.ts have alias configured
3. Check that `@types/node` is installed

### Components not styled

1. Ensure `globals.css` imports design tokens
2. Check Tailwind content paths include `src/**/*.tsx`
3. Verify CSS variables are defined in `:root`

### Build errors

```bash
# Clear cache and rebuild
rm -rf node_modules/.vite
npm run build
```

## File Structure After Setup

```
web/
├── src/
│   ├── components/
│   │   └── ui/           # shadcn components here
│   ├── lib/
│   │   └── utils.ts      # cn() helper
│   └── styles/
│       └── design-tokens.css
├── components.json       # shadcn config
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```
