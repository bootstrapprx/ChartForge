// frontend/src/components/import-export/ImportWizard.tsx
import React, { useState } from 'react';
import { useImportMasterChart } from '@/hooks/api/useMasterChart';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { UploadCloud, FileCheck2 } from 'lucide-react';

const ImportWizard: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const { toast } = useToast();
  const importMutation = useImportMasterChart();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFile(event.target.files[0]);
    }
  };

  const handleImport = () => {
    if (!file) {
      toast({
        title: 'No file selected',
        description: 'Please select a file to import.',
        variant: 'destructive',
      });
      return;
    }

    importMutation.mutate(file, {
      onSuccess: (data) => {
        toast({
          title: 'Import Successful',
          description: `${(data as any).created} accounts created, ${(data as any).updated} updated.`,
        });
        setFile(null);
      },
      onError: (error) => {
        toast({
          title: 'Import Failed',
          description: error.message,
          variant: 'destructive',
        });
      },
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Import Master Chart</CardTitle>
        <CardDescription>Upload an Excel (.xlsx) or JSON file to create or update your Master Chart of Accounts.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center w-full">
          <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-muted hover:bg-muted/80">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              {file ? (
                <>
                    <FileCheck2 className="w-10 h-10 mb-3 text-green-500" />
                    <p className="mb-2 text-sm"><span className="font-semibold">{file.name}</span> selected</p>
                </>
              ) : (
                <>
                    <UploadCloud className="w-10 h-10 mb-3 text-muted-foreground" />
                    <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                    <p className="text-xs text-muted-foreground">XLSX or JSON</p>
                </>
              )}
            </div>
            <Input id="dropzone-file" type="file" className="hidden" onChange={handleFileChange} accept=".xlsx,.xls,.json" />
          </label>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleImport} disabled={!file || importMutation.isPending}>
          {importMutation.isPending ? 'Importing...' : 'Start Import'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ImportWizard;
