import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/integrations/api';
import { MasterAccountNode, MasterAccount } from '@/types/masterchart';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Filter, X, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import InteractiveMasterChartTree from '@/components/masterchart/InteractiveMasterChartTree';
import MasterAccountFormDialog from '@/components/masterchart/MasterAccountFormDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const MasterChartInteractivePage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [editingAccount, setEditingAccount] = useState<MasterAccountNode | null>(null);
  const [creatingAccount, setCreatingAccount] = useState(false);
  const [parentForNew, setParentForNew] = useState<{ id: string | null; code: string | null }>({
    id: null,
    code: null,
  });
  const [deletingAccount, setDeletingAccount] = useState<MasterAccountNode | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch tree data
  const { data: treeData, isLoading, isError } = useQuery<MasterAccountNode[]>({
    queryKey: ['masterchart', 'tree'],
    queryFn: async () => {
      const response = await api.get('/masterchart/tree');
      return response.data;
    },
  });

  // Fetch categories
  const { data: categories } = useQuery<string[]>({
    queryKey: ['masterchart', 'categories'],
    queryFn: async () => {
      const response = await api.get('/masterchart/categories');
      return response.data;
    },
  });

  // Fetch flat list for filtering
  const { data: flatAccounts } = useQuery<MasterAccount[]>({
    queryKey: ['masterchart', 'list', searchTerm, categoryFilter, typeFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (categoryFilter !== 'all') params.append('category', categoryFilter);
      if (typeFilter !== 'all') params.append('account_type', typeFilter);
      
      const response = await api.get(`/masterchart?${params.toString()}`);
      return response.data;
    },
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post('/masterchart', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['masterchart'] });
      toast({
        title: 'Success',
        description: 'Account created successfully',
      });
      setCreatingAccount(false);
      setParentForNew({ id: null, code: null });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to create account',
        variant: 'destructive',
      });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ code, data }: { code: string; data: any }) => {
      const response = await api.put(`/masterchart/${code}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['masterchart'] });
      toast({
        title: 'Success',
        description: 'Account updated successfully',
      });
      setEditingAccount(null);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to update account',
        variant: 'destructive',
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (code: string) => {
      await api.delete(`/masterchart/${code}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['masterchart'] });
      toast({
        title: 'Success',
        description: 'Account deleted successfully',
      });
      setDeletingAccount(null);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to delete account',
        variant: 'destructive',
      });
    },
  });

  const handleCreate = async (data: any) => {
    // Clean data: remove empty strings, convert to undefined
    const cleanData = {
      ...data,
      code: data.code || undefined,
      parent_code: data.parent_code || undefined,
      notes: data.notes || undefined,
      start_date: data.start_date || undefined,
      end_date: data.end_date || undefined,
    };
    await createMutation.mutateAsync(cleanData);
  };

  const handleUpdate = async (data: any) => {
    if (editingAccount) {
      // Only include fields that are actually being updated
      const cleanData: any = {};
      if (data.description !== undefined) cleanData.description = data.description;
      if (data.category !== undefined) cleanData.category = data.category;
      if (data.type !== undefined) cleanData.type = data.type;
      if (data.notes !== undefined) cleanData.notes = data.notes || null;
      if (data.start_date !== undefined) cleanData.start_date = data.start_date || null;
      if (data.end_date !== undefined) cleanData.end_date = data.end_date || null;
      
      await updateMutation.mutateAsync({ code: editingAccount.code, data: cleanData });
    }
  };

  const handleDelete = async () => {
    if (deletingAccount) {
      await deleteMutation.mutateAsync(deletingAccount.code);
    }
  };

  const handleAddChild = (parentId: string | null, parentCode: string | null) => {
    setParentForNew({ id: parentId, code: parentCode });
    setCreatingAccount(true);
  };

  const handleEdit = (account: MasterAccountNode) => {
    setEditingAccount(account);
  };

  const handleDeleteClick = (account: MasterAccountNode) => {
    setDeletingAccount(account);
  };

  // Filter tree based on search and filters
  const filteredTree = useMemo(() => {
    if (!treeData) return [];

    const filterNode = (node: MasterAccountNode): MasterAccountNode | null => {
      const matchesSearch =
        !searchTerm ||
        node.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        node.description.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory = categoryFilter === 'all' || node.category === categoryFilter;
      const matchesType = typeFilter === 'all' || node.type === typeFilter;

      const matches = matchesSearch && matchesCategory && matchesType;

      // Filter children recursively
      const filteredChildren = node.children
        ? node.children.map(filterNode).filter((n): n is MasterAccountNode => n !== null)
        : [];

      // Include node if it matches or has matching children
      if (matches || filteredChildren.length > 0) {
        return {
          ...node,
          children: filteredChildren,
        };
      }

      return null;
    };

    return treeData.map(filterNode).filter((n): n is MasterAccountNode => n !== null);
  }, [treeData, searchTerm, categoryFilter, typeFilter]);

  const hasActiveFilters = searchTerm || categoryFilter !== 'all' || typeFilter !== 'all';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Master Chart of Accounts</h1>
          <p className="text-muted-foreground mt-1">
            Interactive tree view with full CRUD operations
          </p>
        </div>
        <Button onClick={() => handleAddChild(null, null)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Root Account
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search & Filter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by code or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
                {searchTerm && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7"
                    onClick={() => setSearchTerm('')}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories?.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="H">Header Only</SelectItem>
                <SelectItem value="D">Detail Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {hasActiveFilters && (
            <div className="flex items-center gap-2 mt-4">
              <Badge variant="secondary" className="gap-1">
                <Filter className="h-3 w-3" />
                Filters Active
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchTerm('');
                  setCategoryFilter('all');
                  setTypeFilter('all');
                }}
              >
                Clear All
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tree View */}
      <Card>
        <CardHeader>
          <CardTitle>Chart of Accounts</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : isError ? (
            <div className="text-center py-12 text-destructive">
              Failed to load master chart
            </div>
          ) : (
            <InteractiveMasterChartTree
              nodes={filteredTree}
              onAddChild={handleAddChild}
              onEdit={handleEdit}
              onDelete={handleDeleteClick}
              searchTerm={searchTerm}
            />
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <MasterAccountFormDialog
        account={null}
        isOpen={creatingAccount}
        onClose={() => {
          setCreatingAccount(false);
          setParentForNew({ id: null, code: null });
        }}
        onSubmit={handleCreate}
        parentCode={parentForNew.code}
        mode="create"
      />

      {/* Edit Dialog */}
      <MasterAccountFormDialog
        account={editingAccount}
        isOpen={!!editingAccount}
        onClose={() => setEditingAccount(null)}
        onSubmit={handleUpdate}
        mode="edit"
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingAccount} onOpenChange={() => setDeletingAccount(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Account</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete account{' '}
              <strong>{deletingAccount?.code}</strong> - {deletingAccount?.description}?
              {deletingAccount?.children && deletingAccount.children.length > 0 && (
                <span className="block mt-2 text-destructive">
                  Warning: This account has {deletingAccount.children.length} child account(s).
                  You cannot delete accounts with children.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default MasterChartInteractivePage;

