export interface DashboardOverview {
  totalUsers: number;
  totalEvents: number;
  upcomingEvents: number;
  savedEvents: number;
  notifications: number;
  watchlist: number;
  recentEvents: Array<{ id: string; slug: string; title: string; startAt: string; countryCode?: string | null; citySlug?: string | null }>;
  recentActivity: Array<{ id: string; label: string; createdAt: string }>;
}
