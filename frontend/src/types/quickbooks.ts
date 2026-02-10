// frontend/src/types/quickbooks.ts

export interface QuickBooksSyncStatus {
    is_connected: boolean;
    realm_id: string | null;
    last_sync: string | null; // ISO date string
    company_name: string | null;
}

export interface QBOAccount {
    Id: string;
    Name: string;
    AcctNum?: string;
    AccountType: string;
    AccountSubType: string;
    Classification: string;
    SyncToken: string;
}
