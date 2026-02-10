// frontend/src/pages/template/DefaultTemplatePage.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  TemplateAccount,
  TemplateStats,
  MasterAccountNode,
} from '@/types/masterchart';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import {
  Search,
  TreePine,
  TableIcon,
  ChevronRight,
  ChevronDown,
  Filter,
  Download,
  Copy,
  Loader2,
  BarChart,
  FileSpreadsheet,
  Building2,
  Info,
  Tag,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';

// Fetch template accounts
const fetchTemplate = async (params: {
  search?: string;
  category?: string;
  type?: string;
  tag?: string;
  limit?: number;
  offset?: number;
}) => {
  return api.get<{ total: number; accounts: TemplateAccount[] }>('/masterchart/template/default', {
    params: {
      search: params.search,
      category: params.category,
      account_type: params.type,
      tag: params.tag,
      limit: params.limit,
      offset: params.offset,
    },
  });
};

// Fetch template tree
const fetchTemplateTree = async () => {
  return api.get('/masterchart/template/tree');
};

// Fetch template stats
const fetchTemplateStats = async (): Promise<TemplateStats> => {
  return api.get<TemplateStats>('/masterchart/template/stats');
};

// Fetch categories
const fetchCategories = async (): Promise<string[]> => {
  return api.get<string[]>('/masterchart/template/categories');
};

// Fetch tags
const fetchTags = async (): Promise<string[]> => {
  return api.get<string[]>('/masterchart/template/tags');
};

// Apply template to company
const applyTemplate = async (companyUcid: string): Promise<any> => {
  return api.post<any>(
    `/masterchart/template/apply/${companyUcid}`,
    {},
    { params: { create_version: 'true' } }
  );
};

// Tree Node Component
interface TreeNodeProps {
  node: any;
  level: number;
  onSelect: (node: any) => void;
}

const TreeNode: React.FC<TreeNodeProps> = ({ node, level, onSelect }) => {
  const [isOpen, setIsOpen] = useState(level < 2);
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div className="select-none">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div
          className={cn(
            'flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-muted cursor-pointer',
            'transition-colors duration-150'
          )}
          style={{ paddingLeft: `${level * 16 + 8}px` }}
          onClick={() => onSelect(node)}
        >
          {hasChildren ? (
            <CollapsibleTrigger
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(!isOpen);
              }}
              className="p-0.5"
            >
              {isOpen ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
            </CollapsibleTrigger>
          ) : (
            <span className="w-5" />
          )}
          <span
            className={cn(
              'text-sm',
              node.type === 'H' ? 'font-semibold' : 'font-normal'
            )}
          >
            <span className="text-muted-foreground">{node.code}</span>
            <span className="mx-1">-</span>
            {node.description}
          </span>
          {node.type === 'H' && (
            <Badge variant="outline" className="ml-auto text-xs">
              Header
            </Badge>
          )}
        </div>
        {hasChildren && (
          <CollapsibleContent>
            {node.children.map((child: any) => (
              <TreeNode
                key={child.code}
                node={child}
                level={level + 1}
                onSelect={onSelect}
              />
            ))}
          </CollapsibleContent>
        )}
      </Collapsible>
    </div>
  );
};

// Account Detail Panel
interface AccountDetailProps {
  account: TemplateAccount | null;
  onClose: () => void;
}

