#!/usr/bin/env node

import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const backendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { probeR2ReadAccess } = require(path.join(backendRoot, 'dist', 'uploads', 'upload-storage.js'));

try {
  const permissions = await probeR2ReadAccess();
  const result = {
    ...permissions,
    writePermissionVerified: false,
    probeIsReadOnly: true,
  };
  console.log(JSON.stringify(result, null, 2));
  if (permissions.bucketAccess !== 'confirmed'
    || permissions.listAccess !== 'confirmed'
    || permissions.objectReadAccess === 'failed') {
    process.exitCode = 2;
  }
} catch {
  console.error(JSON.stringify({
    bucketAccess: 'not_verified',
    listAccess: 'not_verified',
    objectReadAccess: 'not_verified',
    writePermissionVerified: false,
    probeIsReadOnly: true,
    configurationOrPermissionError: true,
  }, null, 2));
  process.exitCode = 2;
}
