import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import SettingsPage from '../SettingsPage';

vi.mock('@/contexts/SettingsContext', () => ({
  useSettings: () => ({
    compactMode: false,
    reduceMotion: false,
    setCompactMode: vi.fn(),
    setReduceMotion: vi.fn(),
  }),
}));

vi.mock('@/contexts/ThemeContext', () => ({
  useTheme: () => ({ mode: 'light', setMode: vi.fn() }),
}));

describe('SettingsPage', () => {
  it('renders the preference controls', async () => {
    const user = userEvent.setup();
    render(<SettingsPage />);

    expect(screen.getByRole('heading', { name: /settings/i })).toBeInTheDocument();
    await user.click(screen.getByRole('checkbox', { name: /compact mode/i }));
    await user.click(screen.getByRole('checkbox', { name: /reduce motion/i }));
  });
});
