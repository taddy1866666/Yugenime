# Yugenime Design System - Master

**Product:** Entertainment Streaming Platform (Anime)
**Style:** Dark Mode + Glassmorphism + Bento Grid
**Target:** Entertainment enthusiasts, ages 13-35

---

## 1. COLORS

### Primary Palette
- **Primary (Accent):** `#ff006e` (Hot Pink/Crimson) - CTA, highlights, focus states
- **Primary RGB:** `rgb(255, 0, 110)` for CSS variable `--accent-rgb`
- **Secondary:** `#1a1a2e` (Deep Navy) - Backgrounds, cards
- **Tertiary:** `#00d4ff` (Cyan) - Hover states, borders, secondary actions
- **Background (Dark):** `#0f0f23` (Very Dark Purple) - Main background
- **Surface:** `#1a1a2e` (Navy) - Cards, containers
- **Surface Light:** `#2d2d44` (Light Navy) - Secondary backgrounds
- **Text Main:** `#e0e0ff` (Light Lavender) - Primary text
- **Text Muted:** `#a8a8c0` (Muted Lavender) - Secondary text, hints
- **Success:** `#10b981` (Emerald) - Completed, finished
- **Warning:** `#ffa500` (Amber) - Plan to watch
- **Error:** `#ef4444` (Red) - Errors, delete

### Gradient Overlays
- Hero Overlay: `linear-gradient(to top, rgba(15, 15, 35, 0.95), rgba(15, 15, 35, 0.4))`
- Accent Glow: `0 0 20px rgba(255, 0, 110, 0.3)`
- Soft Glow: `0 10px 30px rgba(0, 0, 0, 0.5)`

