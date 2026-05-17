# HabitFlow Design Guidelines

This document outlines the design system for the HabitFlow application, a scheduler planner based on The 7 Habits of Highly Effective People framework. Follow these guidelines to maintain visual consistency across all pages and components.

---

## Color Palette

The application uses a **cartoony, vibrant** aesthetic with a dark theme. All colors are defined as CSS variables in `globals.css`.

### Primary Colors

| Token | Hex Value | Usage |
|-------|-----------|-------|
| `--background` | `#090040` | Page backgrounds, deep navy base |
| `--primary` | `#B13BFF` | Primary actions, highlights, brand accent (bright magenta) |
| `--secondary` | `#471396` | Secondary elements, borders, supporting purple |
| `--accent` | `#FFCC00` | Call-to-action highlights, warnings, vibrant yellow |

### Extended Palette

| Token | Hex Value | Usage |
|-------|-----------|-------|
| `--card` | `#130066` | Card backgrounds, elevated surfaces |
| `--muted` | `#1a0080` | Input backgrounds, subtle elements |
| `--muted-foreground` | `#b8b8ff` | Secondary text, placeholders |
| `--foreground` | `#ffffff` | Primary text (white) |
| `--border` | `#471396` | Borders, dividers (matches secondary) |

### Usage Rules

1. **Background**: Always use `bg-background` for page backgrounds
2. **Cards/Panels**: Use `bg-card` with `border-border` for elevated surfaces
3. **Primary Actions**: Use `bg-primary text-primary-foreground` for main CTAs
4. **Secondary Actions**: Use `bg-secondary text-secondary-foreground` or `variant="outline"`
5. **Accent/Warning**: Use `bg-accent text-accent-foreground` for important highlights
6. **Text**: Use `text-foreground` for primary text, `text-muted-foreground` for secondary

---

## Typography

### Font Families

| Type | Font | CSS Class | Usage |
|------|------|-----------|-------|
| Headings | **Libre Franklin** | `font-sans` (default) | All headings, buttons, navigation, UI labels |
| Body | **Eczar** | `font-serif` | Paragraph text, descriptions, longer form content |
| Mono | Geist Mono | `font-mono` | Code, technical content (rarely used) |

### Font Configuration

Fonts are loaded in `layout.tsx` using Next.js Google Fonts:

```tsx
import { Libre_Franklin, Eczar } from 'next/font/google'

const libreFranklin = Libre_Franklin({
  subsets: ["latin"],
  variable: "--font-libre-franklin",
  display: "swap",
});

const eczar = Eczar({
  subsets: ["latin"],
  variable: "--font-eczar",
  display: "swap",
});
```

### Typography Scale

- **Page Titles**: `text-3xl md:text-4xl font-bold` or `text-4xl md:text-5xl lg:text-6xl font-bold`
- **Section Headers**: `text-xl font-bold` or `text-2xl font-bold`
- **Card Titles**: `text-lg font-bold` or `text-xl font-bold`
- **Body Text**: `text-base font-serif` with `text-muted-foreground`
- **Small/Labels**: `text-sm` with appropriate color

### Usage Example

```tsx
<h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
  Define Your <span className="text-primary">Roles</span>
</h1>
<p className="text-muted-foreground font-serif text-lg">
  Identify the key roles in your life...
</p>
```

---

## Spacing & Layout

### Border Radius

The design uses generous, rounded corners for a **cartoony** feel:

| Token | Value | Usage |
|-------|-------|-------|
| `--radius` | `1rem` (16px) | Base radius |
| `rounded-xl` | `0.75rem` | Buttons, inputs, small cards |
| `rounded-2xl` | `1rem` | Cards, panels, dialogs |
| `rounded-full` | `9999px` | Pills, avatars, circular elements |

### Spacing Scale

Use Tailwind's spacing scale consistently:

- **Page padding**: `px-6 py-8` or `px-4 py-6` on mobile
- **Card padding**: `p-6` or `p-8`
- **Section gaps**: `gap-6` or `gap-8`
- **Element gaps**: `gap-2`, `gap-3`, or `gap-4`
- **Margins between sections**: `mb-6`, `mb-8`, or `mb-12`

### Container Widths

```tsx
<main className="px-6 py-8">
  <div className="max-w-5xl mx-auto">
    {/* Page content */}
  </div>
</main>
```

- **Landing pages**: `max-w-7xl`
- **Feature pages**: `max-w-5xl`
- **Forms/Dialogs**: `max-w-md` or `max-w-lg`

---

## Components

### Cards

```tsx
<div className="p-6 rounded-2xl bg-card border-2 border-border hover:border-primary/30 transition-colors">
  {/* Card content */}
</div>
```

### Buttons

**Primary**:
```tsx
<Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
  Primary Action
</Button>
```

**Secondary**:
```tsx
<Button className="bg-secondary hover:bg-secondary/80 text-secondary-foreground">
  Secondary Action
</Button>
```

