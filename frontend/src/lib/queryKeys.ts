/**
 * Centralized query keys for React Query.
 * Using a structured approach helps avoid key collisions and simplifies invalidation.
 *
 * See: https://tanstack.com/query/v5/docs/react/guides/query-keys
 */

export enum QueryKey {
  COMPANIES = 'companies',
  MASTER_CHART = 'masterChart',
  COMPANY_CHART = 'companyChart',
  TEMPLATES = 'templates',
}

export const masterChartKeys = {
  all: [QueryKey.MASTER_CHART] as const,
  lists: () => [...masterChartKeys.all, 'list'] as const,
  list: (filters: string) => [...masterChartKeys.lists(), { filters }] as const,
  details: () => [...masterChartKeys.all, 'detail'] as const,
  detail: (id: string) => [...masterChartKeys.details(), id] as const,
};

export const companyChartKeys = {
  all: [QueryKey.COMPANY_CHART] as const,
  lists: () => [...companyChartKeys.all, 'list'] as const,
  list: (filters: string) => [...companyChartKeys.lists(), { filters }] as const,
  details: () => [...companyChartKeys.all, 'detail'] as const,
  detail: (id: string) => [...companyChartKeys.details(), id] as const,
};

export const companyKeys = {
  all: [QueryKey.COMPANIES] as const,
  lists: () => [...companyKeys.all, 'list'] as const,
  list: (filters: string) => [...companyKeys.lists(), { filters }] as const,
  details: () => [...companyKeys.all, 'detail'] as const,
  detail: (id: string) => [...companyKeys.details(), id] as const,
};

export const templateKeys = {
    all: [QueryKey.TEMPLATES] as const,
    lists: () => [...templateKeys.all, 'list'] as const,
    list: (filters: string) => [...templateKeys.lists(), { filters }] as const,
    details: () => [...templateKeys.all, 'detail'] as const,
    detail: (id: string) => [...templateKeys.details(), id] as const,
};
