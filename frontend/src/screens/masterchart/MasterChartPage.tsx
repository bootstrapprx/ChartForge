// frontend/src/pages/masterchart/MasterChartPage.tsx
import React from 'react';
import { useMasterChartStats, useRebuildMasterChart } from '@/hooks/api/useMasterChart';
import MasterChartStats from '@/components/masterchart/MasterChartStats';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { RefreshCw, FileInput, FileOutput, Network } from 'lucide-react';
import { useManualMode } from '@/contexts/ManualModeContext';

const MasterChartPage = () => {
  const { data: stats, isLoading: isLoadingStats, error } = useMasterChartStats();
  const rebuildMutation = useRebuildMasterChart();
  const { toast } = useToast();
  const { isManualMode } = useManualMode();

  const handleRebuild = () => {
    rebuildMutation.mutate(undefined, {
      onSuccess: () => toast({ title: 'Success', description: 'Master Chart hierarchy has been rebuilt.' }),
      onError: (err) => toast({ title: 'Error', description: `Failed to rebuild: ${err.message}`, variant: 'destructive' }),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Master Chart Dashboard</h1>
        <div className="flex space-x-2">
            <Button asChild><Link href="/masterchart/interactive"><Network className="h-4 w-4 mr-2" /> Interactive Editor</Link></Button>
            <Button asChild variant="outline"><Link href="/masterchart/tree"><Network className="h-4 w-4 mr-2" /> View Tree</Link></Button>
            {!isManualMode && (
              <>
                <Button asChild variant="outline"><Link href="/masterchart/import"><FileInput className="h-4 w-4 mr-2" /> Import</Link></Button>
                <Button asChild variant="outline"><Link href="/masterchart/export"><FileOutput className="h-4 w-4 mr-2" /> Export</Link></Button>
              </>
            )}
        </div>
      </div>
      
      <MasterChartStats stats={stats!} isLoading={isLoadingStats} />

      {!isManualMode && (
        <div className="flex items-center justify-end space-x-2">
          <Button onClick={handleRebuild} disabled={rebuildMutation.isPending}>
            <RefreshCw className="h-4 w-4 mr-2" />
            {rebuildMutation.isPending ? 'Rebuilding...' : 'Rebuild Hierarchy'}
          </Button>
        </div>
      )}

      {error && <div className="text-destructive">Failed to load stats: {error.message}</div>}
    </div>
  );
};

export default MasterChartPage;
