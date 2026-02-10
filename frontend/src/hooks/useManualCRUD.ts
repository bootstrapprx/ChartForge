// frontend/src/hooks/useManualCRUD.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { QueryKey } from '@/lib/queryKeys';

interface Entity {
  id: number | string;
}

interface CRUDOptions<T> {
  queryKey: QueryKey;
  endpoint: string;
  initialData?: T[];
}

export const useManualCRUD = <T extends Entity, TCreate = Omit<T, 'id'>>({ queryKey, endpoint, initialData = [], queryParams = {} }: CRUDOptions<T> & { queryParams?: Record<string, string> }) => {
  const queryClient = useQueryClient();

  // Construct query string
  const queryString = new URLSearchParams(queryParams).toString();
  const fetchUrl = queryString ? `${endpoint}?${queryString}` : endpoint;

  const { data, isLoading, isError, refetch } = useQuery<T[]>({
    queryKey: [queryKey, queryParams],
    queryFn: async () => {
      try {
        return await api.get(fetchUrl);
      } catch (error) {
        // If the endpoint fails (e.g., 404), return initial data
        console.warn(`Could not fetch data from ${fetchUrl}. Falling back to initial data.`, error);
        return initialData;
      }
    },
    initialData,
  });

  const createMutation = useMutation<T, Error, TCreate>({
    mutationFn: async (newItem) => {
      return await api.post(endpoint, newItem);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
    },
  });

  const updateMutation = useMutation<T, Error, T>({
    mutationFn: async (itemToUpdate) => {
      return await api.put(`${endpoint}/${itemToUpdate.id}`, itemToUpdate);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
    },
  });

  const deleteMutation = useMutation<void, Error, number | string>({
    mutationFn: async (id) => {
      await api.delete(`${endpoint}/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
    },
  });

  return {
    data: data || initialData,
    isLoading,
    isError,
    createItem: createMutation.mutateAsync,
    updateItem: updateMutation.mutateAsync,
    deleteItem: deleteMutation.mutateAsync,
    refetch,
  };
};
