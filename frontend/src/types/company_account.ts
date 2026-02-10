// frontend/src/types/company_account.ts

export interface CompanyAccount {
  id: string;
  company_id: string;
  code: string;
  description: string;
  type: string;
  parent_code: string | null;
  name: string | null;
  currency: string | null;
  is_active: boolean | null;
  master_account_code: string | null;
  created_at: string;
  updated_at: string;
}
