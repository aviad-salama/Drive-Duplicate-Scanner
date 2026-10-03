import { useCallback, useEffect, useState } from 'react';
import { disconnectAccount, listAccounts } from '../services/cloudService';
import type { CloudAccount } from '../types/cloud';

export function useCloudAccounts() {
  const [accounts, setAccounts] = useState<CloudAccount[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      setAccounts(await listAccounts());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const disconnect = async (id: string) => {
    await disconnectAccount(id);
    await refresh();
  };

  return { accounts, loading, disconnect };
}