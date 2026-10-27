import fs from 'fs';
import path from 'path';
import type { InventoryEntry } from './r2-migration';
import { buildR2ObjectKey } from './r2-migration';

const IMAGE_FIELD = /image|avatar|photo|picture|thumbnail|cover|banner|flag|logo|gallery/i;
const IMAGE_EXTENSION = /\.(?:avif|bmp|gif|jpe?g|png|svg|webp)$/i;

export type DatabaseImageReference = {
  url?: string | null;
  fileKey?: string | null;
};

export type ImageReconciliationReport = {
  databaseImageReferences: number;
  localReferences: number;
  localFilesPresent: number;
  localFilesMissing: number;
  externalUrlReferences: number;
  r2References: number;
  r2PresentReferences: number;
  missingObjectReferences: number;
  ambiguousReferences: number;
  distinctReferencedR2ObjectsPresent: number;
  distinctReferencedR2ObjectsMissing: number;
  inventoryEntries: number;
  inventoryUniqueObjects: number;
  inventoryObjectsPresent: number;
  inventoryObjectsMissing: number;
  inventorySourceFilesPresent: number;
  inventorySourceFilesMissing: number;
};

type ResolvedReference =
  | { kind: 'local'; path: string }
  | { kind: 'r2'; key: string }
  | { kind: 'external'; path: string }
  | { kind: 'ambiguous' };

