// frontend/src/components/merge/MergeConflictResolver.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface MergeConflictResolverProps {
  conflicts: any[];
  resolutions: Record<string, string>;
  onResolve: (id: string, resolution: string) => void;
}

const MergeConflictResolver: React.FC<MergeConflictResolverProps> = ({ conflicts, resolutions, onResolve }) => {
  if (conflicts.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Resolve Conflicts</CardTitle>
      </CardHeader>
      <CardContent>
        <p>Conflict resolution UI coming soon.</p>
      </CardContent>
    </Card>
  );
};

export default MergeConflictResolver;