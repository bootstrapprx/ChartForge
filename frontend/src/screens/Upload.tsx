import React, { useState } from 'react';
import { useUploadCompanyChart, useImportMasterChart } from '@/integrations/queries/useUpload';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

const UploadPage: React.FC = () => {
  const { toast } = useToast();
  const [companyFile, setCompanyFile] = useState<File | null>(null);
  const [masterFile, setMasterFile] = useState<File | null>(null);
  const [companyId, setCompanyId] = useState<string>('');

  const uploadCompanyChartMutation = useUploadCompanyChart();
  const importMasterChartMutation = useImportMasterChart();

  const handleCompanyFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setCompanyFile(event.target.files[0]);
    }
  };

  const handleMasterFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setMasterFile(event.target.files[0]);
    }
  };

  const handleUploadCompanyChart = () => {
    if (companyFile && companyId) {
      uploadCompanyChartMutation.mutate({ file: companyFile, companyId });
    } else {
      toast({
        title: 'Missing Information',
        description: 'Please select a file and enter a Company ID.',
        variant: 'destructive',
      });
    }
  };

  const handleImportMasterChart = () => {
    if (masterFile) {
      importMasterChartMutation.mutate({ file: masterFile });
    } else {
      toast({
        title: 'Missing File',
        description: 'Please select a file to import.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="container mx-auto p-4 grid gap-8 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Upload Company Chart of Accounts</CardTitle>
          <CardDescription>Upload an Excel file (.xlsx, .xls) for a specific company.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            type="text"
            placeholder="Enter Company ID"
            value={companyId}
            onChange={(e) => setCompanyId(e.target.value)}
            className="max-w-xs"
          />
          <Input
            type="file"
            onChange={handleCompanyFileChange}
            accept=".xlsx, .xls, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
          />
          <Button onClick={handleUploadCompanyChart} disabled={uploadCompanyChartMutation.isPending}>
            {uploadCompanyChartMutation.isPending ? 'Uploading...' : 'Upload for Company'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Import Master Chart</CardTitle>
          <CardDescription>Bulk import accounts into the Master Chart from a JSON or Excel file.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            type="file"
            onChange={handleMasterFileChange}
            accept=".xlsx, .xls, .json, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel, application/json"
          />
          <Button onClick={handleImportMasterChart} disabled={importMasterChartMutation.isPending}>
            {importMasterChartMutation.isPending ? 'Importing...' : 'Import to Master'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default UploadPage;
