
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useDispatch } from 'react-redux';
import { refreshAccessToken } from '../../api/refreshClient';
import { setAuth, clearAuth } from '../../store/slices/authSlice';

/**
 * Hook for refreshing access token
 * Handles token refresh, localStorage update, and Redux sync
 */
export const useTokenRefresh = () => {
  const dispatch = useDispatch();
  const queryClient = useQueryClient();

  return useMutation({
    // refreshAccessToken is single-flight and writes localStorage itself.
    mutationFn: refreshAccessToken,

    onSuccess: ({ accessToken, refreshToken }) => {
      // Keep Redux in sync (tokens are already persisted).
      dispatch(setAuth({ accessToken, refreshToken }));

      // Invalidate all queries to refetch with new token
      queryClient.invalidateQueries();
    },

    onError: () => {
      // refreshAccessToken already cleared storage.
      dispatch(clearAuth());
    },

    // Never retry: with rotating refresh tokens the second attempt replays a
    // token the server has already consumed, guaranteeing a logout.
    retry: false,
  });
};

/**
 * Hook to manually trigger token refresh
 */
export const useManualRefresh = () => {
  const { mutate, mutateAsync, isPending, error } = useTokenRefresh();

  return {
    refresh: mutate,
    refreshAsync: mutateAsync,
    isRefreshing: isPending,
    error,
  };
};
