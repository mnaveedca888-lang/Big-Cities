ALTER TABLE "Event"
  ADD COLUMN "primarySourceUrl" TEXT,
  ADD COLUMN "primarySourceName" TEXT,
  ADD COLUMN "primarySourceType" TEXT,
  ADD COLUMN "discoverySourceUrl" TEXT,
  ADD COLUMN "discoverySourceName" TEXT;