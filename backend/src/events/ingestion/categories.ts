import { DAILY_EVENT_CATEGORIES, type DailyEventCategory } from './types';

export const PAKISTAN_GOLF_VENUES = [
  'Defence Raya Golf & Country Club',
  'Royal Palm Golf & Country Club',
  'Lahore Garrison Golf & Country Club',
  'Lahore Gymkhana Golf Club',
  'PAF Skyview Golf & Country Club',
  'Karachi Golf Club',
  'Defence Authority Country & Golf Club',
  'Airmen Golf Club & Recreational Park',
  'Arabian Sea Country Club',
  'Rawalpindi Golf Club',
  'Islamabad Golf Club',
  'Margalla Greens Golf Club',
  'Chinar Golf Club',
  'Rumanza Golf & Country Club',
] as const;

const categoryRules: Array<{ category: DailyEventCategory; keywords: string[] }> = [
  { category: 'Sports Events', keywords: ['sport', 'cricket', 'football', 'soccer', 'hockey', 'tennis', 'badminton', 'basketball', 'volleyball', 'golf', 'athletics', 'running', 'cycling', 'boxing', 'martial arts', 'motorsport', 'swimming', 'aquatics', 'squash', 'table tennis', 'snooker', 'billiards', 'esports', 'match', 'race', 'cup', 'championship', 'tournament'] },
  { category: 'Tech Events', keywords: ['technology conference', 'tech conference', 'technology event', 'tech event', 'startup conference', 'startup event', 'hackathon', 'software conference', 'artificial intelligence conference', 'ai conference', 'developer conference'] },
  { category: 'Conferences', keywords: ['technology conference', 'business conference', 'finance conference', 'banking conference', 'healthcare conference', 'medical conference', 'education conference', 'science conference', 'research conference', 'engineering conference', 'ai conference', 'data conference', 'agriculture conference', 'energy conference', 'trade conference', 'investment conference', 'tourism conference', 'government conference', 'policy conference', 'international conference', 'academic conference', 'industry conference', 'conference', 'summit'] },
  { category: 'Tourism & Travel', keywords: ['tourism festival', 'travel expo', 'travel show', 'tourism conference', 'tourism forum', 'tourism investment conference', 'destination promotion', 'cultural tourism', 'adventure tourism', 'mountain trekking', 'heritage tourism', 'tourism workshop', 'tourism roadshow', 'tourism event', 'travel fair', 'tourism networking event'] },
  { category: 'Cultural Celebration', keywords: ['cultural celebration', 'cultural festival', 'heritage festival', 'cultural event', 'traditional celebration', 'cultural program', 'cultural programme', 'arts and culture'] },
  { category: 'Concerts', keywords: ['concert', 'music', 'singer', 'band', 'orchestra', 'live music'] },
  { category: 'Theatre Shows', keywords: ['theatre', 'theater', 'drama', 'stage play', 'musical play'] },
  { category: 'Art Exhibitions', keywords: ['art exhibition', 'art show', 'gallery', 'painting', 'sculpture', 'exhibition', 'expo'] },
  { category: 'Tech Events', keywords: ['technology', 'tech ', 'agritech', 'agriculture technology', 'startup', 'hackathon', 'software', 'artificial intelligence', ' ai ', 'developer'] },
  { category: 'Educational Seminars', keywords: ['seminar', 'summit', 'workshop', 'education', 'educational event', 'educational fair', 'training', 'symposium', 'lecture', 'talk', 'panel discussion', 'book launch', 'university event', 'information session', 'phd defence', 'webinar', 'global fair'] },
  { category: 'Film Festivals', keywords: ['film festival', 'movie festival', 'cinema', 'screening', 'film'] },
  { category: 'Food Festivals', keywords: ['food festival', 'food expo', 'culinary', 'taste', 'cooking'] },
  { category: 'Fashion Shows', keywords: ['fashion', 'runway', 'designer', 'couture'] },
  { category: 'Dignitary Visits', keywords: ['president', 'prime minister', 'minister', 'ambassador', 'dignitary', 'official visit'] },
  { category: 'Government Events', keywords: ['government', 'ministry', 'parliament', 'policy', 'public hearing', 'assembly'] },
];

function normalize(value: string) {
  return ` ${value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()} `;
}

