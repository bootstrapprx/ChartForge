"use client";

import { QueryClient, QueryClientProvider as TanstackQueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import React from 'react';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1, // Retry failed requests 1 time
    },
  },
});

interface QueryClientProviderProps {
  children: React.ReactNode;
}

/**
 * Provides the QueryClient to its children components.
 * Includes React Query Devtools for development environments.
 */
export const QueryClientProvider: React.FC<QueryClientProviderProps> = ({ children }) => {
  return (
    <TanstackQueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </TanstackQueryClientProvider>
  );
};

export default queryClient;
