// frontend/src/pages/masterchart/MasterChartImportPage.tsx
import React from 'react';
import ImportWizard from '@/components/import-export/ImportWizard';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

const MasterChartImportPage = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button asChild variant="outline" size="icon">
            <Link href="/masterchart"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <h1 className="text-2xl font-bold">Import Master Chart</h1>
      </div>
      <ImportWizard />
    </div>
  );
};

export default MasterChartImportPage;
