import { useState } from 'react';
import { deleteFile as deleteFileApi } from '../services/cloudService';
import { ApiError } from '../services/apiClient';
import type { CloudAuthIssue, CloudFile, DuplicateGroup } from '../types/cloud';

export function useDuplicateGroups() {
  const [groups, setGroups] = useState<DuplicateGroup[]>([]);
  const [deleting, setDeleting] = useState(false);
  const [cloudAuthIssue, setCloudAuthIssue] = useState<CloudAuthIssue | null>(null);

  const resetGroups = () => {
    setGroups([]);
    setCloudAuthIssue(null);
  };

  const replaceGroups = (nextGroups: DuplicateGroup[]) => {
    setGroups(nextGroups);
    setCloudAuthIssue(null);
  };

  const getFileKey = (file: CloudFile) => `${file.accountId ?? ''}:${file.id}`;

  const removeFromGroups = (file: CloudFile) => {
    const targetKey = getFileKey(file);

    setGroups((previousGroups) => previousGroups.map((group) => ({
      ...group,
      files: group.files.filter(
        (current) => getFileKey(current) !== targetKey,
      ),
    })).filter((group) => group.files.length > 1));
  };

  const deleteFile = async (file: CloudFile): Promise<boolean> => {
    if (!file.accountId) {
      return false;
    }

    const previousGroups = groups;
    removeFromGroups(file);

    try {
      await deleteFileApi(file.accountId, file.id);
      setCloudAuthIssue(null);
      return true;
    } catch (error: unknown) {
      setGroups(previousGroups);

      if (
        error instanceof ApiError && error.code === 'CLOUD_REAUTH_REQUIRED'
      ) {
        const accountId = error.accountId ?? file.accountId;
        const provider = error.provider ?? file.provider;

        if (accountId && provider) {
          setCloudAuthIssue({
            accountId,
            provider,
            accountEmail: error.accountEmail ?? file.accountEmail ?? '',
          });
        }
      }

      return false;
    }
  };

  const deleteDuplicates = async (filesToDelete: CloudFile[]) => {
    setDeleting(true);
    let success = 0;
    let failed = 0;

    try {
      for (const file of filesToDelete) {
        if (await deleteFile(file)) {
          success++;
        } else {
          failed++;
        }

        if (cloudAuthIssue) {
          break;
        }
      }

      return { success, failed };
    } finally {
      setDeleting(false);
    }
  };

  const duplicateFilesCount = groups.reduce(
    (total, group) => total + group.files.length - 1,
    0,
  );

  return {
    groups,
    deleting,
    duplicateFilesCount,
    cloudAuthIssue,
    resetGroups,
    replaceGroups,
    deleteFile,
    deleteDuplicates,
  };
}
