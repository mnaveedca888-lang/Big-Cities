import crypto from 'crypto';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, describe, expect, it } from 'vitest';
import { buildR2ObjectKey, type InventoryEntry } from './r2-migration';
import {
  extractProfileImageReferences,
  reconcileImageReferences,
} from './r2-reconciliation';

const temporaryDirectories: string[] = [];

function makeTempDir(): string {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'r2-reconciliation-'));
  temporaryDirectories.push(directory);
  return directory;
}

function inventoryEntry(repositoryPath: string, contents: string, duplicateOf?: string): InventoryEntry {
  const buffer = Buffer.from(contents);
  return {
    repository_path: repositoryPath,
    bytes: buffer.length,
    sha256: crypto.createHash('sha256').update(buffer).digest('hex'),
    duplicate_group_sha256: '',
    duplicate_of_path: duplicateOf,
    r2_status: 'not_copied',
  };
}

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

describe('read-only image reference reconciliation', () => {
  it('counts local, external, present, missing, and ambiguous references without mutating files', () => {
    const repoRoot = makeTempDir();
    const sourcePath = 'backend/public/Images/City One.jpg';
    const duplicatePath = 'backend/public/Images/City One copy.jpg';
    fs.mkdirSync(path.dirname(path.resolve(repoRoot, sourcePath)), { recursive: true });
    fs.writeFileSync(path.resolve(repoRoot, sourcePath), 'city-image');
    fs.writeFileSync(path.resolve(repoRoot, duplicatePath), 'city-image');
    const image = inventoryEntry(sourcePath, 'city-image');
    const duplicate = inventoryEntry(duplicatePath, 'city-image', sourcePath);
    const inventory = [image, duplicate];
    const presentInventoryKey = buildR2ObjectKey(image.repository_path, image.sha256);
    const references = [
      { url: '/images/City%20One.jpg' },
      { url: 'https://images.example.test/city.jpg' },
      { url: '/images/uploads/account/avatar.png', fileKey: 'account/avatar.png' },
      { url: '/images/not-in-inventory.jpg' },
      { url: '/images/City%20One.jpg', fileKey: 'account/conflicting-key.jpg' },
      { fileKey: 'account/missing.jpg' },
    ];

    const report = reconcileImageReferences(
      references,
      inventory,
      new Set([presentInventoryKey, 'account/avatar.png']),
      repoRoot,
      'https://account.r2.cloudflarestorage.com',
      'staging-bucket',
    );

    expect(report.databaseImageReferences).toBe(6);
    expect(report.localReferences).toBe(2);
    expect(report.localFilesPresent).toBe(1);
    expect(report.localFilesMissing).toBe(0);
    expect(report.externalUrlReferences).toBe(1);
    expect(report.r2References).toBe(2);
    expect(report.r2PresentReferences).toBe(2);
    expect(report.missingObjectReferences).toBe(1);
    expect(report.ambiguousReferences).toBe(2);
    expect(report.inventoryEntries).toBe(2);
    expect(report.inventoryUniqueObjects).toBe(1);
    expect(report.inventoryObjectsPresent).toBe(1);
    expect(report.inventorySourceFilesPresent).toBe(2);
  });

  it('recognizes path-style endpoint URLs and reports missing local files', () => {
    const repoRoot = makeTempDir();
    const entry = inventoryEntry('backend/public/Images/Missing.png', 'contents');
    const report = reconcileImageReferences(
      [
        { url: 'https://account.r2.cloudflarestorage.com/staging-bucket/images/existing.png' },
        { url: '/images/Missing.png' },
      ],
      [entry],
      new Set(['images/existing.png']),
      repoRoot,
      'https://account.r2.cloudflarestorage.com',
      'staging-bucket',
    );

    expect(report.r2References).toBe(1);
    expect(report.r2PresentReferences).toBe(1);
    expect(report.missingObjectReferences).toBe(1);
    expect(report.localFilesMissing).toBe(1);
    expect(report.inventoryObjectsMissing).toBe(1);
    expect(report.inventorySourceFilesMissing).toBe(1);
    expect(report.distinctReferencedR2ObjectsMissing).toBe(1);
    expect(report.inventoryObjectsPresent).toBe(0);
  });

  it('extracts nested profile image URLs, including image arrays and nested image objects', () => {
    const references = extractProfileImageReferences({
      gallery: {
        images: ['https://cdn.example.test/one.jpg', 'https://cdn.example.test/two.jpg'],
      },
      heroImage: { url: 'https://cdn.example.test/hero.webp' },
      description: 'not an image reference',
    });

    expect(references).toEqual([
      'https://cdn.example.test/one.jpg',
      'https://cdn.example.test/two.jpg',
      'https://cdn.example.test/hero.webp',
    ]);
  });
});
