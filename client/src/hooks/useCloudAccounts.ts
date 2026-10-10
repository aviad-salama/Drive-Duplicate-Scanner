import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { disconnectAccount, listAccounts } from '../services/cloudService';
import type { CloudAccount } from '../types/cloud';

export function useCloudAccounts() {
  const queryClient = useQueryClient();

  // Fetch accounts using React Query for automatic caching and state management
  const { data: accounts = [], isLoading: loading } = useQuery<CloudAccount[]>({
    queryKey: ['cloudAccounts'],
    queryFn: listAccounts,
  });

  // Disconnect mutation with automatic cache invalidation
  const disconnectMutation = useMutation({
    mutationFn: (id: string) => disconnectAccount(id),
    onSuccess: () => {
      // Automatically refetch accounts after a successful disconnect
      queryClient.invalidateQueries({ queryKey: ['cloudAccounts'] });
    },
  });

  return { 
    accounts, 
    loading, 
    // Expose mutateAsync so it behaves like the old promise-based function
    disconnect: disconnectMutation.mutateAsync,
    isDisconnecting: disconnectMutation.isPending
  };
}