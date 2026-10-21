import { createBrowserRouter, Navigate, type RouteObject } from 'react-router-dom';
import { PublicLayout } from '@/layouts/PublicLayout';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { AuthLayout } from '@/layouts/AuthLayout';
import HomePage from '@/pages/HomePage';
import AboutPage from '@/pages/AboutPage';
import EventsPage from '@/pages/EventsPage';
import EventDetailPage from '@/pages/EventDetailPage';
import CategoriesPage from '@/pages/CategoriesPage';
import CountriesPage from '@/pages/CountriesPage';
import BigCitiesPage from '@/pages/BigCitiesPage';
import ContinentsPage from '@/pages/ContinentsPage';
import CountryDetailPage from '@/pages/CountryDetailPage';
import CityDetailPage from '@/pages/CityDetailPage';
import CalendarPage from '@/pages/CalendarPage';
import SearchPage from '@/pages/SearchPage';
import GolfCourseDetailPage from '@/pages/GolfCourseDetailPage';
import DashboardPage from '@/pages/DashboardPage';
import AnalyticsPage from '@/pages/AnalyticsPage';
import NotificationsPage from '@/pages/NotificationsPage';
import CategoryDetailPage from '@/pages/CategoryDetailPage';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import ForgotPasswordPage from '@/pages/ForgotPasswordPage';
import ResetPasswordPage from '@/pages/ResetPasswordPage';
import VerifyEmailPage from '@/pages/VerifyEmailPage';
import ProfilePage from '@/pages/ProfilePage';
import SettingsPage from '@/pages/SettingsPage';
import ContactPage from '@/pages/ContactPage';
import PrivacyPolicyPage from '@/pages/PrivacyPolicyPage';
import TermsPage from '@/pages/TermsPage';
import LoadingPage from '@/pages/LoadingPage';
import ErrorPage from '@/pages/ErrorPage';
import OfflinePage from '@/pages/OfflinePage';
import UnauthorizedPage from '@/pages/UnauthorizedPage';
import ForbiddenPage from '@/pages/ForbiddenPage';
import NotFoundPage from '@/pages/NotFoundPage';
import BlogPage from '@/pages/BlogPage';
import CareersPage from '@/pages/CareersPage';
import DocsPage from '@/pages/DocsPage';
import FAQPage from '@/pages/FAQPage';
import GalleryPage from '@/pages/GalleryPage';
import IntegrationsPage from '@/pages/IntegrationsPage';
import LandingPage from '@/pages/LandingPage';
import MapPage from '@/pages/MapPage';
import NewsletterPage from '@/pages/NewsletterPage';
import PricingPage from '@/pages/PricingPage';
import SecurityPage from '@/pages/SecurityPage';
import StatusPage from '@/pages/StatusPage';
import SupportPage from '@/pages/SupportPage';
import AdminAnalyticsPage from '@/pages/AdminAnalyticsPage';
import AdminCalendarPage from '@/pages/AdminCalendarPage';
import AdminSettingsPage from '@/pages/AdminSettingsPage';
import AdminUsersPage from '@/pages/AdminUsersPage';
import { ProtectedRoute, AdminRoute } from '@/routes/guards';
import { AdminLayout } from '@/layouts/AdminLayout';

const routes: RouteObject[] = [
  {
    element: <PublicLayout />,
    errorElement: <ErrorPage />, 
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/about', element: <AboutPage /> },
      { path: '/landing', element: <LandingPage /> },
      { path: '/blog', element: <BlogPage /> },
      { path: '/careers', element: <CareersPage /> },
      { path: '/docs', element: <DocsPage /> },
      { path: '/faq', element: <FAQPage /> },
      { path: '/gallery', element: <GalleryPage /> },
      { path: '/integrations', element: <IntegrationsPage /> },
      { path: '/map', element: <MapPage /> },
      { path: '/newsletter', element: <NewsletterPage /> },
      { path: '/pricing', element: <PricingPage /> },
      { path: '/security', element: <SecurityPage /> },
      { path: '/status', element: <StatusPage /> },
      { path: '/support', element: <SupportPage /> },
      { path: '/events', element: <EventsPage /> },
      { path: '/event/:slug', element: <EventDetailPage /> },
      { path: '/categories', element: <CategoriesPage /> },
      { path: '/category/:slug', element: <CategoryDetailPage /> },
      { path: '/continents', element: <ContinentsPage /> },
      { path: '/cities', element: <BigCitiesPage /> },
      { path: '/countries', element: <CountriesPage /> },
      { path: '/countries/:code', element: <CountryDetailPage /> },
      { path: '/country/:code', element: <CountryDetailPage /> },
      { path: '/cities/:slug', element: <CityDetailPage /> },
      { path: '/city/:slug', element: <CityDetailPage /> },
      { path: '/calendar', element: <CalendarPage /> },
      { path: '/search', element: <SearchPage /> },
      { path: '/golf-courses/:slug', element: <GolfCourseDetailPage /> },
      { path: '/contact', element: <ContactPage /> },
      { path: '/privacy-policy', element: <PrivacyPolicyPage /> },
      { path: '/terms', element: <TermsPage /> },
      { path: '/loading', element: <LoadingPage /> },
      { path: '/error', element: <ErrorPage /> },
      { path: '/offline', element: <OfflinePage /> },
      { path: '/unauthorized', element: <UnauthorizedPage /> },
      { path: '/forbidden', element: <ForbiddenPage /> },
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
              { path: '/dashboard', element: <DashboardPage /> },
              { path: '/dashboard/analytics', element: <AnalyticsPage /> },
            ],
          },
          { path: '/notifications', element: <NotificationsPage /> },
          { path: '/profile', element: <ProfilePage /> },
          { path: '/settings', element: <SettingsPage /> },
        ],
      },
      {
        element: <AdminRoute />,
        children: [
          { path: '/admin', element: <Navigate to="/dashboard" replace /> },
          {
            element: <AdminLayout />,
            children: [
            { path: '/admin/analytics', element: <AdminAnalyticsPage /> },
            { path: '/admin/calendar', element: <AdminCalendarPage /> },
            { path: '/admin/settings', element: <AdminSettingsPage /> },
            { path: '/admin/users', element: <AdminUsersPage /> },
            ],
          },
        ],
      },
    ],
  },
  {
    element: <AuthLayout />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },
      { path: '/forgot-password', element: <ForgotPasswordPage /> },
      { path: '/reset-password', element: <ResetPasswordPage /> },
      { path: '/verify-email', element: <VerifyEmailPage /> },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
];

export const router = createBrowserRouter(routes, {
  future: {
    v7_normalizeFormMethod: true,
  },
});
