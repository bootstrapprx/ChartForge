// frontend/src/hooks/api/useMasterChart.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { MasterAccountNode, MasterChartStats } from '@/types/masterchart';

const masterChartKeys = {
  all: ['masterChart'] as const,
  tree: () => [...masterChartKeys.all, 'tree'] as const,
  stats: () => [...masterChartKeys.all, 'stats'] as const,
};

export const useMasterChartTree = () => {
  return useQuery({
    queryKey: masterChartKeys.tree(),
    queryFn: () => api.get<MasterAccountNode[]>('/masterchart/tree'),
  });
};

export const useMasterChartStats = () => {
  return useQuery({
    queryKey: masterChartKeys.stats(),
    queryFn: () => api.get<MasterChartStats>('/masterchart/stats'),
  });
};

export const useCreateMasterAccount = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: { accountData: any, parentCode?: string }) => 
            api.post(`/masterchart/accounts?parent_code=${data.parentCode || ''}`, data.accountData),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: masterChartKeys.all });
        },
    });
};

export const useImportMasterChart = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (file: File) => {
            const formData = new FormData();
            formData.append('file', file);
            return api.post('/masterchart/import', formData);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: masterChartKeys.all });
        },
    });
};

export const useExportMasterChart = () => {
    return useQuery({
        queryKey: [...masterChartKeys.all, 'export'],
        queryFn: () => api.get('/masterchart/export', { headers: { 'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' } }),
        enabled: false, // To be triggered manually
    });
};

export const useRebuildMasterChart = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: () => api.post('/masterchart/rebuild', {}),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: masterChartKeys.all });
        },
    });
};
