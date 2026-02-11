"use client";

import { ReactNode } from "react";
import { ThemeProvider } from "next-themes";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import ErrorBoundary from "@/components/ErrorBoundary";
import { QueryClientProvider } from "@/context/queryClient";
import { ManualModeProvider } from "@/contexts/ManualModeContext";
import { AuthProvider } from "@/contexts/AuthContext";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        <TooltipProvider>
          <AuthProvider>
            <QueryClientProvider>
              <ManualModeProvider>
                {children}
              </ManualModeProvider>
            </QueryClientProvider>
            <Toaster />
            <Sonner />
          </AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
