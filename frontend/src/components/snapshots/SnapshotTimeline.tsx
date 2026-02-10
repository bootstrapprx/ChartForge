// frontend/src/components/snapshots/SnapshotTimeline.tsx
import React from 'react';
import { Snapshot } from '@/types/snapshots';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GitCommit, History } from 'lucide-react';
import { format } from 'date-fns';

interface SnapshotTimelineProps {
  snapshots: Snapshot[];
  onRestore: (snapshotId: string) => void;
  isLoading: boolean;
}

const SnapshotTimeline: React.FC<SnapshotTimelineProps> = ({ snapshots, onRestore, isLoading }) => {
  if (isLoading) {
    return <div className="h-64 bg-muted rounded-lg animate-pulse"></div>;
  }

  if (!snapshots || snapshots.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-12">
        <History className="mx-auto h-12 w-12" />
        <h3 className="mt-2 text-sm font-medium">No snapshots found</h3>
        <p className="mt-1 text-sm">Create a snapshot to save the current state of your chart.</p>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Version History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative pl-6">
          {/* Timeline line */}
          <div className="absolute left-[35px] top-0 h-full w-0.5 bg-border -translate-x-1/2"></div>
          
          <div className="space-y-8">
            {snapshots.map((snapshot) => (
              <div key={snapshot.id} className="relative flex items-start">
                <div className="absolute left-[35px] top-2 h-4 w-4 bg-primary rounded-full -translate-x-1/2 flex items-center justify-center">
                    <GitCommit className="h-3 w-3 text-primary-foreground" />
                </div>
                <div className="ml-12">
                  <div className="flex items-center justify-between w-full">
                    <p className="font-semibold">{snapshot.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(snapshot.created_at), 'MMM d, yyyy HH:mm')}
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground">{snapshot.description || 'No description.'}</p>
                  <p className="text-xs text-muted-foreground mt-1">Version {snapshot.version} • {snapshot.account_count} accounts</p>
                  <Button size="sm" variant="outline" className="mt-2" onClick={() => onRestore(snapshot.id)}>
                    Restore
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SnapshotTimeline;
