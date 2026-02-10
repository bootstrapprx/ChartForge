// frontend/src/components/manual/mappings/ManualMappingEditor.tsx
import React, { useState } from 'react';
import { MasterAccountNode } from '@/types/masterchart';
import { CompanyAccount } from '@/types/company_account'; // Assuming this type exists
import ReadOnlyMasterChartTree from '@/components/integrations/masterchart/ReadOnlyMasterChartTree';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

interface ManualMappingEditorProps {
  masterChart: MasterAccountNode[];
  companyChart: CompanyAccount[];
  onMap: (masterAccountId: string, companyAccountId: string) => void;
  onAddCustomAccount: () => void;
}

const ManualMappingEditor: React.FC<ManualMappingEditorProps> = ({
  masterChart,
  companyChart,
  onMap,
  onAddCustomAccount,
}) => {
  const [selectedMasterAccount, setSelectedMasterAccount] = useState<MasterAccountNode | null>(null);
  const [selectedCompanyAccount, setSelectedCompanyAccount] = useState<CompanyAccount | null>(null);

  const handleMap = () => {
    if (selectedMasterAccount && selectedCompanyAccount) {
      onMap(selectedMasterAccount.id, selectedCompanyAccount.id);
    }
  };

  return (
    <div className="grid md:grid-cols-2 gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Master Chart of Accounts</CardTitle>
        </CardHeader>
        <CardContent>
          {/* This is a simplified representation. A real implementation would need a way to select nodes. */}
          <ReadOnlyMasterChartTree nodes={masterChart} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Company Chart of Accounts</CardTitle>
          <Button onClick={onAddCustomAccount}>Add Custom</Button>
        </CardHeader>
        <CardContent>
          {/* This will be an editable tree for the company chart */}
          <p>Company chart tree will go here.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ManualMappingEditor;
