import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { SettingsProvider } from '@/contexts/SettingsContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { AppErrorBoundary } from '@/components/system/AppErrorBoundary';
import { PermissionsProvider } from '@/contexts/PermissionsContext';
import { ToastProvider } from '@/components/ui/toast';
import { ReactNode, useState } from 'react';
import { shouldRetryQuery } from '@/providers/queryRetry';

export function AppProviders({ children }: { children: ReactNode }) {
  const [client] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        retry: shouldRetryQuery,
        refetchOnWindowFocus: false,
        staleTime: 1000 * 60 * 5,
      },
    },
  }));

  return (
    <AppErrorBoundary>
      <HelmetProvider>
      <QueryClientProvider client={client}>
        <ThemeProvider>
          <AuthProvider>
            <SettingsProvider>
              <LanguageProvider>
                <PermissionsProvider>
                  <NotificationProvider>
                    <ToastProvider>{children}</ToastProvider>
                  </NotificationProvider>
                </PermissionsProvider>
              </LanguageProvider>
            </SettingsProvider>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
      </HelmetProvider>
    </AppErrorBoundary>
  );
}
