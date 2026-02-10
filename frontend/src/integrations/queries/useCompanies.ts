// frontend/src/integrations/queries/useCompanies.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { companyKeys } from '@/lib/queryKeys';
import { Company, CompanyCreate } from '@/types/company';
import { toast } from '@/hooks/use-toast';

// --- Query to get all companies ---
const fetchCompanies = async (): Promise<Company[]> => {
  return await api.get<Company[]>('/companies');
};

export const useGetCompanies = () => {
  return useQuery({
    queryKey: companyKeys.lists(),
    queryFn: fetchCompanies,
  });
};

// --- Mutation to create a new company ---
const createCompany = async (newCompany: CompanyCreate): Promise<Company> => {
  return await api.post<Company>('/companies', newCompany);
};

export const useCreateCompany = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createCompany,
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'New company created.',
      });
      queryClient.invalidateQueries({ queryKey: companyKeys.lists() });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to create company: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
};
