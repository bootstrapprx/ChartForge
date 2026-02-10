// frontend/src/pages/import/ImportEnginePage.tsx
import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useMutation } from '@tanstack/react-query';
import { ImportPreviewResult, ImportResult, ImportPreviewItem } from '@/types/masterchart';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  Loader2,
  ChevronDown,
  ChevronRight,
  Sparkles,
  RefreshCw,
  Check,
  X,
  Info,
  FileCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';

// Preview import API call - uses FormData so we need to handle differently
const previewImport = async (file: File, options: { enrichFromTemplate: boolean }): Promise<ImportPreviewResult> => {
  const formData = new FormData();
  formData.append('file', file);

  // Build URL with params
  const url = api.buildUrl(`/masterchart/import/preview?enrich_from_template=${options.enrichFromTemplate}`);

  const response = await fetch(url, {
    method: 'POST',
    body: formData,
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('chartforge_token')}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to preview import');
  }

  return response.json();
};

// Execute import API call
const executeImport = async (
  file: File,
  options: {
    enrichFromTemplate: boolean;
    applyCorrections: boolean;
    skipErrors: boolean;
    createVersion: boolean;
    acceptedCodes?: string[];
    rejectedCodes?: string[];
  }
): Promise<ImportResult> => {
  const formData = new FormData();
  formData.append('file', file);

  const params = new URLSearchParams();
  params.set('enrich_from_template', options.enrichFromTemplate.toString());
  params.set('apply_corrections', options.applyCorrections.toString());
  params.set('skip_errors', options.skipErrors.toString());
  params.set('create_version', options.createVersion.toString());
  if (options.acceptedCodes?.length) {
    params.set('accepted_codes', options.acceptedCodes.join(','));
  }
  if (options.rejectedCodes?.length) {
    params.set('rejected_codes', options.rejectedCodes.join(','));
  }

  const url = api.buildUrl(`/masterchart/import/execute?${params}`);

  const response = await fetch(url, {
    method: 'POST',
    body: formData,
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('chartforge_token')}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to execute import');
  }

  return response.json();
};

// Action badge colors
const getActionBadge = (action: string) => {
  switch (action) {
    case 'create':
      return <Badge className="bg-green-500">Create</Badge>;
    case 'update':
      return <Badge className="bg-blue-500">Update</Badge>;
    case 'skip':
      return <Badge variant="secondary">Skip</Badge>;
    case 'error':
      return <Badge variant="destructive">Error</Badge>;
    default:
      return <Badge variant="outline">{action}</Badge>;
  }
};

// Preview Item Row Component
interface PreviewItemRowProps {
  item: ImportPreviewItem;
  isSelected: boolean;
  isRejected: boolean;
  onToggleSelect: () => void;
  onToggleReject: () => void;
}

