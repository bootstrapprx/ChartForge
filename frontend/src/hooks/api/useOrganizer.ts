// frontend/src/hooks/api/useOrganizer.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { OrganizerClassification, OrganizerMemory, OrganizerRule } from '@/types/organizer';

const organizerKeys = {
  all: ['organizer'] as const,
  classifications: () => [...organizerKeys.all, 'classifications'] as const,
  memory: () => [...organizerKeys.all, 'memory'] as const,
  rules: () => [...organizerKeys.all, 'rules'] as const,
};

export const useClassifyDescription = () => {
    return useMutation({
        mutationFn: (text: string) => 
            api.post<OrganizerClassification>('/organizer/classify', { text }),
    });
};

export const useGetMemory = () => {
    return useQuery({
        queryKey: organizerKeys.memory(),
        queryFn: () => api.get<OrganizerMemory[]>('/organizer/memory'),
    });
};

export const useGetRules = () => {
    return useQuery({
        queryKey: organizerKeys.rules(),
        queryFn: () => api.get<OrganizerRule[]>('/organizer/rules'),
    });
};

export const useConfirmClassification = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: { text: string; chosen_category: string; chosen_parent?: string }) =>
            api.post('/organizer/confirm', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: organizerKeys.memory() });
            queryClient.invalidateQueries({ queryKey: organizerKeys.rules() });
        },
    });
};

export const useRejectClassification = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: { text: string; chosen_category: string; chosen_parent?: string }) =>
            api.post('/organizer/reject', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: organizerKeys.memory() });
        },
    });
};

export const useIngestExample = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: { text: string; confirmed_category: string; confirmed_parent?: string }) =>
            api.post('/organizer/ingest', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: organizerKeys.memory() });
        },
    });
};
