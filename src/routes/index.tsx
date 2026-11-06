import type { ComponentType } from 'react';
import { createBrowserRouter, Navigate, type RouteObject } from 'react-router-dom';
import { PublicLayout } from '@/layouts/PublicLayout';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { AuthLayout } from '@/layouts/AuthLayout';
import ErrorPage from '@/pages/ErrorPage';
import NotFoundPage from '@/pages/NotFoundPage';
import { ProtectedRoute, AdminRoute } from '@/routes/guards';
import { AdminLayout } from '@/layouts/AdminLayout';

function lazyPage(load: () => Promise<{ default: ComponentType }>) {
  return async () => ({ Component: (await load()).default });
}

function RouteLoadingFallback() {
  return <div className="flex min-h-[50vh] items-center justify-center text-sm text-slate-500" role="status">Loading page…</div>;
}

const routes: RouteObject[] = [
  {
    HydrateFallback: RouteLoadingFallback,
    element: <PublicLayout />,
    errorElement: <ErrorPage />, 
    children: [
      { path: '/', lazy: lazyPage(() => import('@/pages/HomePage')) },
      { path: '/about', lazy: lazyPage(() => import('@/pages/AboutPage')) },
      { path: '/landing', lazy: lazyPage(() => import('@/pages/LandingPage')) },
      { path: '/blog', lazy: lazyPage(() => import('@/pages/BlogPage')) },
      { path: '/careers', lazy: lazyPage(() => import('@/pages/CareersPage')) },
      { path: '/docs', lazy: lazyPage(() => import('@/pages/DocsPage')) },
      { path: '/faq', lazy: lazyPage(() => import('@/pages/FAQPage')) },
      { path: '/gallery', lazy: lazyPage(() => import('@/pages/GalleryPage')) },
      { path: '/integrations', lazy: lazyPage(() => import('@/pages/IntegrationsPage')) },
      { path: '/map', lazy: lazyPage(() => import('@/pages/MapPage')) },
      { path: '/newsletter', lazy: lazyPage(() => import('@/pages/NewsletterPage')) },
      { path: '/pricing', lazy: lazyPage(() => import('@/pages/PricingPage')) },
      { path: '/security', lazy: lazyPage(() => import('@/pages/SecurityPage')) },
      { path: '/status', lazy: lazyPage(() => import('@/pages/StatusPage')) },
      { path: '/support', lazy: lazyPage(() => import('@/pages/SupportPage')) },
      { path: '/events', lazy: lazyPage(() => import('@/pages/EventsPage')) },
      { path: '/event/:slug', lazy: lazyPage(() => import('@/pages/EventDetailPage')) },
      { path: '/categories', lazy: lazyPage(() => import('@/pages/CategoriesPage')) },
      { path: '/category/:slug', lazy: lazyPage(() => import('@/pages/CategoryDetailPage')) },
      { path: '/continents', lazy: lazyPage(() => import('@/pages/ContinentsPage')) },
      { path: '/cities', lazy: lazyPage(() => import('@/pages/BigCitiesPage')) },
      { path: '/countries', lazy: lazyPage(() => import('@/pages/CountriesPage')) },
      { path: '/countries/:code', lazy: lazyPage(() => import('@/pages/CountryDetailPage')) },
      { path: '/country/:code', lazy: lazyPage(() => import('@/pages/CountryDetailPage')) },
      { path: '/cities/:slug', lazy: lazyPage(() => import('@/pages/CityDetailPage')) },
      { path: '/city/:slug', lazy: lazyPage(() => import('@/pages/CityDetailPage')) },
      { path: '/calendar', lazy: lazyPage(() => import('@/pages/CalendarPage')) },
      { path: '/search', lazy: lazyPage(() => import('@/pages/SearchPage')) },
      { path: '/golf-courses/:slug', lazy: lazyPage(() => import('@/pages/GolfCourseDetailPage')) },
      { path: '/contact', lazy: lazyPage(() => import('@/pages/ContactPage')) },
      { path: '/privacy-policy', lazy: lazyPage(() => import('@/pages/PrivacyPolicyPage')) },
      { path: '/terms', lazy: lazyPage(() => import('@/pages/TermsPage')) },
      { path: '/loading', lazy: lazyPage(() => import('@/pages/LoadingPage')) },
      { path: '/error', element: <ErrorPage /> },
      { path: '/offline', lazy: lazyPage(() => import('@/pages/OfflinePage')) },
      { path: '/unauthorized', lazy: lazyPage(() => import('@/pages/UnauthorizedPage')) },
      { path: '/forbidden', lazy: lazyPage(() => import('@/pages/ForbiddenPage')) },
    ],
  },
  {
    HydrateFallback: RouteLoadingFallback,
    element: <ProtectedRoute />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
          {
            element: <AdminRoute />,
            children: [
              { path: '/dashboard', lazy: lazyPage(() => import('@/pages/DashboardPage')) },
              { path: '/dashboard/analytics', lazy: lazyPage(() => import('@/pages/AnalyticsPage')) },
            ],
          },
          { path: '/notifications', lazy: lazyPage(() => import('@/pages/NotificationsPage')) },
          { path: '/profile', lazy: lazyPage(() => import('@/pages/ProfilePage')) },
          { path: '/settings', lazy: lazyPage(() => import('@/pages/SettingsPage')) },
        ],
      },
      {
        element: <AdminRoute />,
        children: [
          { path: '/admin', element: <Navigate to="/dashboard" replace /> },
          {
            element: <AdminLayout />,
            children: [
              { path: '/admin/analytics', lazy: lazyPage(() => import('@/pages/AdminAnalyticsPage')) },
              { path: '/admin/calendar', lazy: lazyPage(() => import('@/pages/AdminCalendarPage')) },
              { path: '/admin/settings', lazy: lazyPage(() => import('@/pages/AdminSettingsPage')) },
              { path: '/admin/users', lazy: lazyPage(() => import('@/pages/AdminUsersPage')) },
            ],
          },
        ],
      },
    ],
  },
  {
    HydrateFallback: RouteLoadingFallback,
    element: <AuthLayout />,
    children: [
      { path: '/login', lazy: lazyPage(() => import('@/pages/LoginPage')) },
      { path: '/register', lazy: lazyPage(() => import('@/pages/RegisterPage')) },
      { path: '/forgot-password', lazy: lazyPage(() => import('@/pages/ForgotPasswordPage')) },
      { path: '/reset-password', lazy: lazyPage(() => import('@/pages/ResetPasswordPage')) },
      { path: '/verify-email', lazy: lazyPage(() => import('@/pages/VerifyEmailPage')) },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
];

export const router = createBrowserRouter(routes, {
  future: {
    v7_normalizeFormMethod: true,
  },
});