const PreviewItemRow: React.FC<PreviewItemRowProps> = ({
  item,
  isSelected,
  isRejected,
  onToggleSelect,
  onToggleReject,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasDetails = item.errors?.length || item.warnings?.length || item.suggested_corrections || item.changes;

  return (
    <>
      <TableRow className={cn(isRejected && 'opacity-50 bg-muted/30')}>
        <TableCell className="w-[50px]">
          {item.action !== 'error' && (
            <div className="flex gap-2">
              <Checkbox
                checked={isSelected && !isRejected}
                onCheckedChange={onToggleSelect}
                disabled={isRejected}
              />
            </div>
          )}
        </TableCell>
        <TableCell className="font-mono text-xs">{item.code}</TableCell>
        <TableCell className="max-w-[200px] truncate">{item.description}</TableCell>
        <TableCell>{getActionBadge(item.action)}</TableCell>
        <TableCell>
          {item.errors && item.errors.length > 0 && (
            <Badge variant="destructive" className="mr-1">
              {item.errors.length} errors
            </Badge>
          )}
          {item.warnings && item.warnings.length > 0 && (
            <Badge variant="outline" className="text-yellow-600">
              {item.warnings.length} warnings
            </Badge>
          )}
          {item.suggested_corrections && Object.keys(item.suggested_corrections).length > 0 && (
            <Badge variant="outline" className="text-blue-600 ml-1">
              <Sparkles className="h-3 w-3 mr-1" />
              Corrections
            </Badge>
          )}
        </TableCell>
        <TableCell className="text-right">
          <div className="flex items-center justify-end gap-2">
            {item.action !== 'error' && !isRejected && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleReject}
                className="text-destructive hover:text-destructive"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
            {isRejected && (
              <Button variant="ghost" size="sm" onClick={onToggleReject}>
                Restore
              </Button>
            )}
            {hasDetails && (
              <Button variant="ghost" size="sm" onClick={() => setIsExpanded(!isExpanded)}>
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
        </TableCell>
      </TableRow>
      {isExpanded && hasDetails && (
        <TableRow>
          <TableCell colSpan={6} className="bg-muted/30 py-3">
            <div className="space-y-2 text-sm">
              {item.errors && item.errors.length > 0 && (
                <div>
                  <span className="font-medium text-destructive">Errors:</span>
                  <ul className="list-disc list-inside ml-2">
                    {item.errors.map((err, i) => (
                      <li key={i} className="text-destructive">{err}</li>
                    ))}
                  </ul>
                </div>
              )}
              {item.warnings && item.warnings.length > 0 && (
                <div>
                  <span className="font-medium text-yellow-600">Warnings:</span>
                  <ul className="list-disc list-inside ml-2">
                    {item.warnings.map((warn, i) => (
                      <li key={i} className="text-yellow-600">{warn}</li>
                    ))}
                  </ul>
                </div>
              )}
              {item.suggested_corrections && Object.keys(item.suggested_corrections).length > 0 && (
                <div>
                  <span className="font-medium text-blue-600">Suggested Corrections:</span>
                  <ul className="list-disc list-inside ml-2">
                    {Object.entries(item.suggested_corrections).map(([field, correction]) => (
                      <li key={field}>
                        <strong>{field}:</strong> {correction}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {item.changes && Object.keys(item.changes).length > 0 && (
                <div>
                  <span className="font-medium">Changes:</span>
                  <ul className="list-disc list-inside ml-2">
                    {Object.entries(item.changes).map(([field, change]: [string, any]) => (
                      <li key={field}>
                        <strong>{field}:</strong> {String(change.old)} → {String(change.new)}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
};

const ImportEnginePage: React.FC = () => {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ImportPreviewResult | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [selectedCodes, setSelectedCodes] = useState<Set<string>>(new Set());
  const [rejectedCodes, setRejectedCodes] = useState<Set<string>>(new Set());

  // Options
  const [enrichFromTemplate, setEnrichFromTemplate] = useState(true);
  const [applyCorrections, setApplyCorrections] = useState(true);
  const [skipErrors, setSkipErrors] = useState(true);
  const [createVersion, setCreateVersion] = useState(true);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setPreview(null);
      setImportResult(null);
      setSelectedCodes(new Set());
      setRejectedCodes(new Set());
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
    },
    maxFiles: 1,
  });

  // Preview mutation
  const previewMutation = useMutation({
    mutationFn: () => {
      if (!file) throw new Error('No file selected');
      return previewImport(file, { enrichFromTemplate });
    },
    onSuccess: (result) => {
      setPreview(result);
      // Auto-select all valid items
      const validCodes = new Set(
        result.items
          .filter((item) => item.action !== 'error')
          .map((item) => item.code)
      );
      setSelectedCodes(validCodes);
      setRejectedCodes(new Set());
    },
    onError: (error: Error) => {
      toast({
        title: 'Preview Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Import mutation
  const importMutation = useMutation({
    mutationFn: () => {
      if (!file) throw new Error('No file selected');
      return executeImport(file, {
        enrichFromTemplate,
        applyCorrections,
        skipErrors,
        createVersion,
        acceptedCodes: Array.from(selectedCodes).filter((c) => !rejectedCodes.has(c)),
        rejectedCodes: Array.from(rejectedCodes),
      });
    },
    onSuccess: (result) => {
      setImportResult(result);
      toast({
        title: result.success ? 'Import Successful' : 'Import Completed with Errors',
        description: `Created: ${result.created}, Updated: ${result.updated}, Skipped: ${result.skipped}`,
        variant: result.success ? 'default' : 'destructive',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Import Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const toggleCode = (code: string) => {
    const newSelected = new Set(selectedCodes);
    if (newSelected.has(code)) {
      newSelected.delete(code);
    } else {
      newSelected.add(code);
    }
    setSelectedCodes(newSelected);
  };

  const toggleReject = (code: string) => {
    const newRejected = new Set(rejectedCodes);
    if (newRejected.has(code)) {
      newRejected.delete(code);
    } else {
      newRejected.add(code);
    }
    setRejectedCodes(newRejected);
  };

  const selectAll = () => {
    if (preview) {
      const allCodes = new Set(
        preview.items
          .filter((item) => item.action !== 'error')
          .map((item) => item.code)
      );
      setSelectedCodes(allCodes);
    }
  };

  const deselectAll = () => {
    setSelectedCodes(new Set());
  };

  const resetImport = () => {
    setFile(null);
    setPreview(null);
    setImportResult(null);
    setSelectedCodes(new Set());
    setRejectedCodes(new Set());
  };

  const effectiveSelected = Array.from(selectedCodes).filter((c) => !rejectedCodes.has(c));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Import Engine</h1>
        <p className="text-muted-foreground">
          Upload and preview CSV files before importing to the Master Chart
        </p>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center justify-center gap-4">
        <div className={cn('flex items-center gap-2', file && 'text-primary')}>
          <div className={cn(
            'w-8 h-8 rounded-full flex items-center justify-center border-2',
            file ? 'bg-primary text-primary-foreground border-primary' : 'border-muted'
          )}>
            1
          </div>
          <span className="text-sm font-medium">Upload</span>
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground" />
        <div className={cn('flex items-center gap-2', preview && 'text-primary')}>
          <div className={cn(
            'w-8 h-8 rounded-full flex items-center justify-center border-2',
            preview ? 'bg-primary text-primary-foreground border-primary' : 'border-muted'
          )}>
            2
          </div>
          <span className="text-sm font-medium">Preview</span>
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground" />
        <div className={cn('flex items-center gap-2', importResult && 'text-primary')}>
          <div className={cn(
            'w-8 h-8 rounded-full flex items-center justify-center border-2',
            importResult ? 'bg-primary text-primary-foreground border-primary' : 'border-muted'
          )}>
            3
          </div>
          <span className="text-sm font-medium">Import</span>
        </div>
      </div>

      {/* Import Result */}
      {importResult && (
        <Alert variant={importResult.success ? 'default' : 'destructive'}>
          <FileCheck className="h-4 w-4" />
          <AlertTitle>
            {importResult.success ? 'Import Completed Successfully' : 'Import Completed with Errors'}
          </AlertTitle>
          <AlertDescription className="mt-2">
            <div className="grid grid-cols-4 gap-4 text-sm">
              <div>
                <span className="font-medium text-green-600">{importResult.created}</span> created
              </div>
              <div>
                <span className="font-medium text-blue-600">{importResult.updated}</span> updated
              </div>
              <div>
                <span className="font-medium text-muted-foreground">{importResult.skipped}</span> skipped
              </div>
              <div>
                <span className="font-medium text-destructive">{importResult.errors.length}</span> errors
              </div>
            </div>
            {importResult.version_id && (
              <p className="mt-2 text-xs text-muted-foreground">
                Version ID: {importResult.version_id}
              </p>
            )}
            <Button variant="outline" size="sm" className="mt-4" onClick={resetImport}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Import Another File
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* File Upload Zone */}
      {!importResult && (
        <Card>
          <CardContent className="pt-6">
            <div
              {...getRootProps()}
              className={cn(
                'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
                isDragActive
                  ? 'border-primary bg-primary/5'
                  : 'border-muted-foreground/25 hover:border-primary/50'
              )}
            >
              <input {...getInputProps()} />
              {file ? (
                <div className="flex items-center justify-center gap-3">
                  <FileSpreadsheet className="h-10 w-10 text-primary" />
                  <div className="text-left">
                    <p className="font-medium">{file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(file.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      resetImport();
                    }}
                  >
                    Change
                  </Button>
                </div>
              ) : (
                <>
                  <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
                  <p className="font-medium">
                    {isDragActive ? 'Drop the file here' : 'Drag & drop a CSV file here'}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    or click to browse
                  </p>
                </>
              )}
            </div>

            {/* Options */}
            {file && !preview && (
              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enrich from Template</Label>
                    <p className="text-xs text-muted-foreground">
                      Fill missing fields using the master template
                    </p>
                  </div>
                  <Switch
                    checked={enrichFromTemplate}
                    onCheckedChange={setEnrichFromTemplate}
                  />
                </div>

                <Button
                  onClick={() => previewMutation.mutate()}
                  disabled={previewMutation.isPending}
                  className="w-full"
                >
                  {previewMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Preview Import
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Preview Results */}
      {preview && !importResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Import Preview</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={selectAll}>
                  Select All
                </Button>
                <Button variant="outline" size="sm" onClick={deselectAll}>
                  Deselect All
                </Button>
              </div>
            </CardTitle>
            <CardDescription>
              Review the changes before importing. You can accept or reject individual items.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Summary */}
            <div className="grid grid-cols-5 gap-4">
              <Card className="p-4">
                <p className="text-sm text-muted-foreground">Total Records</p>
                <p className="text-2xl font-bold">{preview.total_records}</p>
              </Card>
              <Card className="p-4">
                <p className="text-sm text-green-600">To Create</p>
                <p className="text-2xl font-bold text-green-600">{preview.to_create}</p>
              </Card>
              <Card className="p-4">
                <p className="text-sm text-blue-600">To Update</p>
                <p className="text-2xl font-bold text-blue-600">{preview.to_update}</p>
              </Card>
              <Card className="p-4">
                <p className="text-sm text-muted-foreground">To Skip</p>
                <p className="text-2xl font-bold">{preview.to_skip}</p>
              </Card>
              <Card className="p-4">
                <p className="text-sm text-destructive">Errors</p>
                <p className="text-2xl font-bold text-destructive">{preview.errors}</p>
              </Card>
            </div>

            {/* Validation Summary */}
            {preview.validation_summary && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Validation Summary</AlertTitle>
                <AlertDescription className="text-sm">
                  <span className="font-medium">{preview.validation_summary.valid_records}</span> valid records,{' '}
                  <span className="font-medium text-destructive">
                    {preview.validation_summary.invalid_records}
                  </span>{' '}
                  invalid,{' '}
                  <span className="font-medium">{preview.validation_summary.duplicate_codes}</span> duplicates,{' '}
                  <span className="font-medium">{preview.validation_summary.orphan_accounts}</span> orphans
                </AlertDescription>
              </Alert>
            )}

            {/* Items Table */}
            <ScrollArea className="h-[400px] border rounded-md">
              <Table>
                <TableHeader className="sticky top-0 bg-background">
                  <TableRow>
                    <TableHead className="w-[50px]"></TableHead>
                    <TableHead className="w-[100px]">Code</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="w-[100px]">Action</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[100px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {preview.items.map((item, index) => (
                    <PreviewItemRow
                      key={`${item.code}-${index}`}
                      item={item}
                      isSelected={selectedCodes.has(item.code)}
                      isRejected={rejectedCodes.has(item.code)}
                      onToggleSelect={() => toggleCode(item.code)}
                      onToggleReject={() => toggleReject(item.code)}
                    />
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>

            {/* Import Options */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Apply Corrections</Label>
                  <p className="text-xs text-muted-foreground">
                    Automatically apply suggested corrections
                  </p>
                </div>
                <Switch
                  checked={applyCorrections}
                  onCheckedChange={setApplyCorrections}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Skip Errors</Label>
                  <p className="text-xs text-muted-foreground">
                    Continue import even with errors
                  </p>
                </div>
                <Switch checked={skipErrors} onCheckedChange={setSkipErrors} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Create Version Snapshot</Label>
                  <p className="text-xs text-muted-foreground">
                    Save a backup before importing
                  </p>
                </div>
                <Switch
                  checked={createVersion}
                  onCheckedChange={setCreateVersion}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Selected for Import</Label>
                  <p className="text-xs text-muted-foreground">
                    {effectiveSelected.length} of {preview.items.length} items
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={resetImport}>
                Cancel
              </Button>
              <Button
                onClick={() => importMutation.mutate()}
                disabled={importMutation.isPending || effectiveSelected.length === 0}
              >
                {importMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Import {effectiveSelected.length} Items
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ImportEnginePage;
