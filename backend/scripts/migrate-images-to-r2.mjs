#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(backendRoot, '..');

function readOption(name, fallback) {
  const index = process.argv.indexOf(`--${name}`);
  return index < 0 ? fallback : process.argv[index + 1] ?? 'true';
}

const execute = process.argv.includes('--execute');
const batchSize = Number(readOption('batch-size', '100'));
if (!Number.isSafeInteger(batchSize) || batchSize < 1) {
  console.error('Migration stopped: batch-size must be a positive integer.');
  process.exit(1);
}
const batchIndexArgument = readOption('batch-index', undefined);
const batchIndex = batchIndexArgument === undefined ? undefined : Number(batchIndexArgument);
if (execute && batchIndex === undefined) {
  console.error('Migration stopped: --execute requires an explicit --batch-index.');
  process.exit(1);
}
if (batchIndex !== undefined && (!Number.isSafeInteger(batchIndex) || batchIndex < 0)) {
  console.error('Migration stopped: batch-index must be a non-negative integer.');
  process.exit(1);
}

const inventoryPath = path.resolve(repoRoot, readOption('inventory', 'docs/R2_IMAGE_MIGRATION_INVENTORY.csv'));
const { runMigrationWorkflow } = require(path.join(backendRoot, 'dist', 'images', 'r2-migration.js'));
const options = {
  dryRun: !execute,
  execute,
  batchSize,
  batchIndex,
};

try {
  if (execute) {
    const { createR2MigrationObjectStore } = require(path.join(backendRoot, 'dist', 'uploads', 'upload-storage.js'));
    options.store = createR2MigrationObjectStore();
  }

  const report = await runMigrationWorkflow(inventoryPath, repoRoot, options);
  const json = JSON.stringify(report, null, 2);
  const reportPath = readOption('report', undefined);
  if (reportPath) {
    fs.writeFileSync(path.resolve(repoRoot, reportPath), `${json}\n`, { flag: 'wx' });
    console.log(`Migration report written to ${path.resolve(repoRoot, reportPath)}`);
  } else {
    console.log(json);
  }
  if (report.failed > 0 || report.checksumMismatches > 0 || report.missingSources > 0) process.exitCode = 2;
} catch {
  console.error('Migration stopped. No credentials or provider error details were written to the report.');
  process.exitCode = 1;
}
