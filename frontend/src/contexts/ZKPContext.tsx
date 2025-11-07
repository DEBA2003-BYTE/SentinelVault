import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { ZKPStatus, ZKPProof, ZKPResponse } from '../types';
import { zkpService } from '../services/api';
import { useAuth } from './AuthContext';

interface ZKPContextType {
  status: ZKPStatus | null;
  loading: boolean;
  generateProof: (inputs: { secret: string; publicValue: string }) => Promise<ZKPProof>;
  verifyProof: (proof: ZKPProof) => Promise<ZKPResponse>;
  generateIdentityProof: () => Promise<ZKPProof>;
  verifyIdentityProof: (proof: ZKPProof) => Promise<ZKPResponse>;
  refreshStatus: () => Promise<void>;
}

const ZKPContext = createContext<ZKPContextType | undefined>(undefined);

export const useZKP = () => {
  const context = useContext(ZKPContext);
  if (context === undefined) {
    throw new Error('useZKP must be used within a ZKPProvider');
  }
  return context;
};

interface ZKPProviderProps {
  children: ReactNode;
}

export const ZKPProvider: React.FC<ZKPProviderProps> = ({ children }) => {
  const [status, setStatus] = useState<ZKPStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const { token, isAuthenticated } = useAuth();

  const refreshStatus = async () => {
    if (!token || !isAuthenticated) return;
    
    try {
      setLoading(true);
      const statusData = await zkpService.getStatus(token);
      setStatus(statusData);
    } catch (error) {
      console.error('Failed to get ZKP status:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && token) {
      refreshStatus();
    }
  }, [isAuthenticated, token]);

  const generateProof = async (inputs: { secret: string; publicValue: string }): Promise<ZKPProof> => {
    if (!token) throw new Error('Not authenticated');
    
    setLoading(true);
    try {
      const response = await zkpService.generateProof(inputs, token);
      return {
        proof: response.proof,
        publicSignals: response.publicSignals
      };
    } finally {
      setLoading(false);
    }
  };

  const verifyProof = async (proof: ZKPProof): Promise<ZKPResponse> => {
    if (!token) throw new Error('Not authenticated');
    
    setLoading(true);
    try {
      const response = await zkpService.verifyProof(proof, token);
      await refreshStatus(); // Refresh status after verification
      return response;
    } finally {
      setLoading(false);
    }
  };

  const generateIdentityProof = async (): Promise<ZKPProof> => {
    if (!token) throw new Error('Not authenticated');
    
    setLoading(true);
    try {
      const response = await zkpService.generateIdentityProof(token);
      return {
        proof: response.proof,
        publicSignals: response.publicSignals
      };
    } finally {
      setLoading(false);
    }
  };

  const verifyIdentityProof = async (proof: ZKPProof): Promise<ZKPResponse> => {
    if (!token) throw new Error('Not authenticated');
    
    setLoading(true);
    try {
      const response = await zkpService.verifyIdentityProof(proof, token);
      await refreshStatus(); // Refresh status after verification
      return response;
    } finally {
      setLoading(false);
    }
  };

  const value: ZKPContextType = {
    status,
    loading,
    generateProof,
    verifyProof,
    generateIdentityProof,
    verifyIdentityProof,
    refreshStatus
  };

  return (
    <ZKPContext.Provider value={value}>
      {children}
    </ZKPContext.Provider>
  );
};