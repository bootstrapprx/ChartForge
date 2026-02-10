// frontend/src/components/import-export/ExportPanel.tsx
import React from 'react';
import { useExportMasterChart } from '@/hooks/api/useMasterChart';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Download } from 'lucide-react';

const ExportPanel: React.FC = () => {
  const { toast } = useToast();
  const { refetch, isFetching } = useExportMasterChart();

  const handleExport = async () => {
    try {
      const { data } = await refetch();
      
      // This assumes the API returns a blob or similar file response
      const blob = new Blob([data as any], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'master_chart.xlsx';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      toast({
        title: 'Export Started',
        description: 'Your file is downloading.',
      });
    } catch (error: any) {
      toast({
        title: 'Export Failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Export Master Chart</CardTitle>
        <CardDescription>Download the complete Master Chart of Accounts as an Excel (.xlsx) file.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
            The exported file will contain all accounts, including their codes, descriptions, categories, and hierarchical structure.
        </p>
      </CardContent>
      <CardFooter>
        <Button onClick={handleExport} disabled={isFetching}>
          <Download className="h-4 w-4 mr-2" />
          {isFetching ? 'Exporting...' : 'Export to Excel'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ExportPanel;
