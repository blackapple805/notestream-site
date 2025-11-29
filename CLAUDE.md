# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

NoteStream is a React-based web application for intelligent note-taking with AI-powered summaries. Built with Vite, the app features a dual-interface architecture: a marketing website for public-facing pages and a comprehensive dashboard for authenticated users.

## Development Commands

```bash
# Start development server with HMR
npm run dev

# Build for production
npm run build

# Lint the codebase
npm run lint

# Preview production build
npm run preview
```

## Tech Stack

- **Framework**: React 18.3.1 with Vite 5.2.0
- **Routing**: React Router DOM 7.9.6
- **Styling**: Tailwind CSS 3.4.13 with custom dark theme
- **UI Components**: NextUI 2.6.11
- **Icons**: Phosphor React 1.4.1, React Icons 5.5.0
- **Animations**: Framer Motion 11.2.13
- **Charts**: Recharts 3.4.1
- **Linting**: ESLint 9.36.0

## Architecture

### Dual-Interface Structure

The application uses a split routing architecture managed in `src/App.jsx`:

1. **Public Website** (`/*` routes): Marketing pages with custom page transitions, navbar, and footer
2. **Dashboard** (`/dashboard/*` routes): Authenticated user workspace with sidebar navigation

This separation is achieved through distinct route wrappers:
- `MainAppWrapper`: Handles public pages with animated transitions, conditional navbar visibility, and footer
- `DashboardLayout`: Provides persistent sidebar (desktop) and bottom navigation (mobile) without public page elements

### Route Organization

**Public Routes** (managed by `PublicPageTransitions`):
- Home landing page (Hero, Demo, Problem, Signup sections)
- Feature pages: `/smart-notes`, `/ai-summary`, `/integrations`
- Info pages: `/how-it-works`, `/updates`, `/support`, `/faq`
- Auth pages: `/signup`, `/login`, `/search`, `/terms`

**Dashboard Routes** (nested under `/dashboard`):
- Main dashboard: `/dashboard`
- Workspace views: `notes`, `summaries`, `documents`, `activity`
- Features: `ai-lab` (Pro), `settings`

### Component Structure

```
src/
├── components/       # Reusable UI components
│   ├── Navbar.jsx   # Public site navigation
│   ├── Sidebar.jsx  # Dashboard navigation (desktop + mobile variants)
│   ├── Hero.jsx     # Landing page hero section
│   ├── Demo.jsx     # Product demonstration
│   └── ...
├── pages/           # Route-specific page components
│   ├── Dashboard.jsx    # Main dashboard with stats/charts
│   ├── Login.jsx        # Authentication
│   └── ...
├── layouts/
│   └── DashboardLayout.jsx  # Dashboard wrapper with sidebar
├── App.jsx          # Root routing configuration
└── main.jsx         # Entry point with NextUIProvider
```

## Key Patterns

### Page Transitions

Public pages use Framer Motion with `AnimatePresence` for directional slide animations. The `PublicPageTransitions` component:
- Shows a page loader on route changes (650ms delay)
- Animates pages based on navigation direction (forward/backward)
- Uses blur effects during transitions

Dashboard pages use simpler fade-in transitions defined in `DashboardLayout`.

### Responsive Navigation

The app implements dual navigation strategies:

**Desktop (`md:` breakpoint and up)**:
- Fixed left sidebar (220px width) with scroll-based collapse behavior
- Collapses to icon-only view (72px) when scrolling down past 60px

**Mobile (below `md:` breakpoint)**:
- Fixed bottom navigation bar with icon + label layout
- Persistent across all dashboard pages
- Content has `pb-[110px]` to prevent overlap

### Styling Conventions

- **Dark Theme**: Primary background `#0b0b0e`, glass cards with `backdrop-blur-xl`
- **Accent Color**: Indigo (`indigo-500/indigo-600`) with glow effects
- **Glass Morphism**: Semi-transparent backgrounds (`bg-[#ffffff08]`) with blur and subtle borders
- **Hover States**: Border color transitions and shadow intensification
- **Responsive Text**: Uses `text-xs sm:text-sm md:text-base` pattern

### Chart Components

Dashboard uses Recharts with custom styling:
- `MiniLine`: Simple line charts for trends
- `MiniArea`: Area charts with gradient fills
- `StreakBars`: Custom div-based bar visualization
- `ClarityGauge`: RadialBarChart for percentage scores

All charts use `ResponsiveContainer` for fluid sizing.

### ESLint Configuration

Custom rule: `no-unused-vars` allows uppercase-prefixed variables (React components) to be unused without errors (`varsIgnorePattern: '^[A-Z_]'`).

## Common Development Tasks

**Adding a new public page**:
1. Create component in `src/pages/`
2. Import in `src/App.jsx`
3. Add route within `PublicPageTransitions` component

**Adding a new dashboard page**:
1. Create component in `src/pages/`
2. Import in `src/App.jsx`
3. Add nested route under `/dashboard` in the `DashboardLayout` route
4. Add navigation item to `navItems` arrays in both `Sidebar.jsx` and `DashboardLayout.jsx`

**Working with animations**:
- Use Framer Motion's `motion` components with `variants` pattern
- Follow existing transition timing: 0.35s for entrances, 0.28s for exits
- Apply `AnimatePresence` with `mode="wait"` for page transitions

**Styling components**:
- Use Tailwind utility classes, avoiding inline styles except for dynamic values
- Follow the glass morphism pattern: semi-transparent background + border + backdrop-blur
- Apply responsive breakpoints consistently: `sm:` (640px), `md:` (768px), `xl:` (1280px)
