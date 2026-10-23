import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it } from 'vitest';
import { AuthProvider, useAuth } from './AuthContext';

function AuthControls() {
  const { signIn, signOut, isAuthenticated } = useAuth();
  return (
    <div>
      <button type="button" onClick={() => signIn({ id: 'user-1', name: 'Test User', email: 'test@example.com', role: 'user', avatar: '' })}>Sign in</button>
      <button type="button" onClick={signOut}>Sign out</button>
      <span>{isAuthenticated ? 'authenticated' : 'anonymous'}</span>
    </div>
  );
}

describe('AuthProvider query cache isolation', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  it('clears cached responses when the authentication identity changes', async () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(['dashboard-overview'], { privateValue: 'previous account' });

    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <AuthControls />
        </AuthProvider>
      </QueryClientProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    await waitFor(() => expect(queryClient.getQueryData(['dashboard-overview'])).toBeUndefined());

    queryClient.setQueryData(['dashboard-overview'], { privateValue: 'signed-in account' });
    fireEvent.click(screen.getByRole('button', { name: 'Sign out' }));
    await waitFor(() => expect(queryClient.getQueryData(['dashboard-overview'])).toBeUndefined());
  });
});
