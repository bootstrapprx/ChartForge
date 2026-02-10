// frontend/src/components/manual/templates/TemplateForm.tsx
import React, { useState, useEffect } from 'react';
import { Template, TemplateCreate } from '@/types/template';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface TemplateFormProps {
  onSubmit: (template: TemplateCreate | Template) => void;
  initialData?: Template | null;
  isSubmitting: boolean;
  onCancel: () => void;
}

const TemplateForm: React.FC<TemplateFormProps> = ({ onSubmit, initialData, isSubmitting, onCancel }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setDescription(initialData.description);
    } else {
      setName('');
      setDescription('');
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const templateData = { ...initialData, name: name.trim(), description: description.trim() };
    onSubmit(templateData as Template);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{initialData ? 'Edit Template' : 'Create New Template'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Template name"
            required
          />
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Template description"
          />
          <div className="flex gap-2">
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? 'Saving...' : (initialData ? 'Save Changes' : 'Create')}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default TemplateForm;
