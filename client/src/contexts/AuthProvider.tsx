import { type ReactNode, useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as authService from '../services/authService';
import type { User } from '../types/auth';
import { AuthContext } from './AuthContext';

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  // Fetch the authenticated user on mount using React Query
  const { data: user = null, isLoading: loading } = useQuery<User | null>({
    queryKey: ['authUser'],
    queryFn: async () => {
      try {
        return await authService.me();
      } catch {
        return null;
      }
    },
    retry: false,
    staleTime: Infinity, // Keep user data fresh during the entire session
  });

  const login = useCallback(async (email: string, password: string) => {
    const fetchedUser = await authService.login(email, password);
    // Update the cache immediately to trigger a re-render
    queryClient.setQueryData(['authUser'], fetchedUser);
  }, [queryClient]);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const fetchedUser = await authService.register(name, email, password);
    queryClient.setQueryData(['authUser'], fetchedUser);
  }, [queryClient]);

  const logout = useCallback(async () => {
    await authService.logout();
    // Clear user from cache and clear all other queries to prevent data leaks
    queryClient.setQueryData(['authUser'], null);
    queryClient.clear();
  }, [queryClient]);

  const contextValue = useMemo(
    () => ({
      user,
      loading,
      login,
      register,
      logout,
    }),
    [user, loading, login, register, logout],
  );

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}
