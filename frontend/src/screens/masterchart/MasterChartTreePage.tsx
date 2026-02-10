// frontend/src/pages/masterchart/MasterChartTreePage.tsx
import React, { useState, useMemo } from 'react';
import { useManualCRUD } from '@/hooks/useManualCRUD';
import { MasterAccount, MasterAccountNode, MasterAccountCreate } from '@/types/masterchart';
import { QueryKey } from '@/lib/queryKeys';
import { buildTree } from '@/lib/utils';
import MasterChartTree from '@/components/manual/masterchart/MasterChartTree';
import MasterAccountForm from '@/components/manual/masterchart/MasterAccountForm';
import MasterAccountCreationForm from '@/components/manual/masterchart/MasterAccountCreationForm';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const MasterChartTreePage = () => {
  const [editingAccount, setEditingAccount] = useState<MasterAccount | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [parentCodeForNew, setParentCodeForNew] = useState<string | null>(null);

  const {
    data: accounts,
    isLoading,
    isError,
    createItem,
    updateItem,
    deleteItem,
  } = useManualCRUD<MasterAccount>({
    queryKey: QueryKey.MASTER_CHART,
    endpoint: '/masterchart/accounts',
  });

  const tree = useMemo(() => buildTree(accounts), [accounts]);

  const handleAddChild = (parentId: string | null) => {
    setParentCodeForNew(parentId);
    setIsCreating(true);
  };

  const handleCreationFormSubmit = async (account: MasterAccountCreate) => {
    await createItem(account);
    setIsCreating(false);
  };

  const handleUpdate = async (id: string, data: Partial<MasterAccountNode>) => {
    const accountToUpdate = accounts.find(acc => acc.id === id);
    if (accountToUpdate) {
      await updateItem({ ...accountToUpdate, ...data });
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this account and all its children?')) {
      await deleteItem(id);
    }
  };

  const handleEditDetails = (account: MasterAccount) => {
    setEditingAccount(account);
  };

  const handleEditFormSubmit = async (account: MasterAccount) => {
    await updateItem(account);
    setEditingAccount(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Master Chart - Manual Editor</h1>
        <Button onClick={() => handleAddChild(null)}>
          <Plus className="h-4 w-4 mr-2" /> Add Root Account
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Hierarchical View</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && <Skeleton className="h-64" />}
          {isError && <div className="text-destructive">Failed to load chart.</div>}
          {tree && (
            <MasterChartTree
              nodes={tree}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
              onAddChild={handleAddChild}
              onEditDetails={handleEditDetails}
            />
          )}
        </CardContent>
      </Card>

      <MasterAccountForm
        account={editingAccount}
        isOpen={!!editingAccount}
        onClose={() => setEditingAccount(null)}
        onSubmit={handleEditFormSubmit}
      />

      <MasterAccountCreationForm
        isOpen={isCreating}
        onClose={() => setIsCreating(false)}
        onSubmit={handleCreationFormSubmit}
        parentCode={parentCodeForNew}
      />
    </div>
  );
};

export default MasterChartTreePage;