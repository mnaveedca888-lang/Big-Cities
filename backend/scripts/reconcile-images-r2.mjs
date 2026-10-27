#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { ListObjectsV2Command, S3Client } from '@aws-sdk/client-s3';

const require = createRequire(import.meta.url);
const backendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const possibleRepoRoot = path.resolve(backendRoot, '..');
const repoRoot = fs.existsSync(path.join(possibleRepoRoot, 'backend', 'package.json'))
  ? possibleRepoRoot
  : backendRoot;
const allowedInventoryUrl = 'https://raw.githubusercontent.com/mnaveedca888-lang/Big-Cities/bcd4ae73629b0a771758e16995090c9b878f17be/docs/R2_IMAGE_MIGRATION_INVENTORY.csv';
const args = process.argv.slice(2);
let inventoryArgument;
let inventoryUrl;
for (let index = 0; index < args.length; index += 1) {
  const argument = args[index];
  if (argument === '--inventory' || argument === '--inventory-url') {
    const value = args[index + 1];
    if (!value) {
      console.error(JSON.stringify({ error: 'invalid_arguments', readOnly: true }));
      process.exit(1);
    }
    if (argument === '--inventory') inventoryArgument = value;
    else inventoryUrl = value;
    index += 1;
  } else if (argument.startsWith('--inventory=')) {
    inventoryArgument = argument.slice('--inventory='.length);
  } else if (argument.startsWith('--inventory-url=')) {
    inventoryUrl = argument.slice('--inventory-url='.length);
  } else {
    console.error(JSON.stringify({ error: 'unsupported_arguments', readOnly: true }));
    process.exit(1);
  }
}
if ((inventoryArgument && inventoryUrl) || (inventoryUrl && inventoryUrl !== allowedInventoryUrl)) {
  console.error(JSON.stringify({ error: 'unsupported_arguments', readOnly: true }));
  process.exit(1);
}

const inventoryPath = inventoryArgument ? path.resolve(repoRoot, inventoryArgument) : path.join(repoRoot, 'docs', 'R2_IMAGE_MIGRATION_INVENTORY.csv');
const { parseInventoryCsv } = require(path.join(backendRoot, 'dist', 'images', 'r2-migration.js'));
const { extractProfileImageReferences, reconcileImageReferences } = require(path.join(
  backendRoot,
  'dist',
  'images',
  'r2-reconciliation.js',
));
const { getS3Configuration } = require(path.join(backendRoot, 'dist', 'uploads', 'upload-storage.js'));
const { PrismaClient } = require('@prisma/client');

let phase = 'inventory';
let prisma;
let s3;

try {
  let inventoryText;
  if (inventoryUrl) {
    phase = 'inventory-download';
    const response = await fetch(inventoryUrl);
    if (!response.ok) throw new Error();
    inventoryText = await response.text();
  } else {
    if (!fs.existsSync(inventoryPath)) throw new Error();
    inventoryText = fs.readFileSync(inventoryPath, 'utf8');
  }
  const inventory = parseInventoryCsv(inventoryText);
  phase = 'configuration';
  const configuration = getS3Configuration();
  prisma = new PrismaClient();
  s3 = new S3Client({
    region: configuration.region,
    endpoint: configuration.endpoint,
    credentials: {
      accessKeyId: configuration.accessKeyId,
      secretAccessKey: configuration.secretAccessKey,
    },
    forcePathStyle: true,
  });

  phase = 'r2-list';
  const existingObjectKeys = new Set();
  let continuationToken;
  do {
    const listing = await s3.send(new ListObjectsV2Command({
      Bucket: configuration.bucket,
      MaxKeys: 1000,
      ContinuationToken: continuationToken,
    }));
    for (const object of listing.Contents ?? []) {
      if (object.Key) existingObjectKeys.add(object.Key);
    }
    continuationToken = listing.IsTruncated ? listing.NextContinuationToken : undefined;
    if (listing.IsTruncated && !continuationToken) throw new Error();
  } while (continuationToken);

  phase = 'database-read-only';
  const references = await prisma.$transaction(async (transaction) => {
    await transaction.$executeRawUnsafe('SET TRANSACTION READ ONLY');
    const collected = [];
    const eventRows = await transaction.$queryRawUnsafe(
      'SELECT "image" AS value FROM "Event" WHERE "image" IS NOT NULL',
    );
    for (const row of eventRows) collected.push({ url: row.value });

    const users = await transaction.$queryRawUnsafe(
      'SELECT "avatarUrl" AS value FROM "User" WHERE "avatarUrl" IS NOT NULL',
    );
    for (const row of users) collected.push({ url: row.value });

    const uploads = await transaction.$queryRawUnsafe(
      'SELECT "url" AS url, "fileKey" AS "fileKey" FROM "Upload" WHERE "url" IS NOT NULL OR "fileKey" IS NOT NULL',
    );
    for (const row of uploads) collected.push({ url: row.url, fileKey: row.fileKey });

    for (const table of ['Country', 'City']) {
      const rows = await transaction.$queryRawUnsafe(
        `SELECT "profile" AS value FROM "${table}" WHERE "profile" IS NOT NULL`,
      );
      for (const row of rows) {
        for (const url of extractProfileImageReferences(row.value)) collected.push({ url });
      }
    }
    return collected;
  }, { timeout: 120000 });

  phase = 'classification';
  const report = reconcileImageReferences(
    references,
    inventory,
    existingObjectKeys,
    repoRoot,
    configuration.endpoint,
    configuration.bucket,
  );
  console.log(JSON.stringify({
    ...report,
    bucketListAccess: 'confirmed',
    databaseTransaction: 'read_only',
    objectReadsPerformed: false,
    objectWritesPerformed: false,
    writePermissionVerified: false,
  }, null, 2));
} catch {
  console.log(JSON.stringify({
    phase,
    completed: false,
    databaseTransaction: phase === 'database-read-only' ? 'read_only_query_failed' : 'not_started',
    bucketListAccess: phase === 'database-read-only' || phase === 'classification' ? 'confirmed' : 'not_confirmed',
    objectReadsPerformed: false,
    objectWritesPerformed: false,
    writePermissionVerified: false,
  }));
  process.exitCode = 2;
} finally {
  await prisma?.$disconnect().catch(() => {});
  s3?.destroy();
}
