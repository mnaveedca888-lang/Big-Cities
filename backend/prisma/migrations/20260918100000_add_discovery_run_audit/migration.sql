ALTER TABLE "EventDiscoveryState" ADD COLUMN "nextQueryIndex" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE "EventDiscoveryRun" (
    "id" TEXT NOT NULL,
    "countryCode" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "budgetWindow" TIMESTAMP(3) NOT NULL,
    "reserved" BOOLEAN NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "youHttpStatus" INTEGER,
    "resultsFound" INTEGER NOT NULL DEFAULT 0,
    "relevantEventPages" INTEGER NOT NULL DEFAULT 0,
    "pagesFetched" INTEGER NOT NULL DEFAULT 0,
    "pagesFailed" INTEGER NOT NULL DEFAULT 0,
    "eventsDetected" INTEGER NOT NULL DEFAULT 0,
    "datesExtracted" INTEGER NOT NULL DEFAULT 0,
    "within48Hours" INTEGER NOT NULL DEFAULT 0,
    "verificationPassed" INTEGER NOT NULL DEFAULT 0,
    "saved" INTEGER NOT NULL DEFAULT 0,
    "updated" INTEGER NOT NULL DEFAULT 0,
    "duplicates" INTEGER NOT NULL DEFAULT 0,
    "rejectionCounts" JSONB,
    "resultUrls" JSONB,
    "candidateRejections" JSONB,
    "error" TEXT,

    CONSTRAINT "EventDiscoveryRun_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "EventDiscoveryRun_countryCode_startedAt_idx" ON "EventDiscoveryRun"("countryCode", "startedAt");
CREATE INDEX "EventDiscoveryRun_countryCode_category_startedAt_idx" ON "EventDiscoveryRun"("countryCode", "category", "startedAt");