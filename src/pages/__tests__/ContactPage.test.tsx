import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import ContactPage from '../ContactPage';

describe('ContactPage', () => {
  it('renders the contact form and allows submission', async () => {
    const user = userEvent.setup();
    render(<ContactPage />);

    expect(screen.getByRole('heading', { name: /contact us/i })).toBeInTheDocument();

    await user.type(screen.getByLabelText(/name/i), 'Taylor');
    await user.type(screen.getByLabelText(/email/i), 'taylor@example.com');
    await user.type(screen.getByLabelText(/message/i), 'I would like a product demo.');
    await user.click(screen.getByRole('button', { name: /send inquiry/i }));

    expect(screen.getByRole('button', { name: /inquiry sent/i })).toBeInTheDocument();
  });
});
