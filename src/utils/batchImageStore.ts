// Batch image store for high-performance record scrubbing
export const batchImageStore: Record<string, string> = {};

export function hydrateBatchImageStore(images: Record<string, string>) {
  for (const k of Object.keys(images)) {
    if (!batchImageStore[k]) {
      batchImageStore[k] = images[k];
    }
  }
}

export function getBatchImage(key: string): string | undefined {
  if (!key) return undefined;
  const trimmed = key.toString().trim();
  if (batchImageStore[trimmed]) return batchImageStore[trimmed];
  
  // Case-insensitive fallback
  const lower = trimmed.toLowerCase();
  for (const k of Object.keys(batchImageStore)) {
    if (k.toLowerCase() === lower) return batchImageStore[k];
  }
  return undefined;
}

export function getBatchImageKeys(): string[] {
  return Object.keys(batchImageStore);
}

export function clearBatchImageStore() {
  Object.keys(batchImageStore).forEach(key => delete batchImageStore[key]);
}
