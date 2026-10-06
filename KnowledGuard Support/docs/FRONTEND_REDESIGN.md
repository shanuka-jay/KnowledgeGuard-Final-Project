# KnowledgeGuard Frontend Redesign

## Design direction

The frontend has been rebuilt around a blue-and-white enterprise SaaS visual system.

Key changes:

- New white enterprise sidebar with role-aware navigation and compact active states
- New contextual top bar with breadcrumbs, page titles, notifications, theme control, and profile access
- New blue-and-white dashboard design system for cards, KPI tiles, buttons, forms, tables, alerts, and modals
- New structured page headers across all Admin, Manager, Employee, HR, and shared pages
- New split-screen enterprise login and research-consent experience
- Reduced decorative gradients and glassmorphism in favour of clean borders, spacing, and data hierarchy
- Unified blue chart accents and interface status colours
- Improved responsive navigation for mobile and tablet layouts
- Preserved light and dark theme support

## Functionality preserved

The redesign does not change:

- React/Vite/Tailwind technology stack
- React Router paths or route guards
- User roles and authorization logic
- Axios API endpoint URLs or payload structures
- JWT authentication and password workflows
- Research-consent workflow
- Socket.IO notifications
- ML service integration
- Assessment, validation, KT planning, surveys, exports, and account workflows

## Validation

The frontend production build was validated with:

```bash
cd frontend
npm install
npm run build
```
