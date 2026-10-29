import { createBrowserRouter, type RouteObject } from 'react-router-dom';
import { lazy, Suspense, type ComponentType } from 'react';
import { PublicLayout } from '@/layouts/PublicLayout';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { AuthLayout } from '@/layouts/AuthLayout';
import LoadingPage from '@/pages/LoadingPage';
import ErrorPage from '@/pages/ErrorPage';
import { ProtectedRoute, AdminRoute } from '@/routes/guards';
import { AdminLayout } from '@/layouts/AdminLayout';

function lazyPage(loadPage: () => Promise<{ default: ComponentType }>) {
  const Page = lazy(loadPage);
  return {
    element: (
      <Suspense fallback={<LoadingPage />}>
        <Page />
      </Suspense>
    ),
  };
}

const routes: RouteObject[] = [
  {
    element: <PublicLayout />,
    errorElement: <ErrorPage />, 
    children: [
      { path: '/', ...lazyPage(() => import('@/pages/HomePage')) },
      { path: '/about', ...lazyPage(() => import('@/pages/AboutPage')) },
      { path: '/landing', ...lazyPage(() => import('@/pages/LandingPage')) },
      { path: '/blog', ...lazyPage(() => import('@/pages/BlogPage')) },
      { path: '/careers', ...lazyPage(() => import('@/pages/CareersPage')) },
      { path: '/docs', ...lazyPage(() => import('@/pages/DocsPage')) },
      { path: '/faq', ...lazyPage(() => import('@/pages/FAQPage')) },
      { path: '/gallery', ...lazyPage(() => import('@/pages/GalleryPage')) },
      { path: '/integrations', ...lazyPage(() => import('@/pages/IntegrationsPage')) },
      { path: '/map', ...lazyPage(() => import('@/pages/MapPage')) },
      { path: '/newsletter', ...lazyPage(() => import('@/pages/NewsletterPage')) },
      { path: '/pricing', ...lazyPage(() => import('@/pages/PricingPage')) },
      { path: '/security', ...lazyPage(() => import('@/pages/SecurityPage')) },
      { path: '/status', ...lazyPage(() => import('@/pages/StatusPage')) },
      { path: '/support', ...lazyPage(() => import('@/pages/SupportPage')) },
      { path: '/events', ...lazyPage(() => import('@/pages/EventsPage')) },
      { path: '/event/:slug', ...lazyPage(() => import('@/pages/EventDetailPage')) },
      { path: '/categories', ...lazyPage(() => import('@/pages/CategoriesPage')) },
      { path: '/category/:slug', ...lazyPage(() => import('@/pages/CategoryDetailPage')) },
      { path: '/continents', ...lazyPage(() => import('@/pages/ContinentsPage')) },
      { path: '/cities', ...lazyPage(() => import('@/pages/BigCitiesPage')) },
      { path: '/countries', ...lazyPage(() => import('@/pages/CountriesPage')) },
      { path: '/countries/:code', ...lazyPage(() => import('@/pages/CountryDetailPage')) },
      { path: '/country/:code', ...lazyPage(() => import('@/pages/CountryDetailPage')) },
      { path: '/cities/:slug', ...lazyPage(() => import('@/pages/CityDetailPage')) },
      { path: '/city/:slug', ...lazyPage(() => import('@/pages/CityDetailPage')) },
      { path: '/calendar', ...lazyPage(() => import('@/pages/CalendarPage')) },
      { path: '/search', ...lazyPage(() => import('@/pages/SearchPage')) },
      { path: '/golf-courses/:slug', ...lazyPage(() => import('@/pages/GolfCourseDetailPage')) },
      { path: '/contact', ...lazyPage(() => import('@/pages/ContactPage')) },
      { path: '/privacy-policy', ...lazyPage(() => import('@/pages/PrivacyPolicyPage')) },
      { path: '/terms', ...lazyPage(() => import('@/pages/TermsPage')) },
      { path: '/loading', element: <LoadingPage /> },
      { path: '/error', element: <ErrorPage /> },
      { path: '/offline', ...lazyPage(() => import('@/pages/OfflinePage')) },
      { path: '/unauthorized', ...lazyPage(() => import('@/pages/UnauthorizedPage')) },
      { path: '/forbidden', ...lazyPage(() => import('@/pages/ForbiddenPage')) },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
          {
            element: <AdminRoute />,
            children: [
                { path: '/dashboard', ...lazyPage(() => import('@/pages/DashboardPage')) },
                { path: '/dashboard/analytics', ...lazyPage(() => import('@/pages/AnalyticsPage')) },
            ],
          },
          { path: '/notifications', ...lazyPage(() => import('@/pages/NotificationsPage')) },
          { path: '/profile', ...lazyPage(() => import('@/pages/ProfilePage')) },
          { path: '/settings', ...lazyPage(() => import('@/pages/SettingsPage')) },
        ],
      },
      {
        element: <AdminRoute />,
        children: [{
          element: <AdminLayout />,
          children: [
            { path: '/admin', ...lazyPage(() => import('@/pages/AdminPage')) },
            { path: '/admin/analytics', ...lazyPage(() => import('@/pages/AdminAnalyticsPage')) },
            { path: '/admin/calendar', ...lazyPage(() => import('@/pages/AdminCalendarPage')) },
            { path: '/admin/settings', ...lazyPage(() => import('@/pages/AdminSettingsPage')) },
            { path: '/admin/users', ...lazyPage(() => import('@/pages/AdminUsersPage')) },
          ],
        }],
      },
    ],
  },
  {
    element: <AuthLayout />,
    children: [
      { path: '/login', ...lazyPage(() => import('@/pages/LoginPage')) },
      { path: '/register', ...lazyPage(() => import('@/pages/RegisterPage')) },
      { path: '/forgot-password', ...lazyPage(() => import('@/pages/ForgotPasswordPage')) },
      { path: '/reset-password', ...lazyPage(() => import('@/pages/ResetPasswordPage')) },
      { path: '/verify-email', ...lazyPage(() => import('@/pages/VerifyEmailPage')) },
    ],
  },
  { path: '*', ...lazyPage(() => import('@/pages/NotFoundPage')) },
];

export const router = createBrowserRouter(routes, {
  future: {
    v7_normalizeFormMethod: true,
  },
});
