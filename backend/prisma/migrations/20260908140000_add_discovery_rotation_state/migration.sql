CREATE TABLE "EventDiscoveryState" (
  "id" TEXT NOT NULL,
  "countryCode" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "lastAttemptedAt" TIMESTAMP(3),
  "lastSuccessfulAt" TIMESTAMP(3),
  "lastResultCount" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "EventDiscoveryState_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "EventDiscoveryState_countryCode_category_key" ON "EventDiscoveryState"("countryCode", "category");
CREATE INDEX "EventDiscoveryState_countryCode_lastAttemptedAt_idx" ON "EventDiscoveryState"("countryCode", "lastAttemptedAt");

CREATE TABLE "EventDiscoveryBudget" (
  "id" TEXT NOT NULL,
  "countryCode" TEXT NOT NULL,
  "utcDate" DATE NOT NULL,
  "searchCount" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "EventDiscoveryBudget_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "EventDiscoveryBudget_countryCode_utcDate_key" ON "EventDiscoveryBudget"("countryCode", "utcDate");