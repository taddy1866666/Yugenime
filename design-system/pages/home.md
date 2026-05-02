# Home Page - Design System Overrides

> Source of Truth: `design-system/MASTER.md`
> Page: Home

## Sections

### Hero
- Background: Full viewport dark gradient
- CTAs: Prominent, min-width 140px
- Animation: Fade in + slide on load (300ms)

### Continue Watching
- Cards: 200px width (responsive grid)
- Hover: Lift effect + shadow
- Dropdown: Full width card (left: 0, right: 0)

### Trending Now
- Grid: 4 columns desktop, 2 mobile
- Card Animations: Staggered (50ms offset)
- Dropdown: Full width card

### Latest Releases
- Similar to Trending
- Pagination: Show/Hide button (not infinite scroll)

## Improvements for This Page
- [ ] Add loading skeleton for cards
- [ ] Ensure dropdown responsive on mobile
- [ ] Add empty state messaging
- [ ] Improve section header spacing
- [ ] Add focus management for modals

---

## Checklist (from MASTER)
- [ ] All text 4.5:1 contrast
- [ ] Focus states visible
- [ ] Dropdowns full width
- [ ] Touch targets 44x44px
- [ ] Responsive at 375px, 768px, 1024px
- [ ] prefers-reduced-motion respected
- [ ] Animations use transform/opacity
- [ ] No layout shifts on load
