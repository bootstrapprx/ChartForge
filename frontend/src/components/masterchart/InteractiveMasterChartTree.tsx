import React, { useState, useMemo } from 'react';
import { MasterAccountNode } from '@/types/masterchart';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronRight, 
  ChevronDown, 
  Plus, 
  Edit, 
  Trash2, 
  FileText,
  Folder,
  FolderOpen
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface InteractiveMasterChartTreeProps {
  nodes: MasterAccountNode[];
  onAddChild: (parentId: string | null, parentCode: string | null) => void;
  onEdit: (account: MasterAccountNode) => void;
  onDelete: (account: MasterAccountNode) => void;
  searchTerm?: string;
}

interface TreeNodeProps {
  node: MasterAccountNode;
  level: number;
  expanded: Set<string>;
  onToggle: (id: string) => void;
  onAddChild: (parentId: string | null, parentCode: string | null) => void;
  onEdit: (account: MasterAccountNode) => void;
  onDelete: (account: MasterAccountNode) => void;
  searchTerm?: string;
}

const TreeNode: React.FC<TreeNodeProps> = ({
  node,
  level,
  expanded,
  onToggle,
  onAddChild,
  onEdit,
  onDelete,
  searchTerm = '',
}) => {
  const hasChildren = node.children && node.children.length > 0;
  const isExpanded = expanded.has(node.id);
  const indent = level * 24;

  // Highlight search matches
  const highlightText = (text: string, search: string) => {
    if (!search) return text;
    const parts = text.split(new RegExp(`(${search})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) =>
          part.toLowerCase() === search.toLowerCase() ? (
            <mark key={i} className="bg-yellow-200 dark:bg-yellow-800">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </span>
    );
  };

  const handleToggle = () => {
    if (hasChildren) {
      onToggle(node.id);
    }
  };

  return (
    <div className="select-none">
      <div
        className={cn(
          "group flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted/50 transition-colors",
          "border-l-2 border-transparent hover:border-primary/50"
        )}
        style={{ paddingLeft: `${indent + 8}px` }}
      >
        {/* Expand/Collapse Button */}
        <button
          onClick={handleToggle}
          className={cn(
            "flex items-center justify-center w-5 h-5 rounded hover:bg-muted",
            !hasChildren && "invisible"
          )}
          disabled={!hasChildren}
        >
          {hasChildren && (
            isExpanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )
          )}
        </button>

        {/* Account Icon */}
        <div className="flex-shrink-0">
          {node.type === 'H' ? (
            isExpanded ? (
              <FolderOpen className="h-4 w-4 text-blue-500" />
            ) : (
              <Folder className="h-4 w-4 text-blue-500" />
            )
          ) : (
            <FileText className="h-4 w-4 text-green-500" />
          )}
        </div>

        {/* Code */}
        <span className="font-mono text-sm text-muted-foreground w-24 flex-shrink-0">
          {highlightText(node.code, searchTerm)}
        </span>

        {/* Description */}
        <span className="flex-1 text-sm">
          {highlightText(node.description, searchTerm)}
        </span>

        {/* Category Badge */}
        {node.category && (
          <Badge variant="outline" className="text-xs">
            {node.category}
          </Badge>
        )}

        {/* Type Badge */}
        <Badge 
          variant={node.type === 'H' ? 'default' : 'secondary'}
          className="text-xs w-12 justify-center"
        >
          {node.type === 'H' ? 'Header' : 'Detail'}
        </Badge>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => onAddChild(node.id, node.code)}
            title="Add child account"
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => onEdit(node)}
            title="Edit account"
          >
            <Edit className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive hover:text-destructive"
            onClick={() => onDelete(node)}
            title="Delete account"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div>
          {node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              level={level + 1}
              expanded={expanded}
              onToggle={onToggle}
              onAddChild={onAddChild}
              onEdit={onEdit}
              onDelete={onDelete}
              searchTerm={searchTerm}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const InteractiveMasterChartTree: React.FC<InteractiveMasterChartTreeProps> = ({
  nodes,
  onAddChild,
  onEdit,
  onDelete,
  searchTerm = '',
}) => {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggleNode = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const expandAll = () => {
    const allIds = new Set<string>();
    const collectIds = (nodes: MasterAccountNode[]) => {
      nodes.forEach((node) => {
        if (node.children && node.children.length > 0) {
          allIds.add(node.id);
          collectIds(node.children);
        }
      });
    };
    collectIds(nodes);
    setExpanded(allIds);
  };

  const collapseAll = () => {
    setExpanded(new Set());
  };

  // Auto-expand nodes that match search
  useMemo(() => {
    if (searchTerm) {
      const matchingIds = new Set<string>();
      const findMatches = (nodes: MasterAccountNode[], parentIds: string[] = []) => {
        nodes.forEach((node) => {
          const matches =
            node.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
            node.description.toLowerCase().includes(searchTerm.toLowerCase());
          
          if (matches) {
            // Expand all parents
            parentIds.forEach((id) => matchingIds.add(id));
            matchingIds.add(node.id);
          }

          if (node.children && node.children.length > 0) {
            findMatches(node.children, [...parentIds, node.id]);
          }
        });
      };
      findMatches(nodes);
      setExpanded(matchingIds);
    }
  }, [searchTerm, nodes]);

  return (
    <div className="space-y-2">
      <div className="flex justify-end gap-2 pb-2 border-b">
        <Button variant="outline" size="sm" onClick={expandAll}>
          Expand All
        </Button>
        <Button variant="outline" size="sm" onClick={collapseAll}>
          Collapse All
        </Button>
      </div>
      <div className="space-y-1">
        {nodes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No accounts found. Create a root account to get started.
          </div>
        ) : (
          nodes.map((node) => (
            <TreeNode
              key={node.id}
              node={node}
              level={0}
              expanded={expanded}
              onToggle={toggleNode}
              onAddChild={onAddChild}
              onEdit={onEdit}
              onDelete={onDelete}
              searchTerm={searchTerm}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default InteractiveMasterChartTree;