**Outline**:
```tsx
<Button variant="outline" className="border-border text-foreground hover:bg-secondary/20">
  Outline Button
</Button>
```

**Accent/CTA**:
```tsx
<Button className="bg-accent hover:bg-accent/90 text-accent-foreground">
  Call to Action
</Button>
```

### Inputs

```tsx
<Input
  placeholder="Enter text..."
  className="bg-muted border-border text-foreground placeholder:text-muted-foreground"
/>
```

### Dialogs

```tsx
<DialogContent className="bg-card border-border text-foreground">
  <DialogHeader>
    <DialogTitle className="text-xl font-bold">Title</DialogTitle>
    <DialogDescription className="text-muted-foreground font-serif">
      Description text here.
    </DialogDescription>
  </DialogHeader>
  {/* Content */}
</DialogContent>
```

---

## Background Decorations

### Blur Orbs

Add subtle depth with blurred gradient orbs:

```tsx
{/* Background decorations */}
<div className="fixed inset-0 pointer-events-none overflow-hidden">
  <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
  <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-3xl" />
</div>
```

### Grid Pattern (Optional)

For landing/auth pages:

```tsx
<div 
  className="absolute inset-0 opacity-[0.03]"
  style={{
    backgroundImage: `linear-gradient(#B13BFF 1px, transparent 1px), linear-gradient(90deg, #B13BFF 1px, transparent 1px)`,
    backgroundSize: '60px 60px',
  }}
/>
```

---

## Navigation

### Standard Navigation Bar

```tsx
<nav className="relative z-10 px-6 py-4 border-b border-border">
  <div className="max-w-7xl mx-auto flex items-center justify-between">
    {/* Logo */}
    <Link href="/" className="flex items-center gap-2">
      <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
        <Sparkles className="w-6 h-6 text-primary-foreground" />
      </div>
      <span className="text-2xl font-bold text-foreground">HabitFlow</span>
    </Link>
    
    {/* Nav items */}
    <div className="flex items-center gap-4">
      {/* ... */}
    </div>
  </div>
</nav>
```

---

## Animations (When Applicable)

### Transitions

Use CSS transitions for hover states:

```tsx
className="transition-colors"  // Color changes
className="transition-all"     // Multiple properties
className="transition-opacity" // Fade effects
```

### Framer Motion (Landing/Auth pages only)

For pages requiring animations, use Framer Motion:

```tsx
import { motion, AnimatePresence } from "framer-motion"

// Fade in
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5 }}
>
```

**Note**: Feature pages (Roles, Tasks, Schedule, etc.) should have minimal to no animations for better UX.

---

## Icon Usage

Use **Lucide React** icons consistently:

```tsx
import { Sparkles, Plus, Trash2, ChevronRight } from "lucide-react"

// Standard sizing
<Icon className="w-4 h-4" />  // Small (buttons, inline)
<Icon className="w-5 h-5" />  // Medium (navigation)
<Icon className="w-6 h-6" />  // Large (feature highlights)
```

### Icon Colors

- Default: `text-foreground` or `text-muted-foreground`
- Primary: `text-primary`
- Accent: `text-accent`
- In colored containers: Match or contrast appropriately

---

## State Colors

| State | Color | Usage |
|-------|-------|-------|
| Success | `text-green-500` or custom | Completed, valid |
| Warning | `text-accent` (#FFCC00) | Alerts, cautions |
| Error | `text-destructive` | Errors, delete actions |
| Info | `text-primary` (#B13BFF) | Information, highlights |

---

## Dark Theme Only

This application uses a **single dark theme**. Do not implement light mode. All color tokens are optimized for dark backgrounds.

---

## Accessibility

1. Ensure sufficient color contrast (white text on colored backgrounds)
2. Use semantic HTML elements (`nav`, `main`, `section`, `article`)
3. Include `aria-labels` on icon-only buttons
4. Maintain focus states on interactive elements
5. Use `sr-only` class for screen reader text when needed

---

## File Structure

```
app/
├── globals.css          # Color tokens, font config
├── layout.tsx           # Font loading, Toaster
├── page.tsx             # Landing page
├── login/page.tsx       # Auth page (with animations)
├── roles/page.tsx       # Feature page (minimal animation)
└── ...
components/
├── ui/                  # shadcn components
├── animated-schedule.tsx # Landing page animation
└── ...
```

---

## Quick Reference

### Common Class Combinations

```tsx
// Page container
"min-h-screen bg-background"

// Card
"p-6 rounded-2xl bg-card border-2 border-border"

// Primary button
"bg-primary hover:bg-primary/90 text-primary-foreground"

// Input field
"bg-muted border-border text-foreground placeholder:text-muted-foreground"

// Section header
"text-2xl md:text-3xl font-bold text-foreground"

// Body text
"text-muted-foreground font-serif"

// Warning banner
"p-4 rounded-2xl bg-accent/10 border-2 border-accent/30"