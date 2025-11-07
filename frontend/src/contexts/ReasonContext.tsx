import React, { createContext, useContext, useState, ReactNode } from 'react';
import type { RejectionReason } from '../types';

interface ReasonContextType {
  reason: RejectionReason | null;
  showReason: (reason: RejectionReason) => void;
  clearReason: () => void;
}

const ReasonContext = createContext<ReasonContextType | undefined>(undefined);

export const useRejectionReason = () => {
  const context = useContext(ReasonContext);
  if (context === undefined) {
    throw new Error('useRejectionReason must be used within a ReasonProvider');
  }
  return context;
};

interface ReasonProviderProps {
  children: ReactNode;
}

export const ReasonProvider: React.FC<ReasonProviderProps> = ({ children }) => {
  const [reason, setReason] = useState<RejectionReason | null>(null);

  const showReason = (newReason: RejectionReason) => {
    setReason(newReason);
  };

  const clearReason = () => {
    setReason(null);
  };

  const value: ReasonContextType = {
    reason,
    showReason,
    clearReason
  };

  return (
    <ReasonContext.Provider value={value}>
      {children}
    </ReasonContext.Provider>
  );
};