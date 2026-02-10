// frontend/src/integrations/queries/useUpload.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { UploadResponse } from '@/types/upload';
import { masterChartKeys, companyChartKeys } from '@/lib/queryKeys';

// --- Mutation for uploading a company-specific chart ---

interface UploadChartPayload {
  companyId: string;
  file: File;
}

const uploadCompanyChart = async ({ companyId, file }: UploadChartPayload): Promise<any> => {
  const formData = new FormData();
  formData.append('file', file);

  return await api.post<any>(`/upload?company_id=${companyId}`, formData);
};

export const useUploadCompanyChart = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: uploadCompanyChart,
    onSuccess: (data, variables) => {
      toast({
        title: 'Upload Successful',
        description: 'Company chart has been uploaded and is being processed.',
      });
      // Invalidate the specific company chart to trigger a refetch
      queryClient.invalidateQueries({ queryKey: companyChartKeys.detail(variables.companyId) });
    },
    onError: (error: Error) => {
      toast({
        title: 'Upload Failed',
        description: error.message || 'An unknown error occurred.',
        variant: 'destructive',
      });
    },
  });
};

// --- Mutation for bulk-importing into the Master Chart ---

interface ImportMasterChartPayload {
  file: File;
}

const importMasterChart = async ({ file }: ImportMasterChartPayload): Promise<UploadResponse> => {
  const formData = new FormData();
  formData.append('file', file);

  return await api.post<UploadResponse>('/masterchart/import', formData);
};

export const useImportMasterChart = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: importMasterChart,
    onSuccess: (data) => {
      toast({
        title: 'Import Successful',
        description: data.message || 'Master chart has been updated.',
      });
      // Invalidate all master chart queries to reflect the new data
      queryClient.invalidateQueries({ queryKey: masterChartKeys.all });
    },
    onError: (error: Error) => {
      toast({
        title: 'Import Failed',
        description: error.message || 'An unknown error occurred.',
        variant: 'destructive',
      });
    },
  });
};
