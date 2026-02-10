// frontend/src/types/masterchart.ts

export interface MasterAccount {
  id: string;
  code: string;
  description: string;
  long_description?: string | null;
  type: 'H' | 'D' | 'Header' | 'Detail';
  category: string;
  fs_mapping?: string | null;
  parent_code: string | null;
  parent_id?: string | null;
  normal_balance?: string | null;
  
  // AI-related fields
  tags?: string[] | null;
  default_vendors?: string[] | null;
  
  // Compliance fields
  regulatory_mapping?: string | null;
  
  // Lifecycle fields
  start_date?: string | null;
  end_date?: string | null;
  notes?: string | null;
  
  // Extended fields
  subcategory?: string | null;
  cash_flow_classification?: string | null;
  cost_center?: string | null;
  gaap_classification?: string | null;
  detailed_description?: string | null;
  
  // Hierarchy
  level: number;
  version?: number;
}

export interface MasterAccountCreate {
  code?: string | null;  // Optional for auto-generation
  description: string;
  long_description?: string | null;
  type: string;
  category: string;
  fs_mapping?: string | null;
  parent_code?: string | null;
  normal_balance?: string | null;
  tags?: string[] | null;
  default_vendors?: string[] | null;
  regulatory_mapping?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  notes?: string | null;
  subcategory?: string | null;
  cash_flow_classification?: string | null;
  cost_center?: string | null;
  gaap_classification?: string | null;
  detailed_description?: string | null;
}

export interface MasterAccountUpdate {
  description?: string;
  long_description?: string | null;
  type?: string;
  category?: string;
  fs_mapping?: string | null;
  normal_balance?: string | null;
  tags?: string[] | null;
  default_vendors?: string[] | null;
  regulatory_mapping?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  notes?: string | null;
  subcategory?: string | null;
  cash_flow_classification?: string | null;
  cost_center?: string | null;
  gaap_classification?: string | null;
  detailed_description?: string | null;
}

export interface MasterAccountNode extends MasterAccount {
  children: MasterAccountNode[];
}

export interface MasterChartStats {
  total_accounts: number;
  header_count: number;
  detail_count: number;
  max_depth: number;
  orphans: number;
  orphan_codes?: string[];
  missing_parents?: string[];
  needs_rebuild?: boolean;
}

// Import Engine Types
export interface ImportPreviewItem {
  code: string;
  description: string;
  action: 'create' | 'update' | 'skip' | 'error';
  changes?: Record<string, { old: any; new: any }>;
  errors?: string[];
  warnings?: string[];
  suggested_corrections?: Record<string, string>;
}

export interface ImportPreviewResult {
  total_records: number;
  to_create: number;
  to_update: number;
  to_skip: number;
  errors: number;
  warnings: number;
  items: ImportPreviewItem[];
  validation_summary: {
    total_records: number;
    valid_records: number;
    invalid_records: number;
    duplicate_codes: number;
    orphan_accounts: number;
    hierarchy_issues: number;
  };
}

export interface ImportResult {
  success: boolean;
  created: number;
  updated: number;
  skipped: number;
  errors: { code?: string; error?: string; errors?: string[] }[];
  version_id?: string;
}

// COA Version Types
export interface COAVersionInfo {
  id: string;
  version_number: number;
  created_at: string;
  created_by?: string;
  description?: string;
  account_count: number;
  change_summary?: Record<string, any>;
}

export interface COAVersionDetail extends COAVersionInfo {
  accounts: MasterAccount[];
}

// Template Types
export interface TemplateAccount {
  code: string;
  description: string;
  long_description?: string;
  type: string;
  category: string;
  fs_mapping?: string;
  parent_code?: string;
  normal_balance?: string;
  tags?: string[];
  default_vendors?: string[];
  regulatory_mapping?: string;
  start_date?: string;
  end_date?: string;
  notes?: string;
  subcategory?: string;
  cash_flow_classification?: string;
  cost_center?: string;
  gaap_classification?: string;
  detailed_description?: string;
}

export interface TemplateStats {
  total_accounts: number;
  header_count: number;
  detail_count: number;
  categories: Record<string, number>;
  unique_tags: number;
  unique_vendors: number;
  top_tags: string[];
}

// Autofill Suggestions
export interface AutofillSuggestions {
  category: string;
  suggestions: {
    fs_mapping?: string;
    normal_balance?: string;
    subcategory?: string;
    all_fs_mappings?: string[];
    all_subcategories?: string[];
  };
}

// Account Suggestion
export interface AccountSuggestion {
  code: string;
  description: string;
  category: string;
  type: string;
  normal_balance?: string;
  tags?: string[];
}
