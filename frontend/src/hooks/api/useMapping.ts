// frontend/src/hooks/api/useMapping.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

const mappingKeys = {
  all: ['mapping'] as const,
  company: (companyId: string) => [...mappingKeys.all, 'company', companyId] as const,
};

export const useGetMapping = (companyId: string) => {
  return useQuery({
    queryKey: mappingKeys.company(companyId),
    queryFn: () => api.get(`/mapping/${companyId}`),
    enabled: !!companyId,
  });
};

export const useAutomapCompany = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (companyId: string) =>
            api.post(`/mapping/auto/${companyId}`, {}),
        onSuccess: (data, companyId) => {
            queryClient.invalidateQueries({ queryKey: mappingKeys.company(companyId) });
        },
    });
};

export const useUpdateMapping = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: { company_id: string; account_id: string; master_account_id: string | null }) =>
            api.put(`/mapping/${data.company_id}/${data.account_id}`, { master_account_id: data.master_account_id }),
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: mappingKeys.company(variables.company_id) });
        },
    });
};
