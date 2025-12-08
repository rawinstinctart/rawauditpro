# SiteScout AI - Design Guidelines

## Design Approach

**System Selected**: Material Design 3 (Material You) adapted for enterprise data applications
**Justification**: Information-dense SEO analytics tool requiring clear hierarchy, robust component library, and professional polish. Material Design provides established patterns for complex data visualization, tables, and systematic information architecture.

**Key Principles**:
- Data clarity over decoration
- Instant comprehension of status and severity
- Professional enterprise aesthetic
- Systematic information hierarchy
- Efficient workspace layout

---

## Typography System

**Font Family**: 
- Primary: Inter (via Google Fonts CDN)
- Monospace: JetBrains Mono (for code/diffs/URLs)

**Hierarchy**:
- **Dashboard Headers**: text-2xl font-semibold (24px)
- **Section Titles**: text-xl font-semibold (20px)
- **Card Headers**: text-lg font-medium (18px)
- **Body Text**: text-base font-normal (16px)
- **Metadata/Labels**: text-sm font-medium (14px)
- **Auxiliary Info**: text-xs font-normal (12px)
- **Code/URLs**: text-sm font-mono (14px monospace)

---

## Layout System

**Spacing Primitives**: Tailwind units of **2, 4, 6, 8, 12, 16** (rem-based)
- Tight spacing: p-2, gap-2 (component internals)
- Standard spacing: p-4, gap-4 (cards, sections)
- Section spacing: p-6, p-8 (major containers)
- Page margins: p-12, p-16 (outer containers)

**Grid Structure**:
- Main layout: Sidebar (w-64 fixed) + Main content (flex-1)
- Dashboard cards: grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6
- Audit table: Full-width responsive with horizontal scroll
- Agent logs: Single column stream with timestamp gutter

---

## Core Components

### Navigation
**Sidebar** (fixed, w-64):
- Logo/branding at top (h-16)
- Navigation items with icons (h-12 each, px-4)
- Active state: subtle left border indicator (border-l-4)
- User profile at bottom (p-4)
- Collapsible on mobile (transforms to top bar)

### Dashboard Cards
**Metric Cards**:
- Rounded corners: rounded-lg
- Padding: p-6
- Shadow: shadow-md hover:shadow-lg transition
- Structure: Large metric number (text-3xl font-bold) + label (text-sm) + trend indicator

**Website Cards**:
- Include: Site favicon (w-10 h-10), domain name, last audit timestamp, health score badge
- Actions: kebab menu (top-right) for edit/delete/audit
- Grid layout with consistent card heights

### Data Tables
**Audit Results Table**:
- Sticky header with sort indicators
- Alternating row treatment for readability
- Columns: Issue type, Severity badge, Page URL, Details, Action buttons
- Row height: h-14 for comfortable scanning
- Action column: fixed right position
- Responsive: horizontal scroll on mobile, maintain all columns

**Severity Badges**:
- Critical: Large, prominent (px-3 py-1.5, rounded-full, font-semibold)
- High: Medium prominence (px-2.5 py-1, rounded-full, font-medium)
- Medium: Standard (px-2 py-0.5, rounded, font-normal)
- Low: Subtle (px-2 py-0.5, rounded, text-xs)

### Diff Viewer
**Side-by-Side Comparison**:
- Layout: grid grid-cols-2 gap-4
- Left panel: "Current" with monospace font
- Right panel: "Proposed" with monospace font
- Line numbers in gutter (w-12, text-right, text-xs)
- Highlighted changes: inline indicators for additions/deletions
- Container: p-4, rounded-lg, max-height with scroll

### Multi-Agent Log Panel
**Live Activity Stream**:
- Fixed position right sidebar OR bottom expandable panel (h-80)
- Entry structure: 
  - Agent avatar/icon (w-8 h-8, rounded-full)
  - Agent name badge (Strategy/Audit/Content/Fix/Ranking)
  - Timestamp (text-xs, text-right)
  - Message content (text-sm, pl-12)
  - Indent level for sub-actions (pl-16)
- Auto-scroll to latest entry
- Thinking indicators: subtle animated dots for active agents

### Modals & Overlays
**AI Suggestion Popup**:
- Centered modal: max-w-2xl, p-8
- Header: Suggested change title + close button
- Body: Before/After comparison in cards
- Risk indicator: prominent badge
- Footer: Approve/Reject/Edit buttons (gap-4)
- Backdrop: semi-transparent overlay

**Approval Workflow**:
- Change preview with impact assessment
- Confidence score visualization (progress bar)
- Reasoning display: expandable "Why this change?" section
- Batch approval interface for multiple low-risk changes

---

## Feature-Specific Layouts

### Login Page
- Centered card (max-w-md)
- Logo + app name (centered, mb-8)
- "Sign in with Google" button (w-full, h-12)
- Brief tagline below (text-sm, centered)

### Main Dashboard
- Top metrics row: grid-cols-3 for total sites, active audits, pending changes
- Recent activity feed: single column, max 10 items with "View all" link
- Quick actions card: prominent CTAs for "Add Website", "Start Audit"
- Agent status indicators: chips showing which agents are active

### Website Manager
- Header with "Add Website" button (top-right)
- Search/filter bar (w-full, mb-6)
- Grid of website cards (3 columns desktop, 1 mobile)
- Empty state: centered illustration + CTA when no sites

### Audit View (Detailed)
- Breadcrumb navigation (mb-4)
- Summary cards row: Issues found, Critical count, Avg. score
- Tabbed interface: Overview / On-Page / Technical / Content
- Issue list with inline expand for details
- Bulk actions toolbar when items selected

### Settings Page
- Two-column layout: Settings menu (w-1/4) + content area (w-3/4)
- Sections: Account, Blogger API, Preferences, Agent Configuration
- Form inputs with clear labels and helper text (text-xs below)

---

## Interaction Patterns

**Loading States**:
- Skeleton screens for table rows and cards
- Spinner for agent thinking (pulsing dots)
- Progress bars for audit execution (with percentage)

**Notifications**:
- Toast notifications (top-right): max-w-sm, p-4, rounded-lg
- Success/Error/Info variants with icons
- Auto-dismiss after 5s with manual close option

**Animations**: Minimal and purposeful
- Card hover elevation (shadow transition)
- Sidebar collapse/expand (transform transition)
- Table row hover (subtle background shift)
- NO scroll-triggered animations
- NO page transitions beyond simple fades

---

## Responsive Breakpoints

- **Mobile** (< 768px): Single column, collapsible sidebar → top bar, stack all grids
- **Tablet** (768px - 1024px): 2-column grids, sidebar visible
- **Desktop** (> 1024px): Full 3-column grids, fixed sidebar, optimal spacing

---

## Accessibility Standards

- All interactive elements: min-height h-10 (touch target)
- Focus indicators: ring-2 offset-2 on all focusable elements
- ARIA labels for icon-only buttons
- Semantic HTML: proper heading hierarchy, table structure
- Keyboard navigation: full support for tab, enter, escape
- Screen reader announcements for agent activity and status changes

---

## Icons

**Library**: Heroicons (via CDN - Outline for navigation, Solid for status indicators)

**Usage**:
- Navigation items: w-5 h-5
- Action buttons: w-4 h-4
- Status badges: w-3 h-3
- Agent avatars: custom colored circles with initials

---

This design creates a professional, data-focused SEO analytics platform with clear visual hierarchy, systematic information architecture, and efficient workflows for managing complex multi-agent automation.