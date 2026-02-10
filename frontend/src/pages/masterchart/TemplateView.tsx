// frontend/src/pages/masterchart/TemplateView.tsx
// Displays the default Master Chart Template automatically on load

import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { TemplateStats, TemplateAccount } from '@/types/masterchart';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import {
  Search,
  TreePine,
  LayoutGrid,
  Table as TableIcon,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Folder,
  FileText,
  RefreshCw,
  Copy,
  Loader2,
  Layers,
  Hash,
  Users,
  X,
  Eye,
  Edit,
  Info,
  BookOpen,
  Building2,
  Brain,
  Sparkles,
  MessageSquare,
  Scale,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================================================
// API Functions - Using standardized endpoints
// ============================================================================

const fetchTemplateStats = async (): Promise<TemplateStats> => {
  return api.get<TemplateStats>('/masterchart/template/stats');
};

const fetchTemplateTree = async () => {
  return api.get('/masterchart/template/tree');
};

const fetchTemplateAccounts = async (params: {
  search?: string;
  category?: string;
  type?: string;
  tag?: string;
}) => {
  return api.get<{ total: number; accounts: TemplateAccount[] }>('/masterchart/template/default', {
    params: { ...params, limit: 1000 },
  });
};

const fetchCategories = async (): Promise<string[]> => {
  return api.get<string[]>('/masterchart/template/categories');
};

const fetchTags = async (): Promise<string[]> => {
  return api.get<string[]>('/masterchart/template/tags');
};

const explainAccount = async (code: string) => {
  return api.get(`/ai/explain-account/${code}`);
};

// ============================================================================
// Template Banner Component
// ============================================================================

interface TemplateBannerProps {
  onRefresh: () => void;
  onApply: () => void;
  isLoading: boolean;
}

const TemplateBanner: React.FC<TemplateBannerProps> = ({ onRefresh, onApply, isLoading }) => (
  <Alert className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200 dark:border-blue-800">
    <BookOpen className="h-5 w-5 text-blue-600" />
    <AlertTitle className="text-blue-800 dark:text-blue-200 font-semibold">
      Viewing Default Global Master Chart Template
    </AlertTitle>
    <AlertDescription className="text-blue-700 dark:text-blue-300 flex items-center justify-between mt-2">
      <span>This is the standard US-GAAP chart of accounts template.</span>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={onRefresh} disabled={isLoading}>
          <RefreshCw className={cn("h-4 w-4 mr-1", isLoading && "animate-spin")} />
          Refresh
        </Button>
        <Button size="sm" onClick={onApply}>
          <Copy className="h-4 w-4 mr-1" />
          Apply to Company
        </Button>
      </div>
    </AlertDescription>
  </Alert>
);

// ============================================================================
// Summary Cards Component
// ============================================================================

interface SummaryCardsProps {
  stats: TemplateStats | null;
  isLoading: boolean;
}

const SummaryCards: React.FC<SummaryCardsProps> = ({ stats, isLoading }) => {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="pt-6">
              <div className="h-8 bg-muted rounded w-16 mb-2" />
              <div className="h-4 bg-muted rounded w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: 'Total Accounts',
      value: stats?.total_accounts || 0,
      icon: Layers,
      color: 'text-blue-600',
      bg: 'bg-blue-50 dark:bg-blue-950/30',
    },
    {
      title: 'Header Accounts',
      value: stats?.header_count || 0,
      icon: Folder,
      color: 'text-purple-600',
      bg: 'bg-purple-50 dark:bg-purple-950/30',
    },
    {
      title: 'Detail Accounts',
      value: stats?.detail_count || 0,
      icon: FileText,
      color: 'text-green-600',
      bg: 'bg-green-50 dark:bg-green-950/30',
    },
    {
      title: 'Categories',
      value: stats ? Object.keys(stats.categories || {}).length : 0,
      icon: Hash,
      color: 'text-orange-600',
      bg: 'bg-orange-50 dark:bg-orange-950/30',
    },
    {
      title: 'Unique Tags',
      value: stats?.unique_tags || 0,
      icon: Users,
      color: 'text-cyan-600',
      bg: 'bg-cyan-50 dark:bg-cyan-950/30',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      {cards.map((card) => (
        <Card key={card.title} className={cn("transition-all hover:shadow-md", card.bg)}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold">{card.value.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">{card.title}</p>
              </div>
              <card.icon className={cn("h-8 w-8", card.color)} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

// ============================================================================
// Tree Node Component
// ============================================================================

interface TreeNodeProps {
  node: any;
  level: number;
  expandedNodes: Set<string>;
  toggleNode: (code: string) => void;
  onSelect: (node: any) => void;
  selectedCode: string | null;
}

const TreeNode: React.FC<TreeNodeProps> = ({
  node, level, expandedNodes, toggleNode, onSelect, selectedCode,
}) => {
  const hasChildren = node.children && node.children.length > 0;
  const isExpanded = expandedNodes.has(node.code);
  const isSelected = selectedCode === node.code;
  const isHeader = node.type === 'H' || node.type === 'Header';

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Asset': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'Liability': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      'Equity': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      'Revenue': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'Expense': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      'Cost of Goods Sold': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    };
    return colors[category] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
  };

  return (
    <div>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              "flex items-center gap-2 py-1.5 px-2 rounded-md cursor-pointer transition-colors",
              isSelected ? "bg-primary/10 border border-primary/30" : "hover:bg-muted",
            )}
            style={{ paddingLeft: `${level * 20 + 8}px` }}
            onClick={() => onSelect(node)}
          >
            {hasChildren ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleNode(node.code);
                }}
                className="p-0.5 hover:bg-muted rounded"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
            ) : (
              <span className="w-5" />
            )}

            {isHeader ? (
              <Folder className="h-4 w-4 text-amber-500" />
            ) : (
              <FileText className="h-4 w-4 text-blue-500" />
            )}

            <span className={cn("text-sm font-mono", isHeader && "font-semibold")}>
              {node.code}
            </span>
            <span className="text-sm truncate flex-1">{node.description}</span>

            <Badge variant="outline" className={cn("text-xs ml-auto", getCategoryColor(node.category))}>
              {node.category}
            </Badge>
          </div>
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-sm">
          <div className="space-y-1">
            <p className="font-semibold">{node.code} - {node.description}</p>
            <p className="text-xs text-muted-foreground">
              {node.long_description?.substring(0, 200) || 'No description available'}
              {node.long_description?.length > 200 && '...'}
            </p>
            <div className="flex gap-2 text-xs">
              <Badge variant="outline">{isHeader ? 'Header' : 'Detail'}</Badge>
              <Badge variant="outline">{node.normal_balance || 'N/A'}</Badge>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>

      {hasChildren && isExpanded && (
        <div>
          {node.children.map((child: any) => (
            <TreeNode
              key={child.code}
              node={child}
              level={level + 1}
              expandedNodes={expandedNodes}
              toggleNode={toggleNode}
              onSelect={onSelect}
              selectedCode={selectedCode}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// Account Detail Panel Component
// ============================================================================

interface AccountDetailPanelProps {
  account: TemplateAccount | null;
  onExplain: () => void;
  isExplaining: boolean;
  explanation: any | null;
}

const AccountDetailPanel: React.FC<AccountDetailPanelProps> = ({
  account, onExplain, isExplaining, explanation,
}) => {
  if (!account) {
    return (
      <Card className="h-full flex items-center justify-center">
        <CardContent className="text-center text-muted-foreground">
          <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Select an account to view details</p>
        </CardContent>
      </Card>
    );
  }

  const isHeader = account.type === 'H' || account.type === 'Header';

  return (
    <Card className="h-full overflow-hidden">
      <CardHeader className="pb-3 border-b">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg font-mono">{account.code}</CardTitle>
            <CardDescription>{account.description}</CardDescription>
          </div>
          <Badge variant={isHeader ? "default" : "secondary"}>
            {isHeader ? 'Header' : 'Detail'}
          </Badge>
        </div>
      </CardHeader>

      <ScrollArea className="h-[calc(100%-140px)]">
        <CardContent className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
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
              <span className="text-sm text-muted-foreground">Description</span>
              <p className="text-sm mt-1 p-2 bg-muted rounded max-h-24 overflow-y-auto">
                {account.long_description}
              </p>
            </div>
          )}

          {account.tags && account.tags.length > 0 && (
            <div>
              <span className="text-sm text-muted-foreground">Tags</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {account.tags.slice(0, 10).map((tag: string) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {account.regulatory_mapping && (
            <div>
              <span className="text-sm text-muted-foreground">Regulatory Mapping</span>
              <p className="text-xs mt-1">{account.regulatory_mapping}</p>
            </div>
          )}

          {/* AI Explanation */}
          {explanation && (
            <div className="p-3 bg-primary/5 rounded-lg border">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="font-medium text-sm">AI Explanation</span>
              </div>
              <p className="text-sm">{explanation.purpose}</p>
            </div>
          )}
        </CardContent>
      </ScrollArea>

      <CardFooter className="border-t p-3 bg-muted/30">
        <Button
          variant="outline"
          size="sm"
          onClick={onExplain}
          disabled={isExplaining}
          className="w-full"
        >
          {isExplaining ? (
            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
          ) : (
            <Brain className="h-4 w-4 mr-1" />
          )}
          Explain with Dexter AI
        </Button>
      </CardFooter>
    </Card>
  );
};

// ============================================================================
// Main TemplateView Component
// ============================================================================

const TemplateView: React.FC = () => {
  const { toast } = useToast();

  // State
  const [viewMode, setViewMode] = useState<'tree' | 'cards' | 'table'>('tree');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [type, setType] = useState('');
  const [tag, setTag] = useState('');
  const [selectedAccount, setSelectedAccount] = useState<TemplateAccount | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [showApplyDialog, setShowApplyDialog] = useState(false);
  const [companyUcid, setCompanyUcid] = useState('');
  const [explanation, setExplanation] = useState<any | null>(null);
  const [isExplaining, setIsExplaining] = useState(false);

  // Queries - automatically load on mount
  const { data: stats, isLoading: isLoadingStats, refetch: refetchStats } = useQuery({
    queryKey: ['template-stats'],
    queryFn: fetchTemplateStats,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  const { data: treeData, isLoading: isLoadingTree, refetch: refetchTree } = useQuery({
    queryKey: ['template-tree'],
    queryFn: fetchTemplateTree,
    staleTime: 5 * 60 * 1000,
  });

  const { data: accountsData, isLoading: isLoadingAccounts } = useQuery({
    queryKey: ['template-accounts', search, category, type, tag],
    queryFn: () => fetchTemplateAccounts({ search, category, type, tag }),
    staleTime: 5 * 60 * 1000,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['template-categories'],
    queryFn: fetchCategories,
    staleTime: 10 * 60 * 1000,
  });

  const { data: tags = [] } = useQuery({
    queryKey: ['template-tags'],
    queryFn: fetchTags,
    staleTime: 10 * 60 * 1000,
  });

  const accounts = accountsData?.accounts || [];

  // Handlers
  const handleRefresh = () => {
    refetchStats();
    refetchTree();
    toast({ title: 'Refreshed', description: 'Template data has been refreshed' });
  };

  const handleApply = async () => {
    if (!companyUcid.trim()) {
      toast({ title: 'Error', description: 'Please enter a company UCID', variant: 'destructive' });
      return;
    }
    try {
      const result = await api.post<{ created: number }>(
        `/masterchart/template/apply/${companyUcid}`,
        {},
        { params: { create_version: 'true' } }
      );
      toast({
        title: 'Template Applied',
        description: `Created ${result.created} accounts for ${companyUcid}`,
      });
      setShowApplyDialog(false);
      setCompanyUcid('');
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleExplainAccount = async () => {
    if (!selectedAccount) return;
    setIsExplaining(true);
    setExplanation(null);
    try {
      const data = await explainAccount(selectedAccount.code);
      setExplanation(data);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsExplaining(false);
    }
  };

  const toggleNode = (code: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(code)) {
        next.delete(code);
      } else {
        next.add(code);
      }
      return next;
    });
  };

  const expandAll = () => {
    const allCodes = new Set<string>();
    const collectCodes = (nodes: any[]) => {
      nodes.forEach((node) => {
        if (node.children?.length) {
          allCodes.add(node.code);
          collectCodes(node.children);
        }
      });
    };
    if (treeData) collectCodes(treeData);
    setExpandedNodes(allCodes);
  };

  const collapseAll = () => {
    setExpandedNodes(new Set());
  };

  const resetFilters = () => {
    setSearch('');
    setCategory('');
    setType('');
    setTag('');
  };

  const hasFilters = search || category || type || tag;

  return (
    <div className="space-y-6">
      {/* Template Banner */}
      <TemplateBanner
        onRefresh={handleRefresh}
        onApply={() => setShowApplyDialog(true)}
        isLoading={isLoadingStats}
      />

      {/* Summary Cards */}
      <SummaryCards stats={stats || null} isLoading={isLoadingStats} />

      {/* Search & Filters */}
      <div className="flex flex-wrap items-center gap-3 p-4 bg-muted/30 rounded-lg border">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search template accounts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={category || "ALL"} onValueChange={(v) => setCategory(v === "ALL" ? "" : v)}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={type || "ALL"} onValueChange={(v) => setType(v === "ALL" ? "" : v)}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Types</SelectItem>
            <SelectItem value="H">Header</SelectItem>
            <SelectItem value="D">Detail</SelectItem>
          </SelectContent>
        </Select>

        <Select value={tag || "ALL"} onValueChange={(v) => setTag(v === "ALL" ? "" : v)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Tag" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Tags</SelectItem>
            {tags.slice(0, 30).map((t) => (
              <SelectItem key={t} value={t}>{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={resetFilters}>
            <X className="h-4 w-4 mr-1" />
            Reset
          </Button>
        )}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)}>
                  <TabsList>
                    <TabsTrigger value="tree">
                      <TreePine className="h-4 w-4 mr-1" /> Tree
                    </TabsTrigger>
                    <TabsTrigger value="cards">
                      <LayoutGrid className="h-4 w-4 mr-1" /> Cards
                    </TabsTrigger>
                    <TabsTrigger value="table">
                      <TableIcon className="h-4 w-4 mr-1" /> Table
                    </TabsTrigger>
                  </TabsList>
                </Tabs>

                {viewMode === 'tree' && (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={expandAll}>
                      <ChevronDown className="h-4 w-4 mr-1" /> Expand
                    </Button>
                    <Button variant="outline" size="sm" onClick={collapseAll}>
                      <ChevronUp className="h-4 w-4 mr-1" /> Collapse
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingTree || isLoadingAccounts ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : viewMode === 'tree' ? (
                <ScrollArea className="h-[500px]">
                  {treeData && treeData.length > 0 ? (
                    treeData.map((node: any) => (
                      <TreeNode
                        key={node.code}
                        node={node}
                        level={0}
                        expandedNodes={expandedNodes}
                        toggleNode={toggleNode}
                        onSelect={setSelectedAccount}
                        selectedCode={selectedAccount?.code || null}
                      />
                    ))
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      No template accounts found
                    </div>
                  )}
                </ScrollArea>
              ) : viewMode === 'cards' ? (
                <ScrollArea className="h-[500px]">
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 p-1">
                    {accounts.map((account) => {
                      const isHeader = account.type === 'H' || account.type === 'Header';
                      return (
                        <Card
                          key={account.code}
                          className={cn(
                            "cursor-pointer transition-all hover:shadow-md",
                            selectedAccount?.code === account.code && "ring-2 ring-primary",
                            isHeader && "border-l-4 border-l-amber-500"
                          )}
                          onClick={() => setSelectedAccount(account)}
                        >
                          <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-sm font-mono">{account.code}</CardTitle>
                              <Badge variant={isHeader ? "default" : "secondary"} className="text-xs">
                                {isHeader ? 'Header' : 'Detail'}
                              </Badge>
                            </div>
                            <CardDescription className="line-clamp-2">
                              {account.description}
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="pb-2 text-xs">
                            <span className="text-muted-foreground">Category: </span>
                            {account.category}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </ScrollArea>
              ) : (
                <ScrollArea className="h-[500px]">
                  <table className="w-full">
                    <thead className="sticky top-0 bg-background">
                      <tr className="border-b">
                        <th className="text-left p-2 font-medium">Code</th>
                        <th className="text-left p-2 font-medium">Description</th>
                        <th className="text-left p-2 font-medium">Type</th>
                        <th className="text-left p-2 font-medium">Category</th>
                        <th className="text-left p-2 font-medium">Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {accounts.map((acc) => (
                        <tr
                          key={acc.code}
                          className={cn(
                            "border-b cursor-pointer hover:bg-muted/50",
                            selectedAccount?.code === acc.code && "bg-primary/10"
                          )}
                          onClick={() => setSelectedAccount(acc)}
                        >
                          <td className="p-2 font-mono text-sm">{acc.code}</td>
                          <td className="p-2 text-sm truncate max-w-[200px]">{acc.description}</td>
                          <td className="p-2">
                            <Badge variant="outline" className="text-xs">
                              {acc.type === 'H' ? 'Header' : 'Detail'}
                            </Badge>
                          </td>
                          <td className="p-2 text-sm">{acc.category}</td>
                          <td className="p-2 text-sm">{acc.normal_balance || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Detail Panel */}
        <div className="lg:col-span-1">
          <AccountDetailPanel
            account={selectedAccount}
            onExplain={handleExplainAccount}
            isExplaining={isExplaining}
            explanation={explanation}
          />
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
              Clone the master template accounts to a company's chart of accounts.
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
            <Button onClick={handleApply} disabled={!companyUcid.trim()}>
              Apply Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TemplateView;
