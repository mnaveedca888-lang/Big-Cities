# FRONTEND_MASTER

## Table of contents
- Project overview
- Frontend architecture
- Folder structure
- Routing and layouts
- Pages (inventory)
- Components & design system
- Hooks, contexts, providers
- Services & API layer
- State management
- Forms & validation
- UI/UX standards and accessibility
- Responsive design
- Loading / Empty / Error states
- Testing, linting, build
- Coding standards and conventions
- Known frontend limitations
- Frontend audit summary
- How to run locally

---

## Project overview
This repository implements the frontend for the Global AI Event Monitoring Platform. It is a React + Vite TypeScript application focused on event discovery, dashboards, admin, authentication flows, and a reusable design system. The frontend is complete and ready to integrate with a backend following the provided API contract.

Scope: public marketing pages, event catalog and details, search, auth flows (login/register/forgot/reset/verify), dashboard, notifications, settings, admin console shells.

---

## Frontend architecture
Tech stack
- React 19, Vite, TypeScript
- React Router DOM v7
- TanStack React Query for async state
- Tailwind CSS (utility-first styling)
- React Hook Form + Zod for forms & validation
- Axios HTTP client
- React Helmet Async for head management
- Vitest + Testing Library for unit tests

Entry points
- `src/main.jsx` — app bootstrap
- `src/App.tsx` — root composition and routes
- `src/providers/AppProviders.tsx` — global providers
- `src/routes/index.tsx` — route tree

Routing model
- Layout-based routes: PublicLayout, AuthLayout, DashboardLayout, AdminLayout.
- Route protections: protected routes require auth; admin routes require `admin` role/permissions.

---

## Folder structure (high-level)
- `src/`
  - `api/` — typed axios client
  - `assets/` — images and static assets
  - `components/` — reusable UI primitives and feature components
  - `contexts/` — React contexts (Auth, Theme, Settings, Language, Notifications, Permissions)
  - `hooks/` — custom hooks (useDebounce, useInfiniteScroll, useLocalStorage, etc.)
  - `layouts/` — layout shells
  - `pages/` — route-level pages
  - `providers/` — `AppProviders` composition
  - `routes/` — route definitions
  - `services/` — API service functions per domain
  - `styles/` — global and Tailwind config
  - `test/` — test utilities
  - `types/`, `utils/`, `validation/`

---

## Routing and layouts
Routing file: `src/routes/index.tsx` defines the public, auth, protected, and admin routes. Layouts:
- `PublicLayout` — marketing and public pages
- `AuthLayout` — login/register/password flows
- `DashboardLayout` — signed-in workspace navigation
- `AdminLayout` — admin console shell

Route protection uses `AuthContext` and `PermissionsContext` to block or redirect as needed.

---

## Pages (inventory)
Implemented pages include (routes):
- Home `/`
- About `/about`
- Landing `/landing`
- Blog `/blog`
- Careers `/careers`
- Docs `/docs`
- FAQ `/faq`
- Gallery `/gallery`
- Integrations `/integrations`
- Map `/map`
- Newsletter `/newsletter`
- Pricing `/pricing`
- Security `/security`
- Status `/status`
- Support `/support`
- Events `/events`
- Event detail `/event/:slug`
- Categories `/categories`
- Countries `/countries`
- Country detail `/country/:code`
- City detail `/city/:slug`
- Calendar `/calendar`
- Search `/search`
- Dashboard `/dashboard`
- Analytics `/dashboard/analytics`
- Notifications `/notifications`
- Profile `/profile`
- Settings `/settings`
- Auth pages: `/login`, `/register`, `/forgot-password`, `/reset-password`, `/verify-email`
- Contact `/contact`
- Policy pages: `/privacy-policy`, `/terms`
- Admin pages: `/admin`, `/admin/analytics`, `/admin/calendar`, `/admin/settings`, `/admin/users`
- Error/Status pages: `/loading`, `/error`, `/offline`, `/unauthorized`, `/forbidden`, `/*` (NotFound)

---

