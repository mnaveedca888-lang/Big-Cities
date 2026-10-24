export type ThemeMode = 'light' | 'dark' | 'system';

export interface EventItem {
  id: string;
  slug: string;
  title: string;
  description: string;
  categoryId?: string;
  category?: string;
  country?: string;
  countryCode?: string;
  city?: string;
  citySlug?: string;
  date?: string;
  dateText?: string;
  time?: string;
  startAt?: string;
  endAt?: string;
  dateOnly?: boolean;
  location?: string;
  significance?: string;
  notes?: string;
  price?: string;
  image?: string;
  sourceName?: string | null;
  sourceUrl?: string | null;
  sourceType?: string | null;
  primarySourceUrl?: string | null;
  primarySourceName?: string | null;
  primarySourceType?: string | null;
  discoverySourceUrl?: string | null;
  discoverySourceName?: string | null;
  verificationStatus?: 'VERIFIED' | 'PARTIALLY_VERIFIED' | 'UNVERIFIED' | 'REJECTED' | string;
  verificationScore?: number | null;
  verificationReason?: string | null;
  verifiedAt?: string | null;
  lastCheckedAt?: string | null;
  externalEventId?: string;
  venue?: string | null;
  featured?: boolean;
  trending?: boolean;
  enabled?: boolean;
  organizer?: string | null;
  province?: string | null;
  language?: string;
  tags?: string | string[] | null;
  attendees?: number;
}

export interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  createdAt?: string;
  count?: number;
}

export interface CountryItem {
  code: string;
  name: string;
  continent?: string | null;
  region?: string | null;
  cities?: number;
  events?: number;
  image?: string;
  flagImage?: string | null;
  profile?: Record<string, unknown> | null;
}

export interface ContinentItem {
  id: string;
  name: string;
  countries?: number;
}

export interface CityItem {
  slug: string;
  name: string;
  countryCode?: string;
  country?: string;
  events?: number;
  image?: string;
  population?: string | null;
  shortDescription?: string | null;
  profile?: Record<string, unknown> | null;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar: string;
  isEmailVerified?: boolean;
}
