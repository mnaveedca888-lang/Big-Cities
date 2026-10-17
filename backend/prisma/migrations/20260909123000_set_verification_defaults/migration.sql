ALTER TABLE "Event"
  ALTER COLUMN "verificationStatus" SET DEFAULT 'UNVERIFIED';

UPDATE "Event"
SET
  "verificationStatus" = CASE
    WHEN "sourceName" = 'LUMS Events' THEN 'VERIFIED'
    WHEN "sourceName" = 'Eventbrite Pakistan' THEN 'PARTIALLY_VERIFIED'
    WHEN "sourceName" = 'You.com free web search' AND "verificationStatus" = 'VERIFIED' THEN 'UNVERIFIED'
    ELSE 'UNVERIFIED'
  END,
  "sourceType" = CASE
    WHEN "sourceName" = 'LUMS Events' THEN 'official-university'
    WHEN "sourceName" IN ('Eventbrite Pakistan', 'You.com free web search') THEN COALESCE("sourceType", 'secondary')
    ELSE "sourceType"
  END,
  "lastCheckedAt" = COALESCE("lastCheckedAt", CURRENT_TIMESTAMP)
WHERE "verificationStatus" IS NULL OR "verificationStatus" = 'VERIFIED';