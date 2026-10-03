import type { CloudFile } from '../providers/types.js';

export type ChecksumGroups = Map<string, CloudFile[]>;

// Checksums are the only signal for an exact match, so files without one are skipped.
export function addToGroups(groups: ChecksumGroups, files: CloudFile[]) {
  for (const file of files) {
    if (!file.checksum) continue;
    const group = groups.get(file.checksum);
    if (group) group.push(file);
    else groups.set(file.checksum, [file]);
  }
}

export function countDuplicateGroups(groups: ChecksumGroups): number {
  let count = 0;
  for (const group of groups.values()) if (group.length > 1) count++;
  return count;
}

export function toDuplicateGroups(groups: ChecksumGroups) {
  return [...groups.values()]
    .filter((group) => group.length > 1)
    // Keep the largest file first; bulk deletion preserves it and removes the rest.
    .map((group) => ({
      type: 'exact' as const,
      files: [...group].sort((a, b) => parseInt(b.size ?? '0') - parseInt(a.size ?? '0')),
    }));
}