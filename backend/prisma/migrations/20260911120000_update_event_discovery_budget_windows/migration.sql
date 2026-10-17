ALTER TABLE "EventDiscoveryBudget"
  ALTER COLUMN "utcDate" TYPE TIMESTAMP(3)
  USING "utcDate"::TIMESTAMP(3);
