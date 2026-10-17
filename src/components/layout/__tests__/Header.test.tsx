import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Header } from '../Header';
import { Footer } from '../Footer';
import { AdminLayout } from '@/layouts/AdminLayout';

vi.mock('@/contexts/ThemeContext', () => ({
  useTheme: () => ({ resolvedTheme: 'light', setMode: vi.fn() }),
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

const { mockUseAuth } = vi.hoisted(() => ({ mockUseAuth: vi.fn() }));

vi.mock('@/services/catalog', () => ({
  getCountries: vi.fn().mockResolvedValue({ items: [] }),
}));

describe('Header mobile navigation', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false, signOut: vi.fn() });
  });

  it('keeps primary navigation in the intended order without unrelated entries', () => {
    const { container } = render(
      <MemoryRouter>
        <Header />
        <AdminLayout />
        <Footer />
      </MemoryRouter>,
    );
    const expectedMainLinks = [
      ['Home', '/'],
      ['Continents', '/continents'],
      ['Countries', '/countries'],
      ['Big Cities', '/cities'],
      ['About', '/about'],
    ];
    const desktopNavigation = container.querySelector('header nav') as HTMLElement;
    const readLinks = (navigation: HTMLElement) => within(navigation).getAllByRole('link').map((link) => [link.textContent, link.getAttribute('href')]);

    expect(readLinks(desktopNavigation)).toEqual(expectedMainLinks);

    fireEvent.click(screen.getByRole('button', { name: 'Open navigation menu' }));
    expect(readLinks(screen.getByRole('navigation', { name: 'Mobile navigation' }))).toEqual(expectedMainLinks);

    const adminNavigation = container.querySelector('aside nav') as HTMLElement;
    expect(readLinks(adminNavigation)).toEqual([
      ['Overview', '/admin'],
      ['Users', '/admin/users'],
      ['Analytics', '/admin/analytics'],
      ['Settings', '/admin/settings'],
    ]);

    expect(within(container.querySelector('footer') as HTMLElement).getAllByRole('link').map((link) => [link.textContent, link.getAttribute('href')])).toEqual([
      ['Categories', '/categories'],
      ['Countries', '/countries'],
      ['About', '/about'],
      ['Contact', '/contact'],
      ['Privacy', '/privacy-policy'],
      ['Terms', '/terms'],
      ['Analytics', '/analytics'],
      ['Notifications', '/notifications'],
    ]);
  });

  it('opens, closes, and closes after selecting a mobile route', () => {
    render(<MemoryRouter><Header /></MemoryRouter>);

    const toggle = screen.getByRole('button', { name: 'Open navigation menu' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('navigation', { name: 'Mobile navigation' })).not.toBeInTheDocument();

    fireEvent.click(toggle);
    expect(screen.getByRole('button', { name: 'Close navigation menu' })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('navigation', { name: 'Mobile navigation' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('navigation', { name: 'Mobile navigation' }).querySelector('a[href="/countries"]') as HTMLAnchorElement);
    expect(screen.queryByRole('navigation', { name: 'Mobile navigation' })).not.toBeInTheDocument();
  });

  it('closes when the toggle is clicked again', () => {
    render(<MemoryRouter><Header /></MemoryRouter>);
    const openToggle = screen.getByRole('button', { name: 'Open navigation menu' });
    fireEvent.click(openToggle);
    fireEvent.click(screen.getByRole('button', { name: 'Close navigation menu' }));
    expect(screen.queryByRole('navigation', { name: 'Mobile navigation' })).not.toBeInTheDocument();
  });

  it('marks About as the active route in desktop and mobile navigation', () => {
    const { container } = render(<MemoryRouter initialEntries={['/about']}><Header /></MemoryRouter>);
    const desktopAbout = container.querySelector('header nav.hidden a[href="/about"]');
    expect(desktopAbout).toHaveAttribute('aria-current', 'page');
    expect(desktopAbout).toHaveClass('text-cyan-800');

    fireEvent.click(screen.getByRole('button', { name: 'Open navigation menu' }));
    const mobileAbout = within(screen.getByRole('navigation', { name: 'Mobile navigation' })).getByRole('link', { name: 'About' });
    expect(mobileAbout).toHaveAttribute('aria-current', 'page');
    expect(mobileAbout).toHaveClass('bg-cyan-50');
  });

  it('does not show a Dashboard shortcut in the authenticated public header', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, signOut: vi.fn() });
    render(<MemoryRouter><Header /></MemoryRouter>);

    expect(screen.getByRole('button', { name: 'Sign out' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Dashboard' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Dashboard' })).not.toBeInTheDocument();
  });
});
