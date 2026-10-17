# Project Structure

```text
src/
├── api/          Axios client and transport concerns
├── assets/       Bundled images and static assets
├── components/   Reusable UI, feature, layout, and SEO components
├── config/       Site and runtime configuration
├── constants/    Routes and domain constants
├── contexts/     Auth, theme, notification, settings, language, and permissions state
├── hooks/        Reusable React hooks
├── layouts/      Public, auth, dashboard, and admin shells
├── pages/        Route-level screens
├── providers/    Query, theme, auth, preference, notification, and error composition
├── routes/       Router definition and access guards
├── services/     Domain API services
├── types/        Shared TypeScript models, including auth sessions and API contracts
└── utils/        Framework-independent helpers
docs/
├── FRONTEND_AUDIT.md
├── CHANGELOG.md
└── PROJECT_STRUCTURE.md
```

## Data Flow

Pages compose layouts and reusable components. Domain services call the shared Axios client. TanStack Query is the intended cache and request-state boundary. Contexts own cross-cutting client state such as authentication and theme preferences.

## Route Groups

- Public routes render inside `PublicLayout`.
- Authentication routes render inside `AuthLayout`.
- Signed-in routes pass through `ProtectedRoute` and render inside `DashboardLayout`.
- Admin routes pass through `AdminRoute` and render inside `AdminLayout`.

## Cross-Cutting State

- `AuthContext` owns the signed-in user and logout cleanup.
- Auth pages use Zod + React Hook Form and call `services/auth.ts` for login, registration, and password recovery.
- `VerifyEmailPage` consumes the token query parameter and calls the email verification service.
- `SearchPage` synchronizes its query with the URL and uses TanStack Query for result state.
- `DashboardPage` consumes the typed dashboard overview service with retryable query state.
- `SEO` supports canonical, Open Graph, Twitter Card, and JSON-LD metadata.
- `config/runtime.ts` centralizes the API base URL and development demo-auth detection.
- `ThemeContext` owns light/dark/system appearance.
- `NotificationContext` owns unread counts and notification mutations.
- `SettingsContext` persists compact-mode and reduced-motion preferences.
- `LanguageContext` persists the selected UI language.
- `PermissionsContext` derives role-based capabilities for UI and routes.
- `AppErrorBoundary` provides a last-resort recovery surface around the provider tree.
- `DataState` standardizes loading, error, retry, and empty rendering at feature boundaries.
