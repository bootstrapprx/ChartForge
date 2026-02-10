// frontend/src/types/code-generator.ts

export interface CodeGenerationResult {
    code: string;
    level: number;
    parent_code: string | null;
    pattern_used: string;
    valid: boolean;
    debug: {
        message: string;
    };
}

export interface CodeValidationResult {
    code: string;
    is_valid: boolean;
    issues: string[];
}
