// frontend/src/integrations/queries/useMerge.ts
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

// Define types for the merge preview API response.
// These should be refined based on the actual API response shape.
interface MergeSuggestion {
  // Add properties for a merge suggestion
  [key: string]: any;
}

interface MergePreviewResponse {
  suggestions: MergeSuggestion[];
  conflicts: any[]; // Define conflict type more accurately if possible
  stats: {
    total_accounts: number;
    mapped: number;
    unmapped: number;
    suggestions: number;
    conflicts: number;
  };
}

const fetchMergePreview = async (companyId: string): Promise<MergePreviewResponse> => {
  if (!companyId) {
    throw new Error('Company ID is required to fetch merge preview.');
  }
  return await api.get<MergePreviewResponse>(`/merge/${companyId}/preview`);
};

export const usePreviewMerge = (companyId: string, options: { enabled?: boolean } = {}) => {
  return useQuery({
    queryKey: ['mergePreview', companyId],
    queryFn: () => fetchMergePreview(companyId),
    enabled: options.enabled,
  });
};