const AccountDetailPanel: React.FC<AccountDetailProps> = ({ account, onClose }) => {
  if (!account) return null;

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{account.code}</CardTitle>
            <CardDescription>{account.description}</CardDescription>
          </div>
          <Badge variant={account.type === 'H' ? 'default' : 'secondary'}>
            {account.type === 'H' ? 'Header' : 'Detail'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="text-muted-foreground">Category</span>
            <p className="font-medium">{account.category}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Normal Balance</span>
            <p className="font-medium">{account.normal_balance || 'N/A'}</p>
          </div>
          <div>
            <span className="text-muted-foreground">FS Mapping</span>
            <p className="font-medium">{account.fs_mapping || 'N/A'}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Subcategory</span>
            <p className="font-medium">{account.subcategory || 'N/A'}</p>
          </div>
        </div>

        {account.long_description && (
          <div>
            <span className="text-muted-foreground">Long Description</span>
            <p className="mt-1 text-xs bg-muted p-2 rounded max-h-32 overflow-y-auto">
              {account.long_description}
            </p>
          </div>
        )}

        {account.tags && account.tags.length > 0 && (
          <div>
            <span className="text-muted-foreground">Tags</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {account.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {account.regulatory_mapping && (
          <div>
            <span className="text-muted-foreground">Regulatory Mapping</span>
            <p className="text-xs mt-1">{account.regulatory_mapping}</p>
          </div>
        )}

        {account.gaap_classification && (
          <div>
            <span className="text-muted-foreground">GAAP Classification</span>
            <p className="font-medium">{account.gaap_classification}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const DefaultTemplatePage: React.FC = () => {
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState<'tree' | 'table'>('tree');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [selectedAccount, setSelectedAccount] = useState<TemplateAccount | null>(null);
  const [showApplyDialog, setShowApplyDialog] = useState(false);
  const [companyUcid, setCompanyUcid] = useState('');

  // Queries
  const {
    data: templateData,
    isLoading: isLoadingTemplate,
    refetch: refetchTemplate,
  } = useQuery({
    queryKey: ['template', searchTerm, selectedCategory, selectedType, selectedTag],
    queryFn: () =>
      fetchTemplate({
        search: searchTerm,
        category: selectedCategory,
        type: selectedType,
        tag: selectedTag,
        limit: 500,
      }),
  });

  const { data: treeData, isLoading: isLoadingTree } = useQuery({
    queryKey: ['template-tree'],
    queryFn: fetchTemplateTree,
    enabled: viewMode === 'tree',
  });

  const { data: stats } = useQuery({
    queryKey: ['template-stats'],
    queryFn: fetchTemplateStats,
  });

  const { data: categories } = useQuery({
    queryKey: ['template-categories'],
    queryFn: fetchCategories,
  });

  const { data: tags } = useQuery({
    queryKey: ['template-tags'],
    queryFn: fetchTags,
  });

  // Apply template mutation
  const applyMutation = useMutation({
    mutationFn: applyTemplate,
    onSuccess: (result) => {
      toast({
        title: 'Template Applied',
        description: `Created ${result.created} accounts for ${companyUcid}`,
      });
      setShowApplyDialog(false);
      setCompanyUcid('');
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleApplyTemplate = () => {
    if (!companyUcid.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a company UCID',
        variant: 'destructive',
      });
      return;
    }
    applyMutation.mutate(companyUcid);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setSelectedType('');
    setSelectedTag('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Default Master Template</h1>
          <p className="text-muted-foreground">
            Standard Chart of Accounts template based on US-GAAP standards
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowApplyDialog(true)}>
            <Copy className="h-4 w-4 mr-2" />
            Apply to Company
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Accounts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_accounts}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Header Accounts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.header_count}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Detail Accounts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.detail_count}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Unique Tags
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.unique_tags}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters & View Toggle */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search accounts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={selectedCategory || "ALL"} onValueChange={(v) => setSelectedCategory(v === "ALL" ? "" : v)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Categories</SelectItem>
            {categories?.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedType || "ALL"} onValueChange={(v) => setSelectedType(v === "ALL" ? "" : v)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Types</SelectItem>
            <SelectItem value="H">Header</SelectItem>
            <SelectItem value="D">Detail</SelectItem>
          </SelectContent>
        </Select>

        <Select value={selectedTag || "ALL"} onValueChange={(v) => setSelectedTag(v === "ALL" ? "" : v)}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Filter by Tag" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Tags</SelectItem>
            {tags?.slice(0, 50).map((tag) => (
              <SelectItem key={tag} value={tag}>
                {tag}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {(searchTerm || selectedCategory || selectedType || selectedTag) && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            Clear Filters
          </Button>
        )}

        <div className="ml-auto flex gap-1">
          <Button
            variant={viewMode === 'tree' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('tree')}
          >
            <TreePine className="h-4 w-4 mr-1" />
            Tree
          </Button>
          <Button
            variant={viewMode === 'table' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('table')}
          >
            <TableIcon className="h-4 w-4 mr-1" />
            Table
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Accounts List/Tree */}
        <div className="lg:col-span-2">
          <Card className="h-[600px]">
            <CardContent className="p-0 h-full">
              {viewMode === 'tree' ? (
                <ScrollArea className="h-full p-4">
                  {isLoadingTree ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : treeData && treeData.length > 0 ? (
                    treeData.map((node: any) => (
                      <TreeNode
                        key={node.code}
                        node={node}
                        level={0}
                        onSelect={setSelectedAccount}
                      />
                    ))
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      No accounts found
                    </div>
                  )}
                </ScrollArea>
              ) : (
                <ScrollArea className="h-full">
                  <Table>
                    <TableHeader className="sticky top-0 bg-background">
                      <TableRow>
                        <TableHead className="w-[100px]">Code</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="w-[100px]">Type</TableHead>
                        <TableHead className="w-[120px]">Category</TableHead>
                        <TableHead className="w-[100px]">Balance</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoadingTemplate ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                          </TableCell>
                        </TableRow>
                      ) : templateData?.accounts?.length > 0 ? (
                        templateData.accounts.map((account: TemplateAccount) => (
                          <TableRow
                            key={account.code}
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => setSelectedAccount(account)}
                          >
                            <TableCell className="font-mono text-xs">
                              {account.code}
                            </TableCell>
                            <TableCell>
                              <span
                                className={cn(
                                  account.type === 'H' ? 'font-semibold' : ''
                                )}
                              >
                                {account.description}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={account.type === 'H' ? 'default' : 'secondary'}
                                className="text-xs"
                              >
                                {account.type === 'H' ? 'Header' : 'Detail'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs">
                              {account.category}
                            </TableCell>
                            <TableCell className="text-xs">
                              {account.normal_balance || '-'}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell
                            colSpan={5}
                            className="text-center py-8 text-muted-foreground"
                          >
                            No accounts found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                  {templateData && (
                    <div className="p-4 text-sm text-muted-foreground border-t">
                      Showing {templateData.accounts?.length || 0} of {templateData.total} accounts
                    </div>
                  )}
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Detail Panel */}
        <div className="lg:col-span-1">
          {selectedAccount ? (
            <AccountDetailPanel
              account={selectedAccount}
              onClose={() => setSelectedAccount(null)}
            />
          ) : (
            <Card className="h-[600px] flex items-center justify-center">
              <CardContent className="text-center text-muted-foreground">
                <Info className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Select an account to view details</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Apply Template Dialog */}
      <Dialog open={showApplyDialog} onOpenChange={setShowApplyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Apply Template to Company
            </DialogTitle>
            <DialogDescription>
              This will clone the master template accounts to the specified company.
              Existing accounts will not be overwritten.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <label className="text-sm font-medium">Company UCID</label>
            <Input
              placeholder="Enter company UCID"
              value={companyUcid}
              onChange={(e) => setCompanyUcid(e.target.value)}
              className="mt-1"
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApplyDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleApplyTemplate}
              disabled={applyMutation.isPending || !companyUcid.trim()}
            >
              {applyMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Applying...
                </>
              ) : (
                'Apply Template'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DefaultTemplatePage;