export function categorySlug(category: DailyEventCategory) {
  return category.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export function inferSubcategoryTags(category: DailyEventCategory, title: string, description: string | null = null) {
  const text = normalize(`${title} ${description ?? ''}`);
  const tags = new Set<string>([category.toLowerCase()]);
  if (category === 'Sports Events') {
    const sportMap: Array<[string, string]> = [
      ['golf championship', 'golf course'],
      ['golf tournament', 'golf course'],
      ['amateur golf', 'golf course'],
      ['professional golf', 'golf course'],
      ['ladies golf', 'golf course'],
      ['junior golf', 'golf course'],
      ['senior golf', 'golf course'],
      ['inter-club golf', 'golf course'],
      ['corporate golf', 'golf course'],
      ['invitational golf', 'golf course'],
      ['qualifying golf', 'golf course'],
      ['golf cup', 'golf course'],
      ['golf course', 'golf course'],
      ['golf club', 'golf course'],
      ['golf', 'golf course'],
      ['cricket', 'cricket'],
      ['football', 'football'],
      ['soccer', 'football'],
      ['hockey', 'hockey'],
      ['tennis', 'tennis'],
      ['badminton', 'badminton'],
      ['basketball', 'basketball'],
      ['volleyball', 'volleyball'],
      ['athletics', 'athletics'],
      ['running', 'athletics'],
      ['cycling', 'cycling'],
      ['boxing', 'boxing'],
      ['martial arts', 'boxing'],
      ['motorsport', 'motorsports'],
      ['swimming', 'swimming'],
      ['aquatics', 'swimming'],
      ['squash', 'squash'],
      ['table tennis', 'table tennis'],
      ['snooker', 'snooker'],
      ['billiards', 'snooker'],
      ['esports', 'e-sports'],
    ];
    for (const [phrase, tag] of sportMap) {
      if (text.includes(normalize(phrase))) tags.add(tag);
    }
  }
  if (category === 'Tourism & Travel') {
    const tourismMap: Array<[string, string]> = [
      ['tourism festival', 'tourism festival'],
      ['travel expo', 'travel expo'],
      ['travel show', 'travel expo'],
      ['tourism conference', 'tourism conference'],
      ['tourism forum', 'tourism forum'],
      ['tourism investment conference', 'tourism investment conference'],
      ['destination promotion', 'destination promotion'],
      ['cultural tourism', 'cultural tourism'],
      ['adventure tourism', 'adventure tourism'],
      ['mountain trekking', 'mountain trekking'],
      ['heritage tourism', 'heritage tourism'],
      ['tourism workshop', 'tourism workshop'],
      ['tourism roadshow', 'tourism roadshow'],
      ['tourism networking event', 'tourism networking event'],
      ['travel fair', 'travel expo'],
    ];
    for (const [phrase, tag] of tourismMap) {
      if (text.includes(normalize(phrase))) tags.add(tag);
    }
  }
  if (category === 'Conferences') {
    const conferenceMap: Array<[string, string]> = [
      ['technology conference', 'technology conference'],
      ['business conference', 'business conference'],
      ['finance conference', 'finance conference'],
      ['banking conference', 'finance conference'],
      ['healthcare conference', 'healthcare conference'],
      ['medical conference', 'healthcare conference'],
      ['education conference', 'education conference'],
      ['science conference', 'science conference'],
      ['research conference', 'science conference'],
      ['engineering conference', 'engineering conference'],
      ['ai conference', 'ai conference'],
      ['data conference', 'ai conference'],
      ['agriculture conference', 'agriculture conference'],
      ['energy conference', 'energy conference'],
      ['trade conference', 'trade conference'],
      ['investment conference', 'trade conference'],
      ['tourism conference', 'tourism conference'],
      ['government conference', 'government conference'],
      ['policy conference', 'government conference'],
      ['international conference', 'international conference'],
      ['academic conference', 'academic conference'],
      ['industry conference', 'industry conference'],
      ['conference', 'conference'],
    ];
    for (const [phrase, tag] of conferenceMap) {
      if (text.includes(normalize(phrase))) tags.add(tag);
    }
  }
  if (category === 'Cultural Celebration') {
    const culturalMap: Array<[string, string]> = [
      ['cultural celebration', 'cultural celebration'],
      ['cultural festival', 'cultural festival'],
      ['heritage festival', 'heritage festival'],
      ['cultural event', 'cultural event'],
      ['traditional celebration', 'traditional celebration'],
      ['cultural program', 'cultural celebration'],
      ['cultural programme', 'cultural celebration'],
    ];
    for (const [phrase, tag] of culturalMap) {
      if (text.includes(normalize(phrase))) tags.add(tag);
    }
  }
  return [...tags];
}

export function mapCategory(title: string, description: string | null): DailyEventCategory | null {
  const text = normalize(`${title} ${description ?? ''}`);
  const match = categoryRules.find((rule) => rule.keywords.some((keyword) => text.includes(normalize(keyword))));
  return match?.category ?? null;
}

export function isDailyEventCategory(value: string): value is DailyEventCategory {
  return (DAILY_EVENT_CATEGORIES as readonly string[]).includes(value);
}