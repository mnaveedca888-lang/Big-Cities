import { Helmet } from 'react-helmet-async';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { MapPin, Trophy, Building2, Route, Info, ExternalLink, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DataState } from '@/components/ui/data-state';
import { SafeImage } from '@/components/ui/safe-image';
import { getGolfCourseBySlug } from '@/services/golfCourses';

function formatValue(value: string | null | undefined) {
  return value && value.trim() ? value.trim() : 'Not reliably published';
}

export default function GolfCourseDetailPage() {
  const { slug = '' } = useParams();
  const normalizedSlug = slug.trim().toLowerCase();
  const navigate = useNavigate();
  const courseQuery = useQuery({
    queryKey: ['golf-course', normalizedSlug],
    queryFn: () => getGolfCourseBySlug(normalizedSlug),
    enabled: Boolean(normalizedSlug),
    retry: false,
  });

  const course = courseQuery.data;

  return (
    <>
      <Helmet>
        <title>{course ? `${course.name} | Big Cities Event Monitor` : 'Golf Course Details | Big Cities Event Monitor'}</title>
        <meta name="description" content={course ? `${course.name} details, location, and course overview in Pakistan.` : 'Golf course information and venue details.'} />
      </Helmet>

      <DataState
        isLoading={courseQuery.isLoading}
        error={courseQuery.error ? 'This golf course is unavailable right now.' : undefined}
        onRetry={() => { void courseQuery.refetch(); }}
        isEmpty={!courseQuery.isLoading && !course}
        emptyTitle="Golf course not found"
        emptyDescription="This golf course is not available in the current directory."
      >
        {course ? (
          <div className="space-y-8">
            <div className="flex items-center justify-between gap-3">
              <Button variant="outline" onClick={() => navigate(-1)} className="inline-flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Golf Courses
              </Button>
            </div>

            <div className="overflow-hidden rounded-4xl border border-slate-200 bg-white/80 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
              <div className="h-72 w-full overflow-hidden bg-slate-100 dark:bg-slate-950">
                <SafeImage
                  src={course.image}
                  alt={course.name}
                  className="h-full w-full object-cover"
                  fallbackClassName="flex h-full w-full items-center justify-center bg-slate-100 text-sm text-slate-500"
                />
              </div>

              <div className="space-y-6 p-8">
                <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-600">Sports Events</p>
                    <h1 className="mt-3 text-3xl font-semibold text-slate-950 dark:text-white">{course.name}</h1>
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                      <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4" /> {course.city}</span>
                      <span>•</span>
                      <span>{course.country}</span>
                    </div>
                  </div>
                  <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                    {formatValue(course.type)}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {[
                    { label: 'Holes', value: formatValue(course.holes), icon: Trophy },
                    { label: 'Par', value: formatValue(course.par), icon: Trophy },
                    { label: 'Length', value: formatValue(course.length), icon: Route },
                    { label: 'Location', value: formatValue(course.location), icon: MapPin },
                  ].map(({ label, value, icon: Icon }) => (
                    <Card key={label} className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <Icon className="h-4 w-4" />
                        {label}
                      </div>
                      <p className="font-semibold text-slate-950 dark:text-white">{value}</p>
                    </Card>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
              <Card className="space-y-5">
                <div className="flex items-center gap-2 text-lg font-semibold text-slate-950 dark:text-white">
                  <Info className="h-5 w-5 text-cyan-600" />
                  About the course
                </div>
                <p className="text-sm leading-6 text-slate-600 dark:text-slate-400">{course.description}</p>
                <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-950/80">
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Highlights</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">{course.importance}</p>
                </div>
              </Card>

              <Card className="space-y-5">
                <div className="flex items-center gap-2 text-lg font-semibold text-slate-950 dark:text-white">
                  <Building2 className="h-5 w-5 text-cyan-600" />
                  Course information
                </div>

                <div className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
                  <p><span className="font-semibold text-slate-950 dark:text-white">City:</span> {course.city}</p>
                  <p><span className="font-semibold text-slate-950 dark:text-white">Location:</span> {course.location}</p>
                  <p><span className="font-semibold text-slate-950 dark:text-white">Designer:</span> {formatValue(course.designer)}</p>
                  <p><span className="font-semibold text-slate-950 dark:text-white">Area:</span> {formatValue(course.area)}</p>
                  <p><span className="font-semibold text-slate-950 dark:text-white">Established:</span> {formatValue(course.established)}</p>
                </div>
              </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="space-y-4">
                <h2 className="text-xl font-semibold text-slate-950 dark:text-white">Facilities</h2>
                <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                  {course.facilities.map((facility) => (
                    <li key={facility} className="flex items-start gap-2">
                      <span className="mt-1 h-2 w-2 rounded-full bg-cyan-500" />
                      <span>{facility}</span>
                    </li>
                  ))}
                </ul>
              </Card>

              <Card className="space-y-4">
                <h2 className="text-xl font-semibold text-slate-950 dark:text-white">Official source</h2>
                {course.officialUrl ? (
                  <a href={course.officialUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm font-medium text-cyan-700 hover:text-cyan-600 dark:text-cyan-300 dark:hover:text-cyan-200">
                    Visit official website
                    <ExternalLink className="h-4 w-4" />
                  </a>
                ) : (
                  <p className="text-sm text-slate-600 dark:text-slate-400">Not available</p>
                )}
              </Card>
            </div>
          </div>
        ) : null}
      </DataState>
    </>
  );
}
