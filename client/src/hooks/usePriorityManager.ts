import { useState, useEffect, useMemo } from 'react';
import type { CloudAccount, CloudFile, DuplicateGroup } from '../types/cloud';

export function usePriorityManager(accounts: CloudAccount[], groups: DuplicateGroup[]) {
  const [priorityOrder, setPriorityOrder] = useState<string[]>([]);

  useEffect(() => {
    const accountIds = accounts.map((a) => a.id);
    setPriorityOrder((prev) => {
      const current = prev.filter((id) => accountIds.includes(id));
      const newIds = accountIds.filter((id) => !current.includes(id));
      return [...current, ...newIds];
    });
  }, [accounts]);

  const getKeepFile = (groupFiles: CloudFile[]) => {
    let keepFile = groupFiles[0];
    let bestPriority = Infinity;

    groupFiles.forEach((file) => {
      if (!file.accountId) return;
      const prioIndex = priorityOrder.indexOf(file.accountId);
      if (prioIndex !== -1 && prioIndex < bestPriority) {
        bestPriority = prioIndex;
        keepFile = file;
      }
    });
    return keepFile;
  };

  const savings = useMemo(() => {
    const calc: Record<string, number> = {};
    accounts.forEach((a) => (calc[a.id] = 0));

    groups.forEach((group) => {
      const keepFile = getKeepFile(group.files);
      group.files.forEach((file) => {
        if (file !== keepFile && file.accountId && file.size) {
          calc[file.accountId] = (calc[file.accountId] || 0) + parseInt(file.size, 10);
        }
      });
    });
    return calc;
  }, [groups, priorityOrder, accounts]);

  const getFilesToDelete = () => {
    return groups.flatMap((group) => {
      const keepFile = getKeepFile(group.files);
      return group.files.filter((f) => f !== keepFile);
    });
  };

  const movePriority = (index: number, direction: 'up' | 'down') => {
    const newOrder = [...priorityOrder];
    if (direction === 'up' && index > 0) {
      [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    } else if (direction === 'down' && index < newOrder.length - 1) {
      [newOrder[index + 1], newOrder[index]] = [newOrder[index], newOrder[index + 1]];
    }
    setPriorityOrder(newOrder);
  };

  return {
    priorityOrder,
    savings,
    getKeepFile,
    getFilesToDelete,
    movePriority
  };
}