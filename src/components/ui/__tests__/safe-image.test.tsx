import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SafeImage } from '../safe-image';

describe('SafeImage', () => {
  it('defers image loading by default and supports eager visible images', async () => {
    const { rerender } = render(<SafeImage src="/images/below-fold.webp" alt="Below fold" />);
    expect(screen.getByRole('img', { name: 'Below fold' })).toHaveAttribute('loading', 'lazy');

    rerender(<SafeImage src="/images/hero.webp" alt="Hero" loading="eager" fetchPriority="high" />);
    const hero = await screen.findByRole('img', { name: 'Hero' });
    expect(hero).toHaveAttribute('loading', 'eager');
    expect(hero).toHaveAttribute('fetchpriority', 'high');
  });
});
