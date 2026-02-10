// frontend/src/pages/masterchart/MasterChartDashboard.tsx
// Complete Master Chart Dashboard with Tree View, Card View, Search, and Dexter Integration

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { MasterAccount, MasterAccountNode, TemplateAccount, TemplateStats } from '@/types/masterchart';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
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
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import {
  Search,
  TreePine,
  LayoutGrid,
  Table as TableIcon,
  ChevronRight,
  ChevronDown,
  Folder,
  FileText,
  Plus,
  Download,
  Upload,
  AlertTriangle,
  Brain,
  RefreshCw,
  Copy,
  Loader2,
  BarChart3,
  Users,
  Layers,
  AlertCircle,
  Hash,
  X,
  Filter,
  ChevronUp,
  Eye,
  Edit,
  Info,
  Sparkles,
  Building2,
  BookOpen,
  Scale,
  MessageSquare,
  PieChart,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import CreateAccountModal from '@/components/masterchart/CreateAccountModal';
import TemplateView from './TemplateView';

import { api } from '@/lib/api';

// ============================================================================
// API Functions
// ============================================================================

const fetchMasterChartStats = async () => {
  return api.get('/masterchart/stats');
};

const fetchMasterChartTree = async () => {
  return api.get('/masterchart/tree');
};

const fetchMasterChartList = async (params: {
  search?: string;
  category?: string;
  type?: string;
}) => {
  return api.get('/masterchart', { params });
};

const fetchTemplateStats = async (): Promise<TemplateStats> => {
  // Use the new standardized endpoint
  return api.get('/masterchart/stats');
};

const fetchTemplateTree = async () => {
  return api.get('/masterchart/tree');
};

const fetchTemplateAccounts = async (params: {
  search?: string;
  category?: string;
  type?: string;
  tag?: string;
}) => {
  return api.get('/masterchart/template/default', {
    params: { ...params, limit: 1000 }
  });
};

const fetchCategories = async () => {
  return api.get('/masterchart/categories');
};

const fetchTags = async () => {
  return api.get('/masterchart/tags');
};

const explainAccount = async (code: string) => {
  return api.get(`/ai/explain-account/${code}`);
};

const fetchInsights = async () => {
  return api.get('/ai/insights', { params: { insight_type: 'all' } });
};

const generateReport = async (reportType: string) => {
  return api.post(`/ai/report/${reportType}`, {});
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
  dbStats: any;
  isLoading: boolean;
  isTemplateMode: boolean;
}

const SummaryCards: React.FC<SummaryCardsProps> = ({ stats, dbStats, isLoading, isTemplateMode }) => {
  const displayStats = isTemplateMode ? stats : dbStats;

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
      value: displayStats?.total_accounts || 0,
      icon: Layers,
      color: 'text-blue-600',
      bg: 'bg-blue-50 dark:bg-blue-950/30',
    },
    {
      title: 'Header Accounts',
      value: displayStats?.header_count || 0,
      icon: Folder,
      color: 'text-purple-600',
      bg: 'bg-purple-50 dark:bg-purple-950/30',
    },
    {
      title: 'Detail Accounts',
      value: displayStats?.detail_count || 0,
      icon: FileText,
      color: 'text-green-600',
      bg: 'bg-green-50 dark:bg-green-950/30',
    },
    {
      title: 'Orphan Accounts',
      value: dbStats?.orphans || 0,
      icon: AlertTriangle,
      color: dbStats?.orphans > 0 ? 'text-red-600' : 'text-emerald-600',
      bg: dbStats?.orphans > 0 ? 'bg-red-50 dark:bg-red-950/30' : 'bg-emerald-50 dark:bg-emerald-950/30',
    },
    {
      title: 'Categories',
      value: isTemplateMode
        ? Object.keys(stats?.categories || {}).length
        : 7,
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
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
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
// Search & Filter Bar Component
// ============================================================================

interface SearchFilterBarProps {
  search: string;
  setSearch: (v: string) => void;
  category: string;
  setCategory: (v: string) => void;
  type: string;
  setType: (v: string) => void;
  tag: string;
  setTag: (v: string) => void;
  normalBalance: string;
  setNormalBalance: (v: string) => void;
  categories: string[];
  tags: string[];
  onReset: () => void;
}

const SearchFilterBar: React.FC<SearchFilterBarProps> = ({
  search, setSearch,
  category, setCategory,
  type, setType,
  tag, setTag,
  normalBalance, setNormalBalance,
  categories, tags,
  onReset,
}) => {
  const hasFilters = search || category || type || tag || normalBalance;

  return (
    <div className="flex flex-wrap items-center gap-3 p-4 bg-muted/30 rounded-lg border">
      <div className="relative flex-1 min-w-[200px] max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search accounts (fuzzy match)..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
        {search && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
            onClick={() => setSearch('')}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
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

      <Select value={normalBalance || "ALL"} onValueChange={(v) => setNormalBalance(v === "ALL" ? "" : v)}>
        <SelectTrigger className="w-[130px]">
          <SelectValue placeholder="Balance" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All Balances</SelectItem>
          <SelectItem value="Debit">Debit</SelectItem>
          <SelectItem value="Credit">Credit</SelectItem>
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
        <Button variant="ghost" size="sm" onClick={onReset}>
          <X className="h-4 w-4 mr-1" />
          Reset
        </Button>
      )}
    </div>
  );
};

// ============================================================================
// Quick Actions Bar Component
// ============================================================================

interface QuickActionsBarProps {
  onAddRoot: () => void;
  onAddHeader: () => void;
  onAddChild: () => void;
  onExport: () => void;
  onImport: () => void;
  onHighlightIssues: () => void;
  onDexterInsights: () => void;
}

const QuickActionsBar: React.FC<QuickActionsBarProps> = ({
  onAddRoot, onAddHeader, onAddChild,
  onExport, onImport, onHighlightIssues, onDexterInsights,
}) => (
  <div className="flex flex-wrap items-center gap-2">
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Add Account
          <ChevronDown className="h-4 w-4 ml-1" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={onAddRoot}>
          <Layers className="h-4 w-4 mr-2" />
          Add Root Account
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onAddHeader}>
          <Folder className="h-4 w-4 mr-2" />
          Add Header Account
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onAddChild}>
          <FileText className="h-4 w-4 mr-2" />
          Add Child Account
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>

    <Separator orientation="vertical" className="h-6" />

    <Button variant="outline" size="sm" onClick={onExport}>
      <Download className="h-4 w-4 mr-1" />
      Export CSV
    </Button>
    <Button variant="outline" size="sm" onClick={onImport}>
      <Upload className="h-4 w-4 mr-1" />
      Import Preview
    </Button>

    <Separator orientation="vertical" className="h-6" />

    <Button variant="outline" size="sm" onClick={onHighlightIssues}>
      <AlertTriangle className="h-4 w-4 mr-1" />
      Issues
    </Button>
    <Button variant="default" size="sm" onClick={onDexterInsights}>
      <Brain className="h-4 w-4 mr-1" />
      Dexter Insights
    </Button>
  </div>
);

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
  filterType: string;
}

