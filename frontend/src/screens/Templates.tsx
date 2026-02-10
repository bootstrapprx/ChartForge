// frontend/src/pages/Templates.tsx
import React, { useState } from 'react';
import { useManualCRUD } from '@/hooks/useManualCRUD';
import { Template, TemplateCreate } from '@/types/template';
import { QueryKey } from '@/lib/queryKeys';
import TemplateList from '@/components/manual/templates/TemplateList';
import TemplateForm from '@/components/manual/templates/TemplateForm';
import { Button } from '@/components/ui/button';

const TemplatesPage: React.FC = () => {
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);

  const {
    data: templates,
    isLoading,
    isError,
    createItem,
    updateItem,
    deleteItem,
  } = useManualCRUD<Template>({
    queryKey: QueryKey.TEMPLATES,
    endpoint: '/templates',
  });

  const handleFormSubmit = async (templateData: TemplateCreate | Template) => {
    if ('id' in templateData && templateData.id) {
      await updateItem(templateData as Template);
    } else {
      await createItem(templateData as TemplateCreate);
    }
    setSelectedTemplate(null); // Reset form
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this template?')) {
      await deleteItem(id);
    }
  };

  const handleEdit = (template: Template) => {
    setSelectedTemplate(template);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Chart of Accounts Templates</h1>
        {selectedTemplate && (
          <Button variant="outline" onClick={() => setSelectedTemplate(null)}>
            New Template
          </Button>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <TemplateList
          templates={templates}
          onDelete={handleDelete}
          onEdit={handleEdit}
          isLoading={isLoading}
          isError={isError}
        />
        <TemplateForm
          onSubmit={handleFormSubmit}
          initialData={selectedTemplate}
          isSubmitting={isLoading}
          onCancel={() => setSelectedTemplate(null)}
        />
      </div>
    </div>
  );
};

export default TemplatesPage;
