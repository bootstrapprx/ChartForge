// frontend/src/components/manual/masterchart/MasterChartTree.tsx
import React, { useState } from 'react';
import { MasterAccountNode } from '@/types/masterchart';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, Edit } from 'lucide-react';

interface MasterChartTreeProps {
  nodes: MasterAccountNode[];
  onUpdate: (id: string, data: Partial<MasterAccountNode>) => void;
  onDelete: (id: string) => void;
  onAddChild: (parentId: string | null) => void;
  onEditDetails: (account: MasterAccountNode) => void;
}

const AccountNode: React.FC<{
  node: MasterAccountNode;
  level: number;
  onUpdate: (id: string, data: Partial<MasterAccountNode>) => void;
  onDelete: (id: string) => void;
  onAddChild: (parentId: string | null) => void;
  onEditDetails: (account: MasterAccountNode) => void;
}> = ({ node, level, onUpdate, onDelete, onAddChild, onEditDetails }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [description, setDescription] = useState(node.description);

  const handleDescriptionUpdate = () => {
    onUpdate(node.id, { description });
    setIsEditing(false);
  };

  return (
    <div style={{ marginLeft: level * 20 }}>
      <div className="flex items-center gap-2 p-1 hover:bg-muted/50 rounded">
        <span className="font-mono text-xs w-24">{node.code}</span>
        {isEditing ? (
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={handleDescriptionUpdate}
            onKeyDown={(e) => e.key === 'Enter' && handleDescriptionUpdate()}
            autoFocus
            className="h-8"
          />
        ) : (
          <span className="flex-grow" onDoubleClick={() => setIsEditing(true)}>
            {node.description}
          </span>
        )}
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onAddChild(node.id)}><Plus className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEditDetails(node)}><Edit className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onDelete(node.id)}><Trash2 className="h-4 w-4" /></Button>
        </div>
      </div>
      {node.children && node.children.map(child => (
        <AccountNode
          key={child.id}
          node={child}
          level={level + 1}
          onUpdate={onUpdate}
          onDelete={onDelete}
          onAddChild={onAddChild}
          onEditDetails={onEditDetails}
        />
      ))}
    </div>
  );
};

const MasterChartTree: React.FC<MasterChartTreeProps> = ({ nodes, ...rest }) => {
  return (
    <div className="space-y-1">
      {nodes.map(node => (
        <AccountNode key={node.id} node={node} level={0} {...rest} />
      ))}
    </div>
  );
};

export default MasterChartTree;
