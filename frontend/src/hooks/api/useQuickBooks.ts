// frontend/src/hooks/api/useQuickBooks.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { QuickBooksSyncStatus, QBOAccount } from '@/types/quickbooks';

const qboKeys = {
  all: ['qbo'] as const,
  status: () => [...qboKeys.all, 'status'] as const,
  accounts: () => [...qboKeys.all, 'accounts'] as const,
};

export const useQuickBooksStatus = () => {
  return useQuery({
    queryKey: qboKeys.status(),
    queryFn: () => api.get<QuickBooksSyncStatus>('/qbo/status'),
  });
};

export const useQuickBooksAuthorize = () => {
    return useQuery({
        queryKey: [...qboKeys.all, 'authorize'],
        queryFn: () => api.get<{ authorization_url: string }>('/qbo/authorize'),
        enabled: false, // Trigger manually
    });
};

export const useQuickBooksDisconnect = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: () => api.post('/qbo/disconnect', {}),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: qboKeys.status() });
        },
    });
};

export const useFetchQBOAccounts = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: () => api.post<QBOAccount[]>('/qbo/accounts', {}),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: qboKeys.accounts() });
        },
    });
};

export const useSyncQBOAccounts = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (companyId: string) => 
            api.post(`/qbo/sync/${companyId}`, {}),
        onSuccess: () => {
            // Invalidate company chart data
            queryClient.invalidateQueries({ queryKey: ['companyChart'] });
        },
    });
};
