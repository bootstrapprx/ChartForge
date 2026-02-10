// frontend/src/integrations/queries/useMapping.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { companyChartKeys } from '@/lib/queryKeys';

export const useAutoMap = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { company_id: string }) =>
      api.post('/mapping/automap', data),
    onSuccess: (data, variables) => {
      toast({
        title: 'Auto-mapping started',
        description: 'The AI is processing the accounts. The chart will update shortly.',
      });
      queryClient.invalidateQueries({ queryKey: companyChartKeys.list(variables.company_id) });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Auto-mapping failed: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
};