// frontend/src/types/snapshots.ts

export interface Snapshot {
    id: string;
    name: string;
    description: string | null;
    company_id: string | null;
    version: number;
    created_at: string; // ISO date string
    account_count: number;
}
