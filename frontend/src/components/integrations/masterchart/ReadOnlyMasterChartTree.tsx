// frontend/src/components/masterchart/AccountTreeView.tsx
import React, { useState } from 'react';
import { MasterAccountNode } from '@/types/masterchart';
import { ChevronRight, ChevronDown, File, Folder } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface AccountTreeViewProps {
  nodes: MasterAccountNode[];
}

interface AccountTreeItemProps {
  node: MasterAccountNode;
}

const AccountTreeItem: React.FC<AccountTreeItemProps> = ({ node }) => {
  const [isOpen, setIsOpen] = useState(false);
  const hasChildren = node.children && node.children.length > 0;

  const handleToggle = () => {
    if (hasChildren) {
      setIsOpen(!isOpen);
    }
  };

  const Icon = hasChildren ? Folder : File;
  const ToggleIcon = isOpen ? ChevronDown : ChevronRight;

  return (
    <div className="ml-4">
      <div
        className="flex items-center space-x-2 py-1 px-2 rounded-md hover:bg-muted cursor-pointer"
        onClick={handleToggle}
      >
        {hasChildren ? <ToggleIcon className="h-4 w-4 flex-shrink-0" /> : <span className="w-4 h-4" />}
        <Icon className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
        <span className="font-mono text-sm text-primary">{node.code}</span>
        <span className="flex-grow truncate">{node.description}</span>
        <Badge variant={node.type === 'H' ? 'outline' : 'secondary'}>{node.type}</Badge>
      </div>
      {isOpen && hasChildren && (
        <div className="pl-4 border-l border-dashed">
          {node.children.map((child) => (
            <AccountTreeItem key={child.id} node={child} />
          ))}
        </div>
      )}
    </div>
  );
};

const AccountTreeView: React.FC<AccountTreeViewProps> = ({ nodes }) => {
  if (!nodes || nodes.length === 0) {
    return <div className="text-center text-muted-foreground py-8">No accounts to display.</div>;
  }

  return (
    <div className="space-y-1">
      {nodes.map((node) => (
        <AccountTreeItem key={node.id} node={node} />
      ))}
    </div>
  );
};

export default AccountTreeView;
