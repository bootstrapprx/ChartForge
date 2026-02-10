// frontend/src/types/organizer.ts

export interface OrganizerClassification {
    suggested_category: string | null;
    suggested_parent: string | null;
    suggested_type: string | null;
    suggested_nature: string | null;
    confidence: number;
    similar_existing_accounts: any[]; // Define more strictly if needed
    raw_model_output: string | null;
    rule_engine_flags: string[] | null;
    error: string | null;
    memory_votes: any[];
    dynamic_rules_triggered: any[];
    model_reasoning: string | null;
    final_weights: Record<string, number>;
    suggested_code?: string;
}

export interface OrganizerMemory {
    id: string;
    text: string;
    normalized_text: string;
    chosen_category: string;
    chosen_parent: string | null;
    chosen_type: string | null;
    chosen_nature: string | null;
    source: string;
    created_at: string;
}

export interface OrganizerRule {
    id: string;
    rule_pattern: string;
    suggested_category: string;
    suggested_parent: string | null;
    confidence: number;
    created_at: string;
}