## Components & design system
Reusable primitives implemented under `src/components/ui` and `src/components`:
- Buttons (variants), Card, Input, Textarea, FormField, Alert, EmptyState, PageEmptyState, Spinner, Skeleton, Section, Badge, Breadcrumb, Progress, Avatar, Modal, Table, Tabs, Toast.
- Feature components: `EventCard`, SEO wrapper, `AppErrorBoundary`.

Design decisions
- Tailwind for utility classes and rapid iteration
- Design tokens expressed via Tailwind config
- Accessible-first where feasible: labeled form controls, semantic markup, keyboard-focusable components

---

## Hooks, contexts & providers
Hooks
- `useLocalStorage`, `useDebounce`, `useInfiniteScroll`, `usePagination`, `useMediaQuery`, `useOnlineStatus`, `useSearch`, `useWindowSize`.

Contexts
- `AuthContext`: signin, signout, refresh tokens, session persistence
- `ThemeContext`: light/dark/system
- `SettingsContext`: compact mode, reduced-motion
- `LanguageContext`: i18n selection
- `NotificationContext`: notification list and unread state
- `PermissionsContext`: RBAC checks for UI

Providers
- `AppProviders` composes QueryClient provider, Theme, Auth, Settings, Language, Permissions, Notification, and ErrorBoundary.

---

## Services & API layer
- Shared axios client in `src/api/client.ts` with auth header injection, 401 refresh interceptor, and standardized envelope handling.
- Domain services in `src/services`: `auth.ts`, `events.ts`, `search.ts`, `dashboard.ts`, `analytics.ts`, `catalog.ts`, `notifications.ts`, `users.ts`.
- OpenAPI-driven contract exists at project root `openapi.yaml` for frontend-backend integration.

---

## State management
- Async server state: TanStack React Query (QueryClient) for caching and invalidation
- Cross-cutting app state: Contexts
- Local component state for form inputs and transient UI

---

## Forms & validation
- React Hook Form for form state management
- Validation schemas: Zod for request-side validation and form schemas
- Patterns: label-first, inline errors, accessible error announcements

---

## UI/UX standards and accessibility
- Semantic HTML, ARIA roles where necessary
- Contrast and color choices support dark mode
- Keyboard navigable components, focus outlines preserved
- Forms have associated labels and error messaging
- Reduced-motion preference supported via `SettingsContext`

---

## Responsive design
- Mobile-first responsive rules; breakpoints defined in Tailwind config
- Header collapses into mobile navigation; layouts adapt from single column (mobile) to multi-column (desktop)
- Tables and cards have overflow handling and wrapping rules

---

## Loading / Empty / Error states
- `DataState` component standardizes loading, empty, and error displays across pages
- `AppErrorBoundary` handles render-time exceptions and shows fallback UI
- Forms surface errors via `Alert` and inline field errors

---

## Testing, linting & build
- Tests: `vitest` with Testing Library; key tests for Login, Contact, Settings exist
- Linting: ESLint configured and passing
- Build: Vite production build tested; assets produced and verified
- Scripts in `package.json`: `dev`, `build`, `test`, `lint`

---

## Coding standards & conventions
- TypeScript-first approach; keep types in `src/types`
- Reuse components and follow existing naming/folder conventions
- Small focused PRs; keep consistent style with Prettier/ESLint rules

---

## Known frontend limitations
- Some pages (analytics, admin) are shells with static/placeholder data
- Not all pages are fully integrated with backend APIs — frontend uses demo-auth fallback for some flows
- Larger-screen QA and full accessibility audit remain as future work

---

## Frontend audit summary
- Responsive QA performed for narrow viewports; header/nav/table overflow issues addressed
- Tests (3) pass; lint and build pass
- Improvements added: DataState usage, responsive header tweaks, table overflow handling

---

## How to run locally
Prereqs: Node 20+, npm
Commands:
```bash
npm install
npm run dev
npm test
npm run build
```

---

## Appendix: References
Original docs merged and archived: see `docs/archived/` for the original files and full details. Use `openapi.yaml` for API contract details.
