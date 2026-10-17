# Changelog

## 2026-08-03

- Improved shared UI accessibility semantics for alerts, data states, and skeleton components.
- Improved error-page usability with retry and home actions.
- Continued frontend audit and documented remaining work.
- Added comprehensive project master documentation and AI handoff documentation for backend transition.

## 2026-07-31

- Added the expanded frontend audit and completion matrix.
- Fixed Vite path resolution so lint passes in ESM mode.
- Added persistent auth state, protected routes, and admin role guards.
- Wired previously unreachable public and admin pages.
- Added shared SEO, API error, search, analytics, formatting, and responsive hooks.
- Added this changelog and project structure reference.
- Added Zod-backed login validation and an accessible reusable form-field wrapper.
- Added login submission behavior with protected-route redirect handling.
- Added validated registration and forgot-password forms.
- Added reset-password and verify-email routes and screens.
- Added auth service contracts for password reset and email verification.
- Added an explicit bundle warning budget in Vite for the current dependency graph.
- Added notification, settings, and language contexts with persistent preferences.
- Added a global application error boundary and centralized provider composition.
- Updated `useNotification` to consume shared notification state.
- Added permission-aware context and reusable permission route guard.
- Added a shared `DataState` component for loading, error, retry, and empty states.
- Added typed auth sessions, refresh-token API contract, and client-side expiry cleanup.
- Added explicit auth refresh state and failure cleanup through `AuthContext.refresh`.
- Added one-shot Axios 401 refresh retry with loop protection and token rotation.
- Connected login and registration forms to the auth service API.
- Added remember-me storage selection, submission spinners, API error alerts, and reset-link success feedback.
- Completed email verification mutation UI with token validation, loading, success, and expiry error states.
- Added URL-synchronized search queries with TanStack Query results and retry/empty states.
- Added typed dashboard overview service with query-backed loading and retry states.
- Added category filtering, saved-search persistence, and pagination controls to search.
- Expanded SEO metadata with Open Graph, Twitter Cards, canonical URLs, and JSON-LD support.
- Added local demo-auth fallback when the API base remains the placeholder host, allowing dashboard preview without a backend.
- Added local demo dashboard overview data so the dashboard preview works without a backend.

## Next

- Complete validated authentication forms and session lifecycle.
- Add shared query state, notification context, and route-level error handling.
