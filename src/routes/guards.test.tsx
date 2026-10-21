import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Navigate, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AdminRoute, ProtectedRoute } from './guards';

const { mockUseAuth } = vi.hoisted(() => ({ mockUseAuth: vi.fn() }));

vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => mockUseAuth() }));

function renderProtectedUrl(path = '/admin') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route element={<ProtectedRoute />}>
          <Route element={<AdminRoute />}>
            <Route path="/admin" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<h1>Original dashboard reached</h1>} />
          </Route>
        </Route>
        <Route path="/login" element={<h1>Sign in required</h1>} />
        <Route path="/forbidden" element={<h1>Access forbidden</h1>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('admin direct-route guards', () => {
  beforeEach(() => {
    mockUseAuth.mockReset();
  });

  it('redirects an unauthenticated visitor away from /admin', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false, user: null });
    renderProtectedUrl();
    expect(screen.getByRole('heading', { name: 'Sign in required' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Original dashboard reached' })).not.toBeInTheDocument();
  });

  it('redirects a signed-in non-admin away from /admin', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, user: { role: 'user' } });
    renderProtectedUrl();
    expect(screen.getByRole('heading', { name: 'Access forbidden' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Original dashboard reached' })).not.toBeInTheDocument();
  });

  it('redirects an authenticated administrator from /admin to the original dashboard', async () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, user: { role: 'admin' } });
    renderProtectedUrl('/admin');
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Original dashboard reached' })).toBeInTheDocument());
  });

  it('opens /dashboard directly, including on a refreshed URL', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, user: { role: 'admin' } });
    renderProtectedUrl('/dashboard');
    expect(screen.getByRole('heading', { name: 'Original dashboard reached' })).toBeInTheDocument();
  });
});
