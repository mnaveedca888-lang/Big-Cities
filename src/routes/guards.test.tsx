import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AdminRoute, ProtectedRoute } from './guards';

const { mockUseAuth } = vi.hoisted(() => ({ mockUseAuth: vi.fn() }));

vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => mockUseAuth() }));

function renderAdminUrl() {
  return render(
    <MemoryRouter initialEntries={['/admin']}>
      <Routes>
        <Route element={<ProtectedRoute />}>
          <Route element={<AdminRoute />}>
            <Route path="/admin" element={<h1>Admin console reached</h1>} />
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
    renderAdminUrl();
    expect(screen.getByRole('heading', { name: 'Sign in required' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Admin console reached' })).not.toBeInTheDocument();
  });

  it('redirects a signed-in non-admin away from /admin', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, user: { role: 'user' } });
    renderAdminUrl();
    expect(screen.getByRole('heading', { name: 'Access forbidden' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Admin console reached' })).not.toBeInTheDocument();
  });

  it('allows an authenticated administrator to open /admin directly', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, user: { role: 'admin' } });
    renderAdminUrl();
    expect(screen.getByRole('heading', { name: 'Admin console reached' })).toBeInTheDocument();
  });
});
