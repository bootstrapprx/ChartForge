// frontend/src/hooks/api/useUpload.ts
import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';

export const useUploadFile = () => {
  return useMutation({
    mutationFn: (data: { file: File; companyId: string }) => {
      const formData = new FormData();
      formData.append('file', data.file);
      return api.post(`/upload/${data.companyId}`, formData);
    },
  });
};
