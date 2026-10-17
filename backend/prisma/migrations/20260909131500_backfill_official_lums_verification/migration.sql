UPDATE "Event"
SET
  "sourceType" = 'official-university',
  "verificationStatus" = 'VERIFIED',
  "verificationScore" = 0.95,
  "verificationReason" = 'Verified from the official LUMS events calendar.',
  "verifiedAt" = COALESCE("verifiedAt", CURRENT_TIMESTAMP),
  "lastCheckedAt" = CURRENT_TIMESTAMP
WHERE "sourceName" = 'LUMS Events';
