// frontend/src/components/merge/MergePreview.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface MergePreviewProps {
  previewData: any;
  isLoading: boolean;
}

const MergePreview: React.FC<MergePreviewProps> = ({ previewData, isLoading }) => {
  if (isLoading) {
    return <p>Loading Merge Preview...</p>;
  }

  if (!previewData) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Merge Preview</CardTitle>
      </CardHeader>
      <CardContent>
        <pre>{JSON.stringify(previewData, null, 2)}</pre>
      </CardContent>
    </Card>
  );
};

export default MergePreview;