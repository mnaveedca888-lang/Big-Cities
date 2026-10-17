ALTER TABLE "Event"
  ADD COLUMN "venue" TEXT,
  ADD COLUMN "sourceName" TEXT,
  ADD COLUMN "sourceUrl" TEXT,
  ADD COLUMN "externalEventId" TEXT,
  ADD COLUMN "lastSeenAt" TIMESTAMP(3),
  ADD COLUMN "lastCollectedAt" TIMESTAMP(3),
  ADD COLUMN "contentHash" TEXT;

CREATE INDEX "Event_sourceName_externalEventId_idx" ON "Event"("sourceName", "externalEventId");
CREATE INDEX "Event_contentHash_idx" ON "Event"("contentHash");