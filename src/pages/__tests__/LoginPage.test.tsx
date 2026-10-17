import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import LoginPage from '../LoginPage';

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ signIn: vi.fn() }),
}));

vi.mock('@/services/auth', () => ({
  login: vi.fn().mockResolvedValue({ data: { user: { name: 'Test User', email: 'test@example.com', role: 'member' }, accessToken: 'token' } }),
}));

describe('LoginPage', () => {
  it('renders the form fields and allows submission', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: /welcome back/i })).toBeInTheDocument();
    await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /continue/i }));

    expect(await screen.findByRole('button', { name: /continue/i })).toBeInTheDocument();
  });
});
