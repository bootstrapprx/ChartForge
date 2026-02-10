// frontend/src/components/integrations/companies/CompanyMergePreview.tsx
import React, { useState } from 'react';
import { Company } from '@/types/company';
import { usePreviewMerge } from '@/integrations/queries/useMerge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import MergePreview from '@/components/merge/MergePreview';

interface CompanyMergePreviewProps {
  companies: Company[];
}

const CompanyMergePreview: React.FC<CompanyMergePreviewProps> = ({ companies }) => {
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);

  const { data: mergePreview, isLoading: isLoadingPreview } = usePreviewMerge(selectedCompanyId!, {
    enabled: !!selectedCompanyId,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Merge Preview</CardTitle>
        <CardDescription>
          This is an optional feature. Select a company to preview its mapping suggestions against the Master Chart.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid sm:grid-cols-2 gap-4">
        <Select onValueChange={setSelectedCompanyId} value={selectedCompanyId || ''}>
          <SelectTrigger><SelectValue placeholder="Select a Company" /></SelectTrigger>
          <SelectContent>{companies?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
        </Select>
      </CardContent>

      { (isLoadingPreview || mergePreview) && (
        <MergePreview previewData={mergePreview} isLoading={isLoadingPreview} />
      )}
    </Card>
  );
};

export default CompanyMergePreview;
