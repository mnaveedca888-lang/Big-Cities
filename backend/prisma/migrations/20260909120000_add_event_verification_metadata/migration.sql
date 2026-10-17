ALTER TABLE "Event"
  ADD COLUMN "organizer" TEXT,
  ADD COLUMN "province" TEXT,
  ADD COLUMN "sourceType" TEXT,
  ADD COLUMN "verificationStatus" TEXT NOT NULL DEFAULT 'VERIFIED',
  ADD COLUMN "verificationScore" DOUBLE PRECISION,
  ADD COLUMN "verificationReason" TEXT,
  ADD COLUMN "verifiedAt" TIMESTAMP(3),
  ADD COLUMN "lastCheckedAt" TIMESTAMP(3);