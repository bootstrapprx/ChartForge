// frontend/src/hooks/api/useSnapshots.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Snapshot } from '@/types/snapshots';

const snapshotKeys = {
  all: ['snapshots'] as const,
  list: () => [...snapshotKeys.all, 'list'] as const,
};

export const useGetSnapshots = () => {
  return useQuery({
    queryKey: snapshotKeys.list(),
    queryFn: () => api.get<Snapshot[]>('/snapshots'),
  });
};

export const useCreateSnapshot = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: { name: string; description?: string; company_id?: string }) =>
            api.post<Snapshot>('/snapshots', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: snapshotKeys.list() });
        },
    });
};

export const useRestoreSnapshot = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (snapshotId: string) =>
            api.post(`/snapshots/${snapshotId}/restore`, {}),
        onSuccess: () => {
            // Invalidate master chart and other relevant data
            queryClient.invalidateQueries({ queryKey: ['masterChart'] });
        },
    });
};
