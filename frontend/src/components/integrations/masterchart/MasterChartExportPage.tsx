// frontend/src/pages/masterchart/MasterChartExportPage.tsx
import React from 'react';
import ExportPanel from '@/components/import-export/ExportPanel';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

const MasterChartExportPage = () => {
  return (
    <div className="space-y-6">
        <div className="flex items-center space-x-4">
            <Button asChild variant="outline" size="icon">
                <Link href="/masterchart"><ArrowLeft className="h-4 w-4" /></Link>
            </Button>
            <h1 className="text-2xl font-bold">Export Master Chart</h1>
        </div>
        <ExportPanel />
    </div>
  );
};

export default MasterChartExportPage;
