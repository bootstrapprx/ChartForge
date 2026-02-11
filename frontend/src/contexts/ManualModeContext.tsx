// frontend/src/contexts/ManualModeContext.tsx
"use client";

import React, { createContext, useState, useContext, ReactNode } from 'react';

interface ManualModeContextType {
  isManualMode: boolean;
  toggleManualMode: () => void;
}

const ManualModeContext = createContext<ManualModeContextType | undefined>(undefined);

export const ManualModeProvider = ({ children }: { children: ReactNode }) => {
  const [isManualMode, setIsManualMode] = useState(true); // Default to ON

  const toggleManualMode = () => {
    setIsManualMode(prevMode => !prevMode);
  };

  return (
    <ManualModeContext.Provider value={{ isManualMode, toggleManualMode }}>
      {children}
    </ManualModeContext.Provider>
  );
};

export const useManualMode = () => {
  const context = useContext(ManualModeContext);
  if (context === undefined) {
    throw new Error('useManualMode must be used within a ManualModeProvider');
  }
  return context;
};
