// frontend/src/pages/snapshots/SnapshotsPage.tsx
import React from 'react';
import { useGetSnapshots, useCreateSnapshot, useRestoreSnapshot } from '@/hooks/api/useSnapshots';
import SnapshotTimeline from '@/components/snapshots/SnapshotTimeline';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus } from 'lucide-react';

const SnapshotsPage = () => {
  const { data: snapshots, isLoading, refetch } = useGetSnapshots();
  const createMutation = useCreateSnapshot();
  const restoreMutation = useRestoreSnapshot();
  const { toast } = useToast();
  
  const [name, setName] = React.useState('');
  const [description, setDescription] = React.useState('');

  const handleCreate = () => {
    if (!name.trim()) {
        toast({ title: 'Error', description: 'Snapshot name is required.', variant: 'destructive' });
        return;
    }
    createMutation.mutate({ name, description }, {
      onSuccess: () => {
        toast({ title: 'Snapshot Created', description: 'The current state has been saved.' });
        setName('');
        setDescription('');
        refetch();
      },
      onError: (err) => {
        toast({ title: 'Error', description: `Failed to create snapshot: ${err.message}`, variant: 'destructive' });
      }
    });
  };

  const handleRestore = (snapshotId: string) => {
    restoreMutation.mutate(snapshotId, {
        onSuccess: () => {
            toast({ title: 'Snapshot Restored', description: 'The master chart has been restored to the selected version.' });
        },
        onError: (err) => {
            toast({ title: 'Error', description: `Failed to restore snapshot: ${err.message}`, variant: 'destructive' });
        }
    });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Snapshots</h1>
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
            <Card>
                <CardHeader>
                    <CardTitle>Create New Snapshot</CardTitle>
                    <CardDescription>Save the current state of the Master Chart of Accounts.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Input placeholder="Snapshot Name (e.g., 'End of Q1')" value={name} onChange={e => setName(e.target.value)} />
                    <Textarea placeholder="Optional description..." value={description} onChange={e => setDescription(e.target.value)} />
                </CardContent>
                <CardFooter>
                    <Button onClick={handleCreate} disabled={createMutation.isPending}>
                        <Plus className="h-4 w-4 mr-2" />
                        {createMutation.isPending ? 'Saving...' : 'Save Snapshot'}
                    </Button>
                </CardFooter>
            </Card>
        </div>
        <div className="md:col-span-2">
            <SnapshotTimeline snapshots={snapshots || []} onRestore={handleRestore} isLoading={isLoading || restoreMutation.isPending} />
        </div>
      </div>
    </div>
  );
};

export default SnapshotsPage;