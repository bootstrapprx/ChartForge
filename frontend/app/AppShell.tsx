"use client";

import { QueryClientProvider } from "@/context/queryClient";
import { ManualModeProvider } from "@/contexts/ManualModeContext";
import App from "@/App";

export default function AppShell() {
  return (
    <QueryClientProvider>
      <ManualModeProvider>
        <App />
      </ManualModeProvider>
    </QueryClientProvider>
  );
}
