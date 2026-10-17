UPDATE "Event"
SET
  "sourceType" = 'secondary',
  "verificationStatus" = 'PARTIALLY_VERIFIED',
  "verificationScore" = 0.45,
  "verificationReason" = 'Secondary listing or ticketing source; not sufficient for VERIFIED status.',
  "lastCheckedAt" = CURRENT_TIMESTAMP
WHERE "sourceName" = 'You.com free web search'
  AND (
    "sourceUrl" ILIKE '%eventsinlahore.com%'
    OR "sourceUrl" ILIKE '%eventbrite.com%'
    OR "sourceUrl" ILIKE '%ticketwala.pk%'
    OR "sourceUrl" ILIKE '%allevents.in%'
    OR "sourceUrl" ILIKE '%district.in%'
    OR "sourceUrl" ILIKE '%allconferencealert.com%'
    OR "sourceUrl" ILIKE '%conferenceineurope.org%'
    OR "sourceUrl" ILIKE '%ticmint.com%'
    OR "sourceUrl" ILIKE '%events.sulekha.com%'
  );
