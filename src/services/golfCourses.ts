import { golfCourseDirectory } from '@/data/golfCourses';
import type { GolfCourse } from '@/data/golfCourses';

export async function getGolfCourses(): Promise<GolfCourse[]> {
  return golfCourseDirectory;
}

export async function getGolfCourseBySlug(slug: string): Promise<GolfCourse | null> {
  const normalizedSlug = String(slug ?? '').trim().toLowerCase();
  return golfCourseDirectory.find((course) => course.slug.toLowerCase() === normalizedSlug) ?? null;
}
