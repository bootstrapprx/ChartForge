// frontend/src/pages/Mappings.tsx
import React, { useState } from 'react';
import ManualMappingEditor from '@/components/manual/mappings/ManualMappingEditor';
import { useManualCRUD } from '@/hooks/useManualCRUD';
import { MasterAccount } from '@/types/masterchart';
import { Company } from '@/types/company';
import { CompanyAccount } from '@/types/company_account';
import { QueryKey } from '@/lib/queryKeys';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useManualMode } from '@/contexts/ManualModeContext';
import { Button } from '@/components/ui/button';
import { useAutoMap } from '@/integrations/queries/useMapping';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';

const MappingsPage: React.FC = () => {
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const { isManualMode } = useManualMode();
  const { toast } = useToast();
  const autoMapMutation = useAutoMap();

  const { data: companies } = useManualCRUD<Company>({
    queryKey: QueryKey.COMPANIES,
    endpoint: '/companies',
  });

  const { data: masterChartAccounts } = useManualCRUD<MasterAccount>({
    queryKey: QueryKey.MASTER_CHART,
    endpoint: '/masterchart/accounts',
  });

  // This is a placeholder for fetching the company-specific chart
  const { data: companyChartAccounts } = useManualCRUD<CompanyAccount>({
    queryKey: companyChartKeys.list(selectedCompanyId!),
    endpoint: `/companychart/${selectedCompanyId}`,
    initialData: [],
  });

  const handleAutoMap = () => {
    if (selectedCompanyId) {
      autoMapMutation.mutate({ company_id: selectedCompanyId });
    } else {
      toast({
        title: 'Company ID Required',
        description: 'Please select a company to run auto-mapping.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Chart of Accounts Mapping</h1>

      <Card>
        <CardHeader>
          <CardTitle>Select Company</CardTitle>
        </CardHeader>
        <CardContent>
          <Select onValueChange={setSelectedCompanyId} value={selectedCompanyId || ''}>
            <SelectTrigger><SelectValue placeholder="Select a Company" /></SelectTrigger>
            <SelectContent>{companies?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedCompanyId && (
        <ManualMappingEditor
          masterChart={masterChartAccounts}
          companyChart={companyChartAccounts}
          onMap={() => {}}
          onAddCustomAccount={() => {}}
        />
      )}

      {!isManualMode && selectedCompanyId && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>AI Auto-Mapping</CardTitle>
            <CardDescription>
              Optionally, you can use the AI to suggest mappings.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleAutoMap} disabled={autoMapMutation.isPending}>
              {autoMapMutation.isPending ? 'Mapping...' : 'Run Auto-Map'}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MappingsPage;