// frontend/src/components/manual/templates/TemplateList.tsx
import React from 'react';
import { Template } from '@/types/template';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2 } from 'lucide-react';

interface TemplateListProps {
  templates: Template[];
  onDelete: (id: string) => void;
  onEdit: (template: Template) => void;
  isLoading: boolean;
  isError: boolean;
}

const TemplateList: React.FC<TemplateListProps> = ({ templates, onDelete, onEdit, isLoading, isError }) => {
  if (isLoading) return <p>Loading templates...</p>;
  if (isError) return <p className="text-destructive">Error loading templates.</p>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Existing Templates</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {templates.map((template) => (
            <li key={template.id} className="p-2 border rounded flex justify-between items-center">
              <div>
                <span onClick={() => onEdit(template)} className="cursor-pointer hover:underline font-semibold">{template.name}</span>
                <p className="text-sm text-muted-foreground">{template.description}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => onDelete(template.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
        {templates.length === 0 && (
          <p className="text-muted-foreground">No templates found. Add one to get started.</p>
        )}
      </CardContent>
    </Card>
  );
};

export default TemplateList;
