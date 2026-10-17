# Project Master Context (archived)

This file was archived after its contents were merged into FRONTEND_MASTER.md. Full original content below.

---

# Project Master Context

## 1. Project Overview

### Purpose
This project is a frontend-only React application for a premium “Global AI Event Monitoring Platform.” It is designed to present event discovery, browsing, dashboard, admin, authentication, and settings flows in a polished, responsive UI that is ready for future backend integration.

### Goals
- Provide a complete public-facing event discovery experience.
- Deliver authenticated dashboard and settings surfaces.
- Model admin-only routes and permissions-aware navigation.
- Establish a reusable UI system, routing architecture, and service layer for future API integration.
- Demonstrate a production-ready frontend structure with tests, linting, and a successful build.

### Current Product Scope
The current codebase implements:
- Public marketing and content pages.
- Event catalog and discovery pages.
- Search and filtering UI.
- Auth flows for login, register, forgot-password, reset-password, and verify-email.
- Protected dashboard and notifications experience.
- Admin console routes and navigation.
- Theme, settings, language, notification, and permission contexts.

### Current Status
The frontend is functionally complete from a product and architecture perspective. It has:
- A working route tree with public, protected, auth, and admin areas.
- Responsive layouts and shared UI primitives.
- A typed API/service layer.
- Automated frontend test coverage for key pages.
- Verified linting and production build.

The project is now positioned for backend development and API contract implementation.

---

## 2. Frontend Architecture

### Tech Stack
- React 19
- Vite
- TypeScript
- React Router DOM v7
- TanStack React Query
- Tailwind CSS
- React Hook Form + Zod
- Axios
- React Helmet Async
- Lucide icons
- Vitest + Testing Library

### Entry Points
- [src/main.jsx](src/main.jsx) mounts the app into the DOM.
- [src/App.tsx](src/App.tsx) composes the provider tree and router.
- [src/routes/index.tsx](src/routes/index.tsx) defines the route hierarchy.
- [src/providers/AppProviders.tsx](src/providers/AppProviders.tsx) wraps the app in global providers.

### Routing Model
The app uses a route-based layout structure:
- Public routes render inside PublicLayout.
- Auth routes render inside AuthLayout.
- Protected routes render inside DashboardLayout.
- Admin routes render inside AdminLayout.

### Layouts
- PublicLayout: public marketing and content pages.
- AuthLayout: login/register/password recovery experiences.
- DashboardLayout: workspace-style navigation for signed-in users.
- AdminLayout: admin-only console navigation.

### State Management
State is split across:
- Context providers for cross-cutting app concerns.
- React Query for asynchronous data fetching and request state.
- Local component state for form input and transient UI state.

### Context Providers
- AuthContext: authentication session state, sign-in/out, session refresh, persistence.
- ThemeContext: light/dark/system theme control.
- SettingsContext: compact mode and reduced-motion preferences.
- LanguageContext: UI language selection.
- NotificationContext: notification list and unread state.
- PermissionsContext: role-based permissions and route capability checks.

### Hooks
- useLocalStorage: persist values to localStorage.
- useDebounce, useInfiniteScroll, usePagination, useMediaQuery, useOnlineStatus, useSearch, useWindowSize: reusable UI behavior helpers.

### Services
The service layer is organized under [src/services](src/services) and uses the shared Axios client.
- auth.ts: login, registration, password reset, email verification.
- dashboard.ts: dashboard overview data.
- search.ts: event search requests.
- analytics.ts: analytics summary requests.
- catalog.ts: category requests.
- events.ts: event list and featured event requests.
- notifications.ts: notification retrieval.
- users.ts: profile retrieval.

### Design System
The frontend uses reusable UI primitives and a consistent visual language:
- Button
- Card
- Input
- FormField
- Alert
- EmptyState
- Spinner
- DataState
- Section
- Badge
- Modal/Table/Tab primitives are also present in the component tree.

---

## 3. Feature Inventory

| Feature | Purpose | Pages / Areas | Status |
|---|---|---|---|
| Public marketing shell | Introduces the platform and provides navigation | HomePage, LandingPage, AboutPage | Complete |
| Event discovery | Browse featured events and curated catalog views | EventsPage, EventDetailPage | Complete |
| Category and geography browsing | Explore categories, countries, cities | CategoriesPage, CountriesPage, CountryDetailPage, CityDetailPage | Complete |
| Search experience | Find events using query, category filters, and pagination | SearchPage | Complete |
| Authentication | Sign in, sign up, recover and reset password, verify email | LoginPage, RegisterPage, ForgotPasswordPage, ResetPasswordPage, VerifyEmailPage | Complete |
| Dashboard workspace | Display saved event and activity summaries | DashboardPage | Complete |
| Notifications | Surface notifications in a workspace area | NotificationsPage | Complete |
| Settings | Adjust theme and UI preferences | SettingsPage | Complete |
| Profile | User profile surface | ProfilePage | Complete |
| Admin console | Admin-only management views | AdminPage, AdminAnalyticsPage, AdminCalendarPage, AdminSettingsPage, AdminUsersPage | Complete |
| Content and support pages | About, docs, FAQ, contact, policy, status, support | Multiple pages | Complete |
| Error, loading, offline states | Provide graceful fallbacks | ErrorPage, LoadingPage, OfflinePage, ForbiddenPage, UnauthorizedPage, NotFoundPage | Complete |

---

## 4. Page Inventory

The following route-level pages are implemented in the current frontend:

... (full content included in original file)

