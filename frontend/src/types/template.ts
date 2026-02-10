// frontend/src/types/template.ts

export interface Template {
  id: string;
  name: string;
  description: string;
  // A template would likely contain a list of accounts
  // For now, we'll keep it simple.
}

export type TemplateCreate = Omit<Template, 'id'>;
