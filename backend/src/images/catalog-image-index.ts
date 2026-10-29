import catalogImageKeys from './catalog-image-keys.json';

const catalogImagesByDirectory = new Map<string, string[]>();
const catalogImageKeySet = new Set(catalogImageKeys);

for (const key of catalogImageKeys) {
  const separator = key.indexOf('/');
  if (separator < 0 || separator === key.length - 1) continue;

  const directory = key.slice(0, separator);
  const fileName = key.slice(separator + 1);
  if (fileName.includes('/')) continue;
  const fileNames = catalogImagesByDirectory.get(directory) ?? [];
  fileNames.push(fileName);
  catalogImagesByDirectory.set(directory, fileNames);
}

export function getCatalogImageFileNames(directory: string): string[] {
  return catalogImagesByDirectory.get(directory) ?? [];
}

export function hasCatalogImage(directory: string, fileName: string): boolean {
  return catalogImageKeySet.has(`${directory}/${fileName}`);
}