function decodePath(value: string): string | null {
  try {
    return decodeURIComponent(value.split(/[?#]/, 1)[0])
      .replace(/\\/g, '/')
      .replace(/^\/+/, '');
  } catch {
    return null;
  }
}

function comparisonPath(value: string): string | null {
  return decodePath(value)?.toLowerCase() ?? null;
}

function canonicalEntry(entry: InventoryEntry, rowsByPath: Map<string, InventoryEntry>): InventoryEntry | null {
  let current = entry;
  const visited = new Set<string>();
  while (current.duplicate_of_path) {
    if (visited.has(current.repository_path)) return null;
    visited.add(current.repository_path);
    const next = rowsByPath.get(current.duplicate_of_path);
    if (!next) return null;
    current = next;
  }
  return current;
}

function findInventoryEntries(referencePath: string, rows: InventoryEntry[]): InventoryEntry[] {
  const normalizedReference = comparisonPath(referencePath);
  if (!normalizedReference) return [];

  const aliases = (repositoryPath: string) => {
    const normalized = comparisonPath(repositoryPath);
    if (!normalized) return [];
    const values = new Set([normalized]);
    values.add(normalized.replace(/^backend\//, ''));
    values.add(normalized.replace(/^backend\/public\//, ''));
    const imagesIndex = normalized.indexOf('/images/');
    if (imagesIndex >= 0) values.add(normalized.slice(imagesIndex + '/images/'.length));
    return [...values];
  };

  const exact = rows.filter((entry) => aliases(entry.repository_path).includes(normalizedReference));
  if (exact.length) return exact;

  const suffixMatches = rows.filter((entry) => aliases(entry.repository_path)
    .some((alias) => alias.endsWith(`/${normalizedReference}`)));
  if (suffixMatches.length) return suffixMatches;

  const basename = path.posix.basename(normalizedReference);
  return rows.filter((entry) => path.posix.basename(comparisonPath(entry.repository_path) ?? '') === basename);
}

function resolveReference(reference: DatabaseImageReference, endpointHost: string | null): ResolvedReference {
  const urlValue = reference.url?.trim() || '';
  const fileKey = reference.fileKey?.trim() || '';

  if (fileKey) {
    const key = fileKey.replace(/^\/+/, '');
    if (!key || key.includes('..') || key.includes('\\')) return { kind: 'ambiguous' };
    if (urlValue) {
      const uploadPrefix = '/images/uploads/';
      if (urlValue.startsWith(uploadPrefix)) {
        const urlKey = urlValue.slice(uploadPrefix.length).split(/[?#]/, 1)[0];
        let decodedUrlKey: string;
        try {
          decodedUrlKey = decodeURIComponent(urlKey);
        } catch {
          return { kind: 'ambiguous' };
        }
        if (decodedUrlKey !== key) return { kind: 'ambiguous' };
      } else {
        return { kind: 'ambiguous' };
      }
    }
    return { kind: 'r2', key };
  }

  if (!urlValue) return { kind: 'ambiguous' };

  let parsedUrl: URL | null = null;
  try {
    parsedUrl = new URL(urlValue);
  } catch {
    parsedUrl = null;
  }

  if (parsedUrl) {
    const pathValue = decodePath(parsedUrl.pathname);
    if (!pathValue) return { kind: 'ambiguous' };
    if (parsedUrl.hostname.endsWith('.r2.dev')
      || parsedUrl.hostname.endsWith('.r2.cloudflarestorage.com')
      || parsedUrl.hostname === endpointHost) {
      return { kind: 'r2', key: pathValue.replace(/^\/+/, '') };
    }
    return { kind: 'external', path: pathValue };
  }

  if (urlValue.startsWith('/images/uploads/')) {
    const key = decodePath(urlValue.slice('/images/uploads/'.length));
    return key ? { kind: 'r2', key } : { kind: 'ambiguous' };
  }

  const localPath = comparisonPath(urlValue);
  if (localPath && (urlValue.startsWith('/') || IMAGE_EXTENSION.test(localPath))) {
    return {
      kind: 'local',
      path: localPath.replace(/^images\//, ''),
    };
  }

  return { kind: 'ambiguous' };
}

export function extractProfileImageReferences(profile: unknown): string[] {
  const references: string[] = [];
  const visit = (value: unknown, key: string, inheritedImageField: boolean): void => {
    const imageField = inheritedImageField || IMAGE_FIELD.test(key);
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (imageField && trimmed) references.push(trimmed);
      return;
    }
    if (Array.isArray(value)) {
      for (const item of value) visit(item, key, imageField);
      return;
    }
    if (value && typeof value === 'object') {
      for (const [childKey, child] of Object.entries(value)) visit(child, childKey, imageField);
    }
  };
  visit(profile, '', false);
  return references;
}

export function reconcileImageReferences(
  references: DatabaseImageReference[],
  inventory: InventoryEntry[],
  existingObjectKeys: Set<string>,
  repoRoot: string,
  endpoint?: string,
  bucket?: string,
): ImageReconciliationReport {
  const rowsByPath = new Map(inventory.map((entry) => [entry.repository_path, entry]));
  const endpointHost = endpoint ? new URL(endpoint).hostname : null;
  const plannedInventoryKeys = new Set<string>();
  for (const entry of inventory) {
    const canonical = canonicalEntry(entry, rowsByPath);
    if (canonical) plannedInventoryKeys.add(buildR2ObjectKey(canonical.repository_path, canonical.sha256));
  }

  let inventoryObjectsPresent = 0;
  for (const key of plannedInventoryKeys) {
    if (existingObjectKeys.has(key)) inventoryObjectsPresent += 1;
  }

  const sourcePaths = new Set(inventory.map((entry) => entry.repository_path));
  let inventorySourceFilesPresent = 0;
  for (const sourcePath of sourcePaths) {
    if (fs.existsSync(path.resolve(repoRoot, sourcePath))) inventorySourceFilesPresent += 1;
  }

  const report: ImageReconciliationReport = {
    databaseImageReferences: references.length,
    localReferences: 0,
    localFilesPresent: 0,
    localFilesMissing: 0,
    externalUrlReferences: 0,
    r2References: 0,
    r2PresentReferences: 0,
    missingObjectReferences: 0,
    ambiguousReferences: 0,
    distinctReferencedR2ObjectsPresent: 0,
    distinctReferencedR2ObjectsMissing: 0,
    inventoryEntries: inventory.length,
    inventoryUniqueObjects: plannedInventoryKeys.size,
    inventoryObjectsPresent,
    inventoryObjectsMissing: plannedInventoryKeys.size - inventoryObjectsPresent,
    inventorySourceFilesPresent,
    inventorySourceFilesMissing: sourcePaths.size - inventorySourceFilesPresent,
  };
  const presentReferencedKeys = new Set<string>();
  const missingReferencedKeys = new Set<string>();

  for (const reference of references) {
    const resolved = resolveReference(reference, endpointHost);
    if (resolved.kind === 'external') {
      const key = bucket && resolved.path.startsWith(`${bucket}/`)
        ? resolved.path.slice(bucket.length + 1)
        : resolved.path;
      if (existingObjectKeys.has(key) || plannedInventoryKeys.has(key)) {
        report.r2References += 1;
        if (existingObjectKeys.has(key)) {
          report.r2PresentReferences += 1;
          presentReferencedKeys.add(key);
        } else {
          report.missingObjectReferences += 1;
          missingReferencedKeys.add(key);
        }
      } else {
        report.externalUrlReferences += 1;
      }
      continue;
    }
    if (resolved.kind === 'r2') {
      report.r2References += 1;
      const key = bucket && resolved.key.startsWith(`${bucket}/`)
        ? resolved.key.slice(bucket.length + 1)
        : resolved.key;
      if (existingObjectKeys.has(key)) {
        report.r2PresentReferences += 1;
        presentReferencedKeys.add(key);
      } else {
        report.missingObjectReferences += 1;
        missingReferencedKeys.add(key);
      }
      continue;
    }
    if (resolved.kind === 'ambiguous') {
      report.ambiguousReferences += 1;
      continue;
    }

    report.localReferences += 1;
    const matches = findInventoryEntries(resolved.path, inventory);
    const canonicalMatches = new Map<string, InventoryEntry>();
    for (const entry of matches) {
      const canonical = canonicalEntry(entry, rowsByPath);
      if (canonical) canonicalMatches.set(canonical.repository_path, canonical);
    }
    if (canonicalMatches.size !== 1) {
      report.ambiguousReferences += 1;
      continue;
    }
    const canonical = [...canonicalMatches.values()][0];
    const key = buildR2ObjectKey(canonical.repository_path, canonical.sha256);
    const hasLocalSource = matches.some((entry) => fs.existsSync(path.resolve(repoRoot, entry.repository_path)));
    if (hasLocalSource) report.localFilesPresent += 1;
    else report.localFilesMissing += 1;
    if (existingObjectKeys.has(key)) {
      report.r2PresentReferences += 1;
      presentReferencedKeys.add(key);
    } else {
      report.missingObjectReferences += 1;
      missingReferencedKeys.add(key);
    }
  }

  report.distinctReferencedR2ObjectsPresent = presentReferencedKeys.size;
  report.distinctReferencedR2ObjectsMissing = missingReferencedKeys.size;
  return report;
}

export type { InventoryEntry };
