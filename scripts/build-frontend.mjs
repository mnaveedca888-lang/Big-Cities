import { spawnSync } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';

const target = process.argv[2];
const stagingApiBaseUrl = 'https://big-cities-backend-staging.hostless.app';
const configuredApiBaseUrl = (process.env.VITE_API_BASE_URL ?? '').trim().replace(/\/+$/, '');

if (target !== 'candidate' && target !== 'production') {
  console.error('Usage: npm run build:candidate | npm run build:production');
  process.exit(1);
}

if (target === 'candidate') {
  if (configuredApiBaseUrl && configuredApiBaseUrl !== stagingApiBaseUrl) {
    console.error(`Candidate builds must target ${stagingApiBaseUrl}.`);
    process.exit(1);
  }
  process.env.VITE_API_BASE_URL = stagingApiBaseUrl;
  process.env.VITE_DEPLOYMENT_TARGET = 'candidate';
} else {
  if (!configuredApiBaseUrl || configuredApiBaseUrl === stagingApiBaseUrl || /staging|preview|candidate/i.test(configuredApiBaseUrl)) {
    console.error('Production builds require VITE_API_BASE_URL set to a dedicated non-staging API origin.');
    process.exit(1);
  }
  process.env.VITE_DEPLOYMENT_TARGET = 'production';
}

const outDir = target === 'candidate'
  ? path.resolve('..', 'React router-performance-20261023-staging-build')
  : path.resolve('dist');
const viteCli = path.resolve('node_modules', 'vite', 'bin', 'vite.js');
const result = spawnSync(process.execPath, [viteCli, 'build', '--outDir', outDir, '--emptyOutDir'], {
  env: process.env,
  stdio: 'inherit',
});

process.exit(result.status ?? 1);
