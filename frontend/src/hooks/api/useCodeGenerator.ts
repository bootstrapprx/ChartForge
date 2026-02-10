// frontend/src/hooks/api/useCodeGenerator.ts
import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { CodeGenerationResult, CodeValidationResult } from '@/types/code-generator';

const codeGeneratorKeys = {
  all: ['codeGenerator'] as const,
  generate: (parent?: string, category?: string) => [...codeGeneratorKeys.all, 'generate', { parent, category }] as const,
  validate: (code: string) => [...codeGeneratorKeys.all, 'validate', code] as const,
};

export const useGenerateCode = () => {
    return useMutation({
        mutationFn: (data: { parent_code?: string; category?: string }) =>
            api.post<CodeGenerationResult>('/code/generate', data),
    });
};

export const useValidateCode = () => {
    return useMutation({
        mutationFn: (code: string) =>
            api.post<CodeValidationResult>('/code/validate', { code }),
    });
};

export const useGetNextChildCode = (parent: string, options: { enabled?: boolean } = {}) => {
    return useQuery({
        queryKey: codeGeneratorKeys.generate(parent),
        queryFn: () => api.get<{ next_code: string }>(`/code/next?parent=${parent}`),
        ...options,
    });
};

export const useGetNextRootCode = (category: string, options: { enabled?: boolean } = {}) => {
    return useQuery({
        queryKey: codeGeneratorKeys.generate(undefined, category),
        queryFn: () => api.get<{ next_root_code: string }>(`/code/next-root?category=${category}`),
        ...options,
    });
};
