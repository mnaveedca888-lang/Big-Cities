BEGIN;

ALTER TABLE "Upload"
  ADD COLUMN "attachedAt" TIMESTAMP(3),
  ADD COLUMN "expiresAt" TIMESTAMP(3),
  ADD COLUMN "deletedAt" TIMESTAMP(3);

CREATE INDEX "Upload_attachedAt_expiresAt_deletedAt_createdAt_idx"
  ON "Upload"("attachedAt", "expiresAt", "deletedAt", "createdAt");

CREATE TABLE "ImageCleanupJob" (
  "id" TEXT NOT NULL,
  "fileKey" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastError" TEXT,
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ImageCleanupJob_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ImageCleanupJob_fileKey_key" ON "ImageCleanupJob"("fileKey");
CREATE INDEX "ImageCleanupJob_completedAt_nextAttemptAt_createdAt_idx"
  ON "ImageCleanupJob"("completedAt", "nextAttemptAt", "createdAt");

CREATE OR REPLACE FUNCTION "image_object_key"(image_url TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  object_key TEXT;
BEGIN
  IF image_url IS NULL OR image_url !~ '^/images/uploads/[A-Za-z0-9._/-]+$' THEN
    RETURN NULL;
  END IF;

  object_key := substring(image_url FROM length('/images/uploads/') + 1);
  IF object_key = ''
     OR object_key ~ '(^|/)\.\.?(/|$)'
     OR object_key ~ '//'
     OR right(object_key, 1) = '/' THEN
    RETURN NULL;
  END IF;

  RETURN object_key;
END;
$$;

CREATE OR REPLACE FUNCTION "image_json_object_keys"(document JSONB)
RETURNS TABLE(object_key TEXT)
LANGUAGE sql
IMMUTABLE
AS $$
  WITH RECURSIVE nodes(value, field_name) AS (
    SELECT document, NULL::TEXT
    UNION ALL
    SELECT child.value, child.field_name
    FROM nodes
    CROSS JOIN LATERAL (
      SELECT entry.key AS field_name, entry.value
      FROM jsonb_each(
        CASE WHEN jsonb_typeof(nodes.value) = 'object'
          THEN nodes.value ELSE '{}'::JSONB END
      ) AS entry
      UNION ALL
      SELECT nodes.field_name, item.value
      FROM jsonb_array_elements(
        CASE WHEN jsonb_typeof(nodes.value) = 'array'
          THEN nodes.value ELSE '[]'::JSONB END
      ) AS item(value)
    ) AS child
  )
  SELECT DISTINCT "image_object_key"(nodes.value #>> '{}')
  FROM nodes
  WHERE nodes.field_name ~* '(image|thumbnail|avatar|flag|logo)'
    AND jsonb_typeof(nodes.value) = 'string'
    AND "image_object_key"(nodes.value #>> '{}') IS NOT NULL;
$$;

CREATE OR REPLACE FUNCTION "enqueue_image_cleanup"(object_key TEXT)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  IF object_key IS NULL OR NOT EXISTS (
    SELECT 1 FROM "Upload" WHERE "fileKey" = object_key
  ) THEN
    RETURN;
  END IF;

  INSERT INTO "ImageCleanupJob" (
    "id", "fileKey", "attempts", "nextAttemptAt", "createdAt"
  ) VALUES (
    md5(object_key || clock_timestamp()::TEXT || random()::TEXT),
    object_key,
    0,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  )
  ON CONFLICT ("fileKey") DO UPDATE SET
    "status" = 'pending',
    "attempts" = 0,
    "nextAttemptAt" = CURRENT_TIMESTAMP,
    "lastError" = NULL,
    "completedAt" = NULL
  WHERE "ImageCleanupJob"."status" <> 'deleting';
END;
$$;

CREATE OR REPLACE FUNCTION "lock_and_validate_image_references"()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  object_key TEXT;
BEGIN
  PERFORM pg_advisory_xact_lock(681729104331::BIGINT);

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;

  IF TG_TABLE_NAME IN ('Country', 'City') THEN
    FOR object_key IN SELECT keys.object_key
      FROM "image_json_object_keys"(NEW."profile") AS keys
    LOOP
      IF EXISTS (
        SELECT 1 FROM "Upload"
        WHERE "fileKey" = object_key AND "deletedAt" IS NOT NULL
      ) THEN
        RAISE EXCEPTION 'Cannot reference a cleaned image object';
      END IF;
      IF EXISTS (
        SELECT 1 FROM "ImageCleanupJob"
        WHERE "fileKey" = object_key AND "status" = 'deleting'
      ) THEN
        RAISE EXCEPTION 'Cannot reference an image while its cleanup is in progress';
      END IF;
      IF EXISTS (
        SELECT 1 FROM "ImageCleanupJob"
        WHERE "fileKey" = object_key AND "status" = 'done'
      ) AND NOT EXISTS (
        SELECT 1 FROM "Upload"
        WHERE "fileKey" = object_key AND "deletedAt" IS NULL
      ) THEN
        RAISE EXCEPTION 'Cannot reference an image that has already been cleaned';
      END IF;
      UPDATE "Upload"
      SET "attachedAt" = COALESCE("attachedAt", CURRENT_TIMESTAMP),
          "expiresAt" = NULL
      WHERE "fileKey" = object_key AND "deletedAt" IS NULL;
    END LOOP;
  ELSIF TG_TABLE_NAME = 'Event' THEN
    object_key := "image_object_key"(NEW."image");
    IF object_key IS NOT NULL THEN
      IF EXISTS (
        SELECT 1 FROM "Upload"
        WHERE "fileKey" = object_key AND "deletedAt" IS NOT NULL
      ) THEN
        RAISE EXCEPTION 'Cannot reference a cleaned image object';
      END IF;
      IF EXISTS (
        SELECT 1 FROM "ImageCleanupJob"
        WHERE "fileKey" = object_key AND "status" = 'deleting'
      ) THEN
        RAISE EXCEPTION 'Cannot reference an image while its cleanup is in progress';
      END IF;
      IF EXISTS (
        SELECT 1 FROM "ImageCleanupJob"
        WHERE "fileKey" = object_key AND "status" = 'done'
      ) AND NOT EXISTS (
        SELECT 1 FROM "Upload"
        WHERE "fileKey" = object_key AND "deletedAt" IS NULL
      ) THEN
        RAISE EXCEPTION 'Cannot reference an image that has already been cleaned';
      END IF;
      UPDATE "Upload"
      SET "attachedAt" = COALESCE("attachedAt", CURRENT_TIMESTAMP),
          "expiresAt" = NULL
      WHERE "fileKey" = object_key AND "deletedAt" IS NULL;
    END IF;
  ELSIF TG_TABLE_NAME = 'User' THEN
    object_key := "image_object_key"(NEW."avatarUrl");
    IF object_key IS NOT NULL THEN
      IF EXISTS (
        SELECT 1 FROM "Upload"
        WHERE "fileKey" = object_key AND "deletedAt" IS NOT NULL
      ) THEN
        RAISE EXCEPTION 'Cannot reference a cleaned image object';
      END IF;
      IF EXISTS (
        SELECT 1 FROM "ImageCleanupJob"
        WHERE "fileKey" = object_key AND "status" = 'deleting'
      ) THEN
        RAISE EXCEPTION 'Cannot reference an image while its cleanup is in progress';
      END IF;
      IF EXISTS (
        SELECT 1 FROM "ImageCleanupJob"
        WHERE "fileKey" = object_key AND "status" = 'done'
      ) AND NOT EXISTS (
        SELECT 1 FROM "Upload"
        WHERE "fileKey" = object_key AND "deletedAt" IS NULL
      ) THEN
        RAISE EXCEPTION 'Cannot reference an image that has already been cleaned';
      END IF;
      UPDATE "Upload"
      SET "attachedAt" = COALESCE("attachedAt", CURRENT_TIMESTAMP),
          "expiresAt" = NULL
      WHERE "fileKey" = object_key AND "deletedAt" IS NULL;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION "queue_old_image_references"()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  object_key TEXT;
BEGIN
  IF TG_TABLE_NAME IN ('Country', 'City') THEN
    FOR object_key IN SELECT keys.object_key
      FROM "image_json_object_keys"(OLD."profile") AS keys
    LOOP
      PERFORM "enqueue_image_cleanup"(object_key);
    END LOOP;
  ELSIF TG_TABLE_NAME = 'Event' THEN
    PERFORM "enqueue_image_cleanup"("image_object_key"(OLD."image"));
  ELSIF TG_TABLE_NAME = 'User' THEN
    PERFORM "enqueue_image_cleanup"("image_object_key"(OLD."avatarUrl"));
  END IF;

  RETURN OLD;
END;
$$;

CREATE TRIGGER "Country_image_reference_lock_insert"
  BEFORE INSERT ON "Country"
  FOR EACH ROW EXECUTE FUNCTION "lock_and_validate_image_references"();
CREATE TRIGGER "Country_image_reference_lock_update"
  BEFORE UPDATE OF "profile" ON "Country"
  FOR EACH ROW EXECUTE FUNCTION "lock_and_validate_image_references"();
CREATE TRIGGER "Country_image_reference_lock_delete"
  BEFORE DELETE ON "Country"
  FOR EACH ROW EXECUTE FUNCTION "lock_and_validate_image_references"();
CREATE TRIGGER "Country_image_reference_cleanup_update"
  AFTER UPDATE OF "profile" ON "Country"
  FOR EACH ROW WHEN (OLD."profile" IS DISTINCT FROM NEW."profile")
  EXECUTE FUNCTION "queue_old_image_references"();
CREATE TRIGGER "Country_image_reference_cleanup_delete"
  AFTER DELETE ON "Country"
  FOR EACH ROW EXECUTE FUNCTION "queue_old_image_references"();

CREATE TRIGGER "City_image_reference_lock_insert"
  BEFORE INSERT ON "City"
  FOR EACH ROW EXECUTE FUNCTION "lock_and_validate_image_references"();
CREATE TRIGGER "City_image_reference_lock_update"
  BEFORE UPDATE OF "profile" ON "City"
  FOR EACH ROW EXECUTE FUNCTION "lock_and_validate_image_references"();
CREATE TRIGGER "City_image_reference_lock_delete"
  BEFORE DELETE ON "City"
  FOR EACH ROW EXECUTE FUNCTION "lock_and_validate_image_references"();
CREATE TRIGGER "City_image_reference_cleanup_update"
  AFTER UPDATE OF "profile" ON "City"
  FOR EACH ROW WHEN (OLD."profile" IS DISTINCT FROM NEW."profile")
  EXECUTE FUNCTION "queue_old_image_references"();
CREATE TRIGGER "City_image_reference_cleanup_delete"
  AFTER DELETE ON "City"
  FOR EACH ROW EXECUTE FUNCTION "queue_old_image_references"();

CREATE TRIGGER "Event_image_reference_lock_insert"
  BEFORE INSERT ON "Event"
  FOR EACH ROW EXECUTE FUNCTION "lock_and_validate_image_references"();
CREATE TRIGGER "Event_image_reference_lock_update"
  BEFORE UPDATE OF "image" ON "Event"
  FOR EACH ROW EXECUTE FUNCTION "lock_and_validate_image_references"();
CREATE TRIGGER "Event_image_reference_lock_delete"
  BEFORE DELETE ON "Event"
  FOR EACH ROW EXECUTE FUNCTION "lock_and_validate_image_references"();
CREATE TRIGGER "Event_image_reference_cleanup_update"
  AFTER UPDATE OF "image" ON "Event"
  FOR EACH ROW WHEN (OLD."image" IS DISTINCT FROM NEW."image")
  EXECUTE FUNCTION "queue_old_image_references"();
CREATE TRIGGER "Event_image_reference_cleanup_delete"
  AFTER DELETE ON "Event"
  FOR EACH ROW EXECUTE FUNCTION "queue_old_image_references"();

CREATE TRIGGER "User_image_reference_lock_insert"
  BEFORE INSERT ON "User"
  FOR EACH ROW EXECUTE FUNCTION "lock_and_validate_image_references"();
CREATE TRIGGER "User_image_reference_lock_update"
  BEFORE UPDATE OF "avatarUrl" ON "User"
  FOR EACH ROW EXECUTE FUNCTION "lock_and_validate_image_references"();
CREATE TRIGGER "User_image_reference_lock_delete"
  BEFORE DELETE ON "User"
  FOR EACH ROW EXECUTE FUNCTION "lock_and_validate_image_references"();
CREATE TRIGGER "User_image_reference_cleanup_update"
  AFTER UPDATE OF "avatarUrl" ON "User"
  FOR EACH ROW WHEN (OLD."avatarUrl" IS DISTINCT FROM NEW."avatarUrl")
  EXECUTE FUNCTION "queue_old_image_references"();
CREATE TRIGGER "User_image_reference_cleanup_delete"
  AFTER DELETE ON "User"
  FOR EACH ROW EXECUTE FUNCTION "queue_old_image_references"();

COMMIT;
