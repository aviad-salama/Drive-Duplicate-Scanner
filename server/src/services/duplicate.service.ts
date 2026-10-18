import type { CloudFile } from '../providers/types.js';
import { DisjointSet } from '../utils/disjointSet.js';

export type Sha256Calculator = (file: CloudFile) => Promise<string>;

type FileKey = string;

// Include the account ID because file IDs are only unique within a cloud account.
function getFileKey(file: CloudFile): FileKey {
  return `${file.accountId ?? ''}:${file.id}`;
}

function buildNativeConnections(files: CloudFile[], sets: DisjointSet): void {
  const owners = new Map<string, FileKey>();

  for (const file of files) {
    const fileKey = getFileKey(file);

    for (const [algorithm, hash] of Object.entries(file.nativeHashes)) {
      if (!hash) {
        continue;
      }

      const nativeKey = `${algorithm}:${hash}`;
      const owner = owners.get(nativeKey);

      if (owner) {
        sets.union(owner, fileKey);
      } else {
        owners.set(nativeKey, fileKey);
      }
    }
  }
}

function buildSizeBuckets(files: CloudFile[]): Map<string, CloudFile[]> {
  const buckets = new Map<string, CloudFile[]>();

  for (const file of files) {
    if (file.size === null) {
      continue;
    }

    const bucket = buckets.get(file.size);

    if (bucket) {
      bucket.push(file);
    } else {
      buckets.set(file.size, [file]);
    }
  }

  return buckets;
}

function getCommonAlgorithms(files: CloudFile[]): Set<string> {
  if (files.length === 0) {
    return new Set();
  }

  let common = new Set(Object.keys(files[0]?.nativeHashes ?? {}));

  for (const file of files.slice(1)) {
    const algorithms = new Set(Object.keys(file.nativeHashes));
    common = new Set([...common].filter((algorithm) => algorithms.has(algorithm)));

    if (common.size === 0) {
      break;
    }
  }

  return common;
}

function buildGroups(files: CloudFile[], sets: DisjointSet): CloudFile[][] {
  const groups = new Map<FileKey, CloudFile[]>();

  for (const file of files) {
    const root = sets.find(getFileKey(file));
    const group = groups.get(root);

    if (group) {
      group.push(file);
    } else {
      groups.set(root, [file]);
    }
  }

  return [...groups.values()].filter((group) => group.length > 1);
}

/**
 * Groups files connected by matching provider hashes, using streamed SHA-256
 * only for same-size buckets that have no hash algorithm common to every file.
 */
export async function findDuplicateGroups(
  files: CloudFile[],
  calculateSha256: Sha256Calculator,
): Promise<Array<{ type: 'exact'; files: CloudFile[] }>> {
  const sets = new DisjointSet(files.map(getFileKey));

  buildNativeConnections(files, sets);

  const sizeBuckets = buildSizeBuckets(files);

  for (const bucket of sizeBuckets.values()) {
    if (bucket.length < 2) {
      continue;
    }

    const commonAlgorithms = getCommonAlgorithms(bucket);

    // Avoid downloading file contents when provider hashes can be compared.
    if (commonAlgorithms.size > 0) {
      continue;
    }

    const representatives = new Map<FileKey, CloudFile>();

    for (const file of bucket) {
      const root = sets.find(getFileKey(file));

      if (!representatives.has(root)) {
        representatives.set(root, file);
      }
    }

    const shaOwners = new Map<string, FileKey>();

    for (const file of representatives.values()) {
      const sha256 = await calculateSha256(file);
      const owner = shaOwners.get(sha256);
      const fileKey = getFileKey(file);

      if (owner) {
        sets.union(owner, fileKey);
      } else {
        shaOwners.set(sha256, fileKey);
      }
    }
  }

  return buildGroups(files, sets)
    .map((group) => ({
      type: 'exact' as const,
      files: [...group].sort(
        (a, b) => parseInt(b.size ?? '0', 10) - parseInt(a.size ?? '0', 10),
      ),
    }));
}