const TreeNode: React.FC<TreeNodeProps> = ({
  node, level, expandedNodes, toggleNode, onSelect, selectedCode, filterType,
}) => {
  const hasChildren = node.children && node.children.length > 0;
  const isExpanded = expandedNodes.has(node.code);
  const isSelected = selectedCode === node.code;
  const isHeader = node.type === 'H' || node.type === 'Header';

  // Filter logic
  if (filterType === 'H' && !isHeader) return null;
  if (filterType === 'D' && isHeader) return null;

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
              filterType={filterType}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// Tree View Component
// ============================================================================

interface TreeViewProps {
  treeData: any[];
  isLoading: boolean;
  selectedCode: string | null;
  onSelect: (node: any) => void;
  filterType: string;
}

const TreeView: React.FC<TreeViewProps> = ({
  treeData, isLoading, selectedCode, onSelect, filterType,
}) => {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

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
    collectCodes(treeData);
    setExpandedNodes(allCodes);
  };

  const collapseAll = () => {
    setExpandedNodes(new Set());
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 pb-2 border-b">
        <Button variant="outline" size="sm" onClick={expandAll}>
          <ChevronDown className="h-4 w-4 mr-1" />
          Expand All
        </Button>
        <Button variant="outline" size="sm" onClick={collapseAll}>
          <ChevronUp className="h-4 w-4 mr-1" />
          Collapse All
        </Button>
      </div>

      <ScrollArea className="h-[500px]">
        {treeData.length > 0 ? (
          treeData.map((node) => (
            <TreeNode
              key={node.code}
              node={node}
              level={0}
              expandedNodes={expandedNodes}
              toggleNode={toggleNode}
              onSelect={onSelect}
              selectedCode={selectedCode}
              filterType={filterType}
            />
          ))
        ) : (
          <div className="text-center text-muted-foreground py-8">
            No accounts found
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

// ============================================================================
// Card View Component
// ============================================================================

interface CardViewProps {
  accounts: any[];
  isLoading: boolean;
  selectedCode: string | null;
  onSelect: (node: any) => void;
  onEdit: (node: any) => void;
  onInfo: (node: any) => void;
}

const CardView: React.FC<CardViewProps> = ({
  accounts, isLoading, selectedCode, onSelect, onEdit, onInfo,
}) => {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="pt-6 space-y-3">
              <div className="h-5 bg-muted rounded w-20" />
              <div className="h-4 bg-muted rounded w-full" />
              <div className="h-4 bg-muted rounded w-3/4" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <ScrollArea className="h-[500px]">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 p-1">
        {accounts.map((account) => {
          const isHeader = account.type === 'H' || account.type === 'Header';
          const isSelected = selectedCode === account.code;

          return (
            <Card
              key={account.code}
              className={cn(
                "cursor-pointer transition-all hover:shadow-md",
                isSelected && "ring-2 ring-primary",
                isHeader && "border-l-4 border-l-amber-500"
              )}
              onClick={() => onSelect(account)}
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
              <CardContent className="pb-2">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">Category</span>
                    <p className="font-medium">{account.category}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Balance</span>
                    <p className="font-medium">{account.normal_balance || 'N/A'}</p>
                  </div>
                </div>
                {account.parent_code && (
                  <div className="mt-2 text-xs">
                    <span className="text-muted-foreground">Parent: </span>
                    <span className="font-mono">{account.parent_code}</span>
                  </div>
                )}
              </CardContent>
              <CardFooter className="pt-2 border-t flex gap-2">
                <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onEdit(account); }}>
                  <Edit className="h-3 w-3 mr-1" /> Edit
                </Button>
                <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onInfo(account); }}>
                  <Info className="h-3 w-3 mr-1" /> Info
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </ScrollArea>
  );
};

// ============================================================================
// Account Detail Panel Component
// ============================================================================

interface AccountDetailPanelProps {
  account: any | null;
  onExplain: () => void;
  onSimilar: () => void;
  onSuggest: () => void;
  onGaap: () => void;
  isExplaining: boolean;
  explanation: any | null;
}

const AccountDetailPanel: React.FC<AccountDetailPanelProps> = ({
  account, onExplain, onSimilar, onSuggest, onGaap, isExplaining, explanation,
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

      <ScrollArea className="h-[calc(100%-200px)]">
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
              {explanation.when_to_use && explanation.when_to_use.length > 0 && (
                <div className="mt-2">
                  <span className="text-xs text-muted-foreground">When to use:</span>
                  <ul className="list-disc list-inside text-xs mt-1">
                    {explanation.when_to_use.slice(0, 3).map((item: string, i: number) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </ScrollArea>

      {/* Dexter Actions */}
      <CardFooter className="border-t p-3 bg-muted/30">
        <div className="w-full space-y-2">
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Brain className="h-3 w-3" /> Dexter Actions
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" onClick={onExplain} disabled={isExplaining}>
              {isExplaining ? (
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              ) : (
                <MessageSquare className="h-3 w-3 mr-1" />
              )}
              Explain
            </Button>
            <Button variant="outline" size="sm" onClick={onSimilar}>
              <Users className="h-3 w-3 mr-1" /> Similar
            </Button>
            <Button variant="outline" size="sm" onClick={onSuggest}>
              <Sparkles className="h-3 w-3 mr-1" /> Suggest
            </Button>
            <Button variant="outline" size="sm" onClick={onGaap}>
              <Scale className="h-3 w-3 mr-1" /> GAAP Ref
            </Button>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
};

// ============================================================================
// Main Dashboard Component
// ============================================================================

const MasterChartDashboard: React.FC = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // State
  const [viewMode, setViewMode] = useState<'tree' | 'cards' | 'table'>('tree');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [type, setType] = useState('');
  const [tag, setTag] = useState('');
  const [normalBalance, setNormalBalance] = useState('');
  const [selectedAccount, setSelectedAccount] = useState<any | null>(null);
  const [isTemplateMode, setIsTemplateMode] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createParentCode, setCreateParentCode] = useState<string | null>(null);
  const [showApplyDialog, setShowApplyDialog] = useState(false);
  const [companyUcid, setCompanyUcid] = useState('');
  const [showInsightsDialog, setShowInsightsDialog] = useState(false);
  const [explanation, setExplanation] = useState<any | null>(null);

  // Check if user is superuser
  const isSuperuser = user?.is_superuser || user?.role === 'accountant';

  // Queries
  const { data: templateStats, isLoading: isLoadingTemplateStats, refetch: refetchTemplateStats } = useQuery({
    queryKey: ['template-stats'],
    queryFn: fetchTemplateStats,
    enabled: isTemplateMode,
  });

  const { data: dbStats, isLoading: isLoadingDbStats } = useQuery({
    queryKey: ['masterchart-stats'],
    queryFn: fetchMasterChartStats,
    enabled: !isTemplateMode,
  });

  const { data: templateTree, isLoading: isLoadingTemplateTree, refetch: refetchTemplateTree } = useQuery({
    queryKey: ['template-tree'],
    queryFn: fetchTemplateTree,
    enabled: isTemplateMode && viewMode === 'tree',
  });

  const { data: dbTree, isLoading: isLoadingDbTree } = useQuery({
    queryKey: ['masterchart-tree'],
    queryFn: fetchMasterChartTree,
    enabled: !isTemplateMode && viewMode === 'tree',
  });

  const { data: templateAccounts, isLoading: isLoadingTemplateAccounts } = useQuery({
    queryKey: ['template-accounts', search, category, type, tag],
    queryFn: () => fetchTemplateAccounts({ search, category, type, tag }),
    enabled: isTemplateMode && viewMode !== 'tree',
  });

  const { data: dbAccounts, isLoading: isLoadingDbAccounts } = useQuery({
    queryKey: ['masterchart-accounts', search, category, type],
    queryFn: () => fetchMasterChartList({ search, category, type }),
    enabled: !isTemplateMode && viewMode === 'cards',
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['template-categories'],
    queryFn: fetchCategories,
  });

  const { data: tags = [] } = useQuery({
    queryKey: ['template-tags'],
    queryFn: fetchTags,
  });

  const { data: insights, isLoading: isLoadingInsights } = useQuery({
    queryKey: ['insights'],
    queryFn: fetchInsights,
    enabled: showInsightsDialog,
  });

  // Mutations
  const explainMutation = useMutation({
    mutationFn: explainAccount,
    onSuccess: (data) => {
      setExplanation(data);
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const reportMutation = useMutation({
    mutationFn: generateReport,
    onSuccess: (data) => {
      toast({
        title: data.title,
        description: data.summary,
      });
    },
  });

  // Computed values
  const treeData = isTemplateMode ? (templateTree || []) : (dbTree || []);
  const accountsList = isTemplateMode
    ? (templateAccounts?.accounts || [])
    : (dbAccounts || []);
  const isLoadingTree = isTemplateMode ? isLoadingTemplateTree : isLoadingDbTree;
  const isLoadingAccounts = isTemplateMode ? isLoadingTemplateAccounts : isLoadingDbAccounts;

  // Filter accounts for card/table view
  const filteredAccounts = useMemo(() => {
    let result = accountsList;
    if (normalBalance) {
      result = result.filter((acc: any) => acc.normal_balance === normalBalance);
    }
    return result;
  }, [accountsList, normalBalance]);

  // Handlers
  const handleRefresh = () => {
    refetchTemplateStats();
    refetchTemplateTree();
    queryClient.invalidateQueries({ queryKey: ['template-accounts'] });
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

  const handleResetFilters = () => {
    setSearch('');
    setCategory('');
    setType('');
    setTag('');
    setNormalBalance('');
  };

  const handleAddAccount = (parentCode: string | null = null) => {
    setCreateParentCode(parentCode);
    setShowCreateModal(true);
  };

  const handleExport = () => {
    // For download links, we still need the full URL, but we use buildUrl from api
    window.location.href = api.buildUrl('/masterchart/export');
  };

  const handleImport = () => {
    window.location.href = '/import';
  };

  const handleExplainAccount = () => {
    if (selectedAccount) {
      setExplanation(null);
      explainMutation.mutate(selectedAccount.code);
    }
  };

  const handleSimilarAccounts = async () => {
    if (selectedAccount) {
      try {
        const data = await api.get<any[]>(
          `/masterchart/template/similar/${selectedAccount.code}`,
          { params: { limit: 5 } }
        );
        toast({
          title: 'Similar Accounts',
          description: data.map((a: any) => `${a.code}: ${a.description}`).join('\n'),
        });
      } catch (error) {
        toast({ title: 'Error', description: 'Failed to find similar accounts', variant: 'destructive' });
      }
    }
  };

  const handleSuggestImprovements = () => {
    toast({ title: 'Dexter', description: 'Analyzing account for improvements...' });
  };

  const handleGaapReference = () => {
    if (selectedAccount?.regulatory_mapping) {
      toast({
        title: 'GAAP/IFRS Reference',
        description: selectedAccount.regulatory_mapping,
      });
    } else {
      toast({ title: 'No Reference', description: 'No regulatory mapping available for this account' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Master Chart Dashboard</h1>
          <p className="text-muted-foreground">
            {isTemplateMode ? 'Viewing the Default US-GAAP Template' : 'Viewing Database Accounts'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={isTemplateMode ? "default" : "outline"}
            size="sm"
            onClick={() => setIsTemplateMode(true)}
          >
            Template
          </Button>
          <Button
            variant={!isTemplateMode ? "default" : "outline"}
            size="sm"
            onClick={() => setIsTemplateMode(false)}
          >
            Database
          </Button>
        </div>
      </div>

      {/* Template View or Database View */}
      {isTemplateMode ? (
        <TemplateView />
      ) : (
        <>
          <SummaryCards
            stats={null}
            dbStats={dbStats}
            isLoading={isLoadingDbStats}
            isTemplateMode={false}
          />

          {/* Quick Actions */}
          <QuickActionsBar
            onAddRoot={() => handleAddAccount(null)}
            onAddHeader={() => handleAddAccount(null)}
            onAddChild={() => selectedAccount && handleAddAccount(selectedAccount.code)}
            onExport={handleExport}
            onImport={handleImport}
            onHighlightIssues={() => setShowInsightsDialog(true)}
            onDexterInsights={() => setShowInsightsDialog(true)}
          />

          {/* Search & Filters */}
          <SearchFilterBar
            search={search}
            setSearch={setSearch}
            category={category}
            setCategory={setCategory}
            type={type}
            setType={setType}
            tag={tag}
            setTag={setTag}
            normalBalance={normalBalance}
            setNormalBalance={setNormalBalance}
            categories={categories}
            tags={tags}
            onReset={handleResetFilters}
          />

          {/* Main Content Area */}
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
                      <Select value={type || "ALL"} onValueChange={(v) => setType(v === "ALL" ? "" : v)}>
                        <SelectTrigger className="w-[150px]">
                          <SelectValue placeholder="Show All" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ALL">Show All</SelectItem>
                          <SelectItem value="H">Headers Only</SelectItem>
                          <SelectItem value="D">Details Only</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {viewMode === 'tree' && (
                    <TreeView
                      treeData={dbTree || []}
                      isLoading={isLoadingDbTree}
                      selectedCode={selectedAccount?.code || null}
                      onSelect={setSelectedAccount}
                      filterType={type}
                    />
                  )}
                  {viewMode === 'cards' && (
                    <CardView
                      accounts={filteredAccounts}
                      isLoading={isLoadingDbAccounts}
                      selectedCode={selectedAccount?.code || null}
                      onSelect={setSelectedAccount}
                      onEdit={(acc) => { setSelectedAccount(acc); setShowCreateModal(true); }}
                      onInfo={setSelectedAccount}
                    />
                  )}
                  {viewMode === 'table' && (
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
                          {filteredAccounts.map((acc: any) => (
                            <tr
                              key={acc.code}
                              className={cn(
                                "border-b cursor-pointer hover:bg-muted/50",
                                selectedAccount?.code === acc.code && "bg-primary/10"
                              )}
                              onClick={() => setSelectedAccount(acc)}
                            >
                              <td className="p-2 font-mono text-sm">{acc.code}</td>
                              <td className="p-2 text-sm">{acc.description}</td>
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
                onSimilar={handleSimilarAccounts}
                onSuggest={handleSuggestImprovements}
                onGaap={handleGaapReference}
                isExplaining={explainMutation.isPending}
                explanation={explanation}
              />
            </div>
          </div>
        </>
      )}

      {/* Create Account Modal */}
      <CreateAccountModal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setCreateParentCode(null);
        }}
        onSubmit={async (data) => {
          await api.post('/masterchart', data);
          queryClient.invalidateQueries({ queryKey: ['masterchart'] });
          toast({ title: 'Success', description: 'Account created successfully' });
        }}
        parentCode={createParentCode}
      />

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

      {/* Insights Dialog */}
      <Dialog open={showInsightsDialog} onOpenChange={setShowInsightsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Dexter Insights
            </DialogTitle>
            <DialogDescription>
              AI-generated analysis of your Chart of Accounts
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            {isLoadingInsights ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : insights ? (
              <>
                <div className="grid grid-cols-4 gap-4">
                  <Card className="p-3 text-center">
                    <p className="text-2xl font-bold">{insights.total_insights}</p>
                    <p className="text-xs text-muted-foreground">Total Issues</p>
                  </Card>
                  <Card className="p-3 text-center bg-red-50 dark:bg-red-950/30">
                    <p className="text-2xl font-bold text-red-600">{insights.by_severity?.high || 0}</p>
                    <p className="text-xs text-muted-foreground">High</p>
                  </Card>
                  <Card className="p-3 text-center bg-yellow-50 dark:bg-yellow-950/30">
                    <p className="text-2xl font-bold text-yellow-600">{insights.by_severity?.medium || 0}</p>
                    <p className="text-xs text-muted-foreground">Medium</p>
                  </Card>
                  <Card className="p-3 text-center bg-blue-50 dark:bg-blue-950/30">
                    <p className="text-2xl font-bold text-blue-600">{insights.by_severity?.low || 0}</p>
                    <p className="text-xs text-muted-foreground">Low</p>
                  </Card>
                </div>
                <ScrollArea className="h-[300px]">
                  <div className="space-y-3">
                    {insights.insights?.map((insight: any, i: number) => (
                      <Alert
                        key={i}
                        variant={insight.severity === 'high' ? 'destructive' : 'default'}
                      >
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>{insight.title}</AlertTitle>
                        <AlertDescription>
                          {insight.description}
                          {insight.affected_items?.length > 0 && (
                            <span className="block text-xs mt-1 font-mono">
                              Affected: {insight.affected_items.slice(0, 5).join(', ')}
                              {insight.affected_items.length > 5 && ` (+${insight.affected_items.length - 5} more)`}
                            </span>
                          )}
                        </AlertDescription>
                      </Alert>
                    ))}
                  </div>
                </ScrollArea>
              </>
            ) : (
              <p className="text-center text-muted-foreground">No insights available</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => reportMutation.mutate('category_summary')}>
              <PieChart className="h-4 w-4 mr-1" />
              Category Report
            </Button>
            <Button variant="outline" onClick={() => reportMutation.mutate('hierarchy_analysis')}>
              <BarChart3 className="h-4 w-4 mr-1" />
              Hierarchy Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MasterChartDashboard;