### Usage Rules
- **Interactive Elements:** Always `--accent` (#ff006e) for CTAs, buttons, focus states
- **Card Backgrounds:** `rgba(26, 26, 46, 0.8)` with backdrop filter
- **Hover States:** Shift to `--tertiary` (#00d4ff) or slight brightness increase
- **Text Contrast:** Maintain 4.5:1 minimum ratio (CRITICAL)
- **Avoid:** Bright neons outside of accent color, oversaturation

---

## 2. TYPOGRAPHY

### Font Stack
- **Heading Font:** Inter, system-ui, sans-serif
  - Weight: 700-800 (Bold to Extra Bold)
  - Letter Spacing: 0.5px on very bold headings
  - Usage: Page titles, section headers, modal titles
  
- **Body Font:** Inter, system-ui, sans-serif
  - Weight: 400-500 (Regular to Medium)
  - Line Height: 1.5-1.6
  - Usage: Body text, descriptions, labels

- **Code Font:** "Courier New", monospace
  - Usage: Episode numbers, timestamps, technical info

### Sizing Rules
- **H1:** 2.2rem (35px) - Page titles
- **H2:** 1.8rem (29px) - Section headers
- **H3:** 1.3rem (21px) - Card titles
- **Body:** 0.9-1rem (14-16px) - Default text
- **Caption:** 0.75-0.8rem (12-13px) - Meta info, badges
- **Min Mobile:** 16px on body text (prevents zoom on iOS)

### Line Length
- **Max Width:** 75-80 characters per line
- **Line Height:** 1.5-1.75 for readability
- **Letter Spacing:** 0.5px on caps, standard otherwise

---

## 3. SPACING & LAYOUT

### Spacing Scale
```
4px    → Extra tight (gaps between elements)
8px    → Tight (related content)
12px   → Default (most common gap)
16px   → Comfortable (sections, padding)
20px   → Spacious (major padding)
24px   → Large (container padding)
40px   → XL (section spacing)
60px   → XXL (major section breaks)
```

### Grid System
- **Mobile:** 375px, gap 12px, padding 16px
- **Tablet:** 768px, gap 16px, padding 20px
- **Desktop:** 1024px+, gap 20px, padding 24px
- **Max Container:** 1200px

### Z-Index Scale
```
10  → Dropdowns, popovers
20  → Modals (overlay)
50  → Sticky headers, bottom bars
100 → Toasts, alerts (top layer)
999 → Overlay backdrop
1000 → Modal content
```

---

## 4. SHADOWS & DEPTH

### Shadow Tokens
- **Subtle:** `0 1px 2px rgba(0, 0, 0, 0.1)` - Minimal depth
- **Small:** `0 4px 6px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.05)` - Cards
- **Medium:** `0 10px 25px rgba(0, 0, 0, 0.2)` - Hoverable cards
- **Large:** `0 25px 50px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.05)` - Modals
- **Glow:** `0 0 20px rgba(255, 0, 110, 0.2)` - Accent elements

### Backdrop Filter
- **Standard:** `blur(10px)`
- **Heavy:** `blur(30px) saturate(180%)`
- **Light:** `blur(4px)`

---

## 5. BORDERS & RADIUS

### Border Radius
- `--radius-sm` = `6px` - Buttons, small elements
- `--radius-md` = `10px` - Cards, inputs
- `--radius-lg` = `14px` - Modals, large containers
- `--radius-xl` = `20px` - Hero sections
- `--radius-full` = `50%` - Avatars, circles

### Borders
- **Card Border:** `1px solid rgba(255, 255, 255, 0.08)`
- **Input Border:** `1px solid rgba(255, 255, 255, 0.15)` (default), `1px solid var(--accent)` (focus)
- **Subtle Line:** `1px solid rgba(255, 255, 255, 0.05)` - Dividers
- **Glow Border:** `1px solid rgba(255, 0, 110, 0.3)` - Accent elements

---

## 6. ANIMATIONS & TRANSITIONS

### Timing Functions
- **Fast:** 150ms - Micro-interactions (hover, tap)
- **Normal:** 300ms - Modal open/close, page transitions
- **Slow:** 500ms - Page entry animations
- **Timing:** `cubic-bezier(0.25, 0.46, 0.45, 0.94)` (standard ease)
- **Spring:** `stiffness: 400, damping: 25` (smooth pop)

### Animation Rules
- **Hover States:** 150-200ms transition on all interactive elements
- **Loading:** Use spinner or skeleton (never just disable)
- **Transitions:** Use `transform` and `opacity` (GPU accelerated)
- **Avoid:** Animating `width`, `height`, `left`, `top`
- **Reduced Motion:** Check `prefers-reduced-motion`, disable animations if true

### Common Patterns
- **Fade In:** `opacity: 0 → 1` (300ms)
- **Slide Up:** `translateY(20px) → 0` (300ms)
- **Scale:** `scale(0.9) → 1` (200ms, spring)
- **Hover Lift:** `translateY(-4px)` on card hover

---

## 7. COMPONENTS

### Buttons
```
PRIMARY (CTA):
- Background: var(--accent) (#ff006e)
- Padding: 12px 24px (medium)
- Border Radius: 8px
- Font Weight: 600
- Transition: 200ms
- Hover: brightness(1.1) + shadow lift
- Active: scale(0.98)

SECONDARY:
- Background: rgba(255, 255, 255, 0.08)
- Border: 1px solid rgba(255, 255, 255, 0.15)
- Hover: rgba(255, 255, 255, 0.12)

GHOST:
- Background: transparent
- Hover: rgba(255, 255, 255, 0.05)
```

### Cards
```
- Background: rgba(26, 26, 46, 0.8)
- Border: 1px solid rgba(255, 255, 255, 0.08)
- Backdrop: blur(10px)
- Shadow: 0 10px 30px rgba(0, 0, 0, 0.5)
- Border Radius: 14px
- Padding: 16-20px
- Hover: Scale 1.02 + shadow lift
```

### Modals
```
- Backdrop: rgba(15, 15, 35, 0.8) + blur(4px)
- Content: rgba(26, 26, 46, 0.95) + blur(30px)
- Border: 1px solid rgba(255, 255, 255, 0.1)
- Border Radius: 16px
- Animation: scale(0.9) → 1 (spring)
- Z-Index: 1000
```

### Dropdowns
```
- Background: rgba(0, 0, 0, 0.95)
- Backdrop: blur(30px) saturate(180%)
- Border: 1px solid rgba(255, 255, 255, 0.1)
- Border Radius: 14px
- Padding: 10px
- Options: Full width, 14px padding
- Hover: x: 4px shift + background change (200ms)
- Animation: opacity 0→1, y -20→0, scale 0.9→1 (spring)
```

### Forms
```
- Label: 0.85rem, font-weight 600, color var(--text-muted)
- Input: 14px, padding 12px, border-radius 8px
- Focus: Border var(--accent), box-shadow inset + accent glow
- Error: Border var(--error), message below
- Placeholder: rgba(168, 168, 192, 0.6)
```

### Navigation
```
- Background: rgba(15, 15, 35, 0.9) + blur(10px)
- Height: 64px (desktop), 56px (mobile)
- Border: 1px solid rgba(255, 255, 255, 0.05) (bottom)
- Links: Hover color var(--tertiary)
- Active: Underline var(--accent) (2px)
```

---

## 8. RESPONSIVE DESIGN

### Breakpoints
```
Mobile:  < 640px (default)
Tablet:  640px - 1024px
Desktop: 1024px+
```

### Touch Target Sizing
- **Minimum:** 44x44px (WCAG AA)
- **Comfortable:** 48-56px
- **Spacing Between:** 8px minimum

### Mobile Optimizations
- **Font Size:** Minimum 16px on inputs (prevents auto-zoom)
- **Touch Targets:** Increase padding to 16px
- **Layout:** Stack vertically, full width
- **Modals:** Full height with safe area insets
- **Dropdowns:** Position aware (above/below)

### Desktop Enhancements
- **Hover Effects:** Use on interactive elements
- **Cursor:** `cursor-pointer` on all clickable elements
- **Transitions:** Smooth 200-300ms on all state changes
- **Max Width:** Container max-width 1200px

---

## 9. ACCESSIBILITY (CRITICAL)

### Color Contrast
- **AA Standard:** 4.5:1 for normal text
- **AAA Standard:** 7:1 for small text
- **All text:** Must pass AA minimum

### Interactive Elements
- **Focus Visible:** Ring 2px var(--accent), offset 2px
- **Keyboard Navigation:** Tab order follows visual order
- **Aria Labels:** On icon-only buttons, hidden text if needed
- **Focus Management:** Trap focus in modals

### Semantic HTML
- Use `<button>` for buttons (not `<div role="button">`)
- Use `<label>` with `for` attribute on inputs
- Use `<nav>` for navigation
- Use `<section>` for major content areas
- Use heading hierarchy (h1 → h2 → h3, no skipping)

### Motion & Animation
- **Respect `prefers-reduced-motion`:** Remove animations if true
- **No Auto-play:** Pause on user preference
- **Loading States:** Provide feedback, don't just disable

---

## 10. ANTI-PATTERNS (DO NOT DO)

- ❌ Bright neon colors (outside accent)
- ❌ Harsh animations (snap, instant, staggered loading)
- ❌ Light mode by default (dark mode is identity)
- ❌ Emojis as icons (use SVG/Lucide)
- ❌ Animated GIFs in backgrounds
- ❌ Auto-playing videos
- ❌ Text smaller than 14px
- ❌ Line length > 100 characters
- ❌ Missing focus states
- ❌ Touch targets < 44px
- ❌ No prefers-reduced-motion support
- ❌ Low contrast text (< 4.5:1)
- ❌ Magic numbers for spacing/sizing
- ❌ Inline styles (use CSS classes)

---

## 11. PRE-DELIVERY CHECKLIST

- [ ] All text meets 4.5:1 contrast ratio
- [ ] All buttons have visible focus states
- [ ] All dropdowns are full width on their container
- [ ] Hover states smooth (150-300ms)
- [ ] Modals have proper z-index (1000)
- [ ] Images have alt text or aria-label
- [ ] Forms have proper labels
- [ ] Touch targets 44x44px minimum
- [ ] Responsive tested at 375px, 768px, 1024px, 1440px
- [ ] prefers-reduced-motion respected
- [ ] No emojis used as icons
- [ ] Cursor-pointer on clickable elements
- [ ] Animations use transform/opacity only
- [ ] No layout shifts (reserved space for lazy content)
- [ ] Loading states provided (not just disabled buttons)
- [ ] Navigation keyboard accessible
- [ ] Modal focus trapped
- [ ] Z-index follows scale (10, 20, 50, 100, 999, 1000)

---

## 12. QUICK START CODE SNIPPETS

### CSS Variables
```css
:root {
  --accent: #ff006e;
  --accent-rgb: 255, 0, 110;
  --accent-glow: 0 0 20px rgba(255, 0, 110, 0.3);
  
  --bg-primary: #0f0f23;
  --bg-secondary: #1a1a2e;
  --bg-tertiary: #2d2d44;
  
  --text-main: #e0e0ff;
  --text-muted: #a8a8c0;
  
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 14px;
  
  --shadow-sm: 0 4px 6px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.05);
  --shadow-lg: 0 25px 50px rgba(0, 0, 0, 0.3);
  
  --transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}
```

### Common Patterns
```jsx
// Card
<div className="card" style={{
  background: 'rgba(26, 26, 46, 0.8)',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  borderRadius: '14px',
  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
  padding: '16px'
}}>
</div>

// Button
<button style={{
  background: 'var(--accent)',
  color: 'white',
  padding: '12px 24px',
  borderRadius: '8px',
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'all 200ms ease',
  border: 'none'
}}>
  Action
</button>

// Focus Ring
<input style={{
  outline: 'none',
  ':focus': {
    boxShadow: '0 0 0 3px var(--accent)'
  }
}} />
```

---

## References

- **Skill:** UI/UX Pro Max v2.5.0
- **Product Type:** Entertainment - Anime Streaming
- **Industry:** Creative Media & Entertainment
- **Tech Stack:** React + Vite
- **Last Updated:** 2024
