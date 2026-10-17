import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it } from 'vitest';
import GolfCourseDetailPage from '../GolfCourseDetailPage';
import { getGolfCourseBySlug, getGolfCourses } from '@/services/golfCourses';

function renderPage(initialEntry: string) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route path="/golf-courses/:slug" element={<GolfCourseDetailPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('GolfCourseDetailPage', () => {
  it('returns the verified canonical data for Defence Raya', async () => {
    const course = await getGolfCourseBySlug('defence-raya-golf-and-country-club');

    expect(course).not.toBeNull();
    expect(course?.name).toBe('Defence Raya Golf & Country Club');
    expect(course?.city).toBe('Lahore');
    expect(course?.slug).toBe('defence-raya-golf-and-country-club');
    expect(course?.holes).toBe('18');
    expect(course?.par).toBe('72');
    expect(course?.length).toBe('7,075 yd');
    expect(course?.area).toBe('400+ acres (golf resort)');
    expect(course?.designer).toBe('Nelson & Haworth');
  });

  it('keeps one canonical dataset and unique slugs for all 14 golf courses', async () => {
    const courses = await getGolfCourses();

    expect(courses).toHaveLength(14);
    const slugs = courses.map((course) => course.slug);
    expect(new Set(slugs).size).toBe(courses.length);
    expect(slugs).toContain('defence-raya-golf-and-country-club');
    expect(slugs).toContain('karachi-golf-club');
    expect(slugs).toContain('rawalpindi-golf-club');
    expect(slugs).toContain('islamabad-golf-club');
    expect(slugs).toContain('rumanza-golf-and-country-club');
  });

  it('renders the requested golf course details for all canonical slugs', async () => {
    const courses = await getGolfCourses();

    for (const course of courses) {
      const { unmount } = renderPage(`/golf-courses/${course.slug}`);
      expect(await screen.findByRole('heading', { name: course.name })).toBeInTheDocument();
      expect(screen.getAllByText(course.city).length).toBeGreaterThan(0);
      unmount();
    }
  });

  it('shows the not found state for an unavailable course slug', async () => {
    renderPage('/golf-courses/unknown-course');

    expect(await screen.findByText(/Golf course not found/i)).toBeInTheDocument();
    expect(screen.getByText(/This golf course is not available in the current directory/i)).toBeInTheDocument();
  });
});
