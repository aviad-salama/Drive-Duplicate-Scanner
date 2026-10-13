import { useState } from 'react';
import { deleteFile as deleteFileApi } from '../services/cloudService';
import type { CloudFile, DuplicateGroup } from '../types/cloud';

/** Owns duplicate groups and optimistic single- and bulk-delete operations. */
export function useDuplicateGroups() {
  const [groups, setGroups] = useState<DuplicateGroup[]>([]);
  const [deleting, setDeleting] = useState(false);

  const resetGroups = () => setGroups([]);
  const replaceGroups = (nextGroups: DuplicateGroup[]) => setGroups(nextGroups);

  const getFileKey = (file: CloudFile) =>
    `${file.accountId ?? ''}:${file.id}`;

  const removeFromGroups = (file: CloudFile) => {
    const targetKey = getFileKey(file);

    setGroups((prev) =>
      prev
        .map((group) => ({
          ...group,
          files: group.files.filter((current) => getFileKey(current) !== targetKey),
        }))
        .filter((group) => group.files.length > 1),
    );
  };

  const deleteFile = async (file: CloudFile) => {
    if (!file.accountId) {
      return false;
    }

    const previousGroups = [...groups];
    removeFromGroups(file);

    try {
      await deleteFileApi(file.accountId, file.id);
      return true;
    } catch {
      setGroups(previousGroups);
      return false;
    }
  };

  const deleteDuplicates = async (filesToDelete: CloudFile[]) => {
    setDeleting(true);
    let success = 0;
    let failed = 0;

    for (const file of filesToDelete) {
      if (await deleteFile(file)) {
        success++;
      } else {
        failed++;
      }
    }

    setDeleting(false);
    return { success, failed };
  };

  const duplicateFilesCount = groups.reduce((acc, group) => acc + group.files.length - 1, 0);

  return {
    groups,
    deleting,
    duplicateFilesCount,
    resetGroups,
    replaceGroups,
    deleteFile,
    deleteDuplicates,
  };
}
