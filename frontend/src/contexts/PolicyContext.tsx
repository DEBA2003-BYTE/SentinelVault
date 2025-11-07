import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import type { OPADecision, PolicyRule } from '../types';
import { policyService } from '../services/api';
import { useAuth } from './AuthContext';

interface PolicyContextType {
  decision: OPADecision | null;
  rules: PolicyRule[];
  loading: boolean;
  evaluatePolicy: (context: any) => Promise<OPADecision>;
  getRules: () => Promise<void>;
  createRule: (rule: { name: string; description: string; policyCode: string }) => Promise<void>;
  updateRule: (id: string, rule: { name: string; description: string; policyCode: string }) => Promise<void>;
  deleteRule: (id: string) => Promise<void>;
}

const PolicyContext = createContext<PolicyContextType | undefined>(undefined);

export const usePolicy = () => {
  const context = useContext(PolicyContext);
  if (context === undefined) {
    throw new Error('usePolicy must be used within a PolicyProvider');
  }
  return context;
};

interface PolicyProviderProps {
  children: ReactNode;
}

export const PolicyProvider: React.FC<PolicyProviderProps> = ({ children }) => {
  const [decision, setDecision] = useState<OPADecision | null>(null);
  const [rules, setRules] = useState<PolicyRule[]>([]);
  const [loading, setLoading] = useState(false);
  const { token, isAdmin } = useAuth();

  const evaluatePolicy = async (context: any): Promise<OPADecision> => {
    if (!token) throw new Error('Not authenticated');
    
    setLoading(true);
    try {
      const response = await policyService.evaluate(context, token);
      setDecision(response);
      return response;
    } catch (error) {
      console.error('Policy evaluation failed:', error);
      // Return a default allow decision if policy service fails
      const fallbackDecision: OPADecision = {
        decision: 'allow',
        allow: true,
        reason: 'Policy service unavailable - defaulting to allow',
        riskScore: 0,
        timestamp: new Date().toISOString()
      };
      setDecision(fallbackDecision);
      return fallbackDecision;
    } finally {
      setLoading(false);
    }
  };

  const getRules = async (): Promise<void> => {
    if (!token || !isAdmin) return;
    
    setLoading(true);
    try {
      const response = await policyService.getRules(token);
      setRules(response.policies || []);
    } catch (error) {
      console.error('Failed to get policy rules:', error);
    } finally {
      setLoading(false);
    }
  };

  const createRule = async (rule: { name: string; description: string; policyCode: string }): Promise<void> => {
    if (!token || !isAdmin) throw new Error('Admin access required');
    
    setLoading(true);
    try {
      await policyService.createRule(rule, token);
      await getRules(); // Refresh rules list
    } finally {
      setLoading(false);
    }
  };

  const updateRule = async (id: string, rule: { name: string; description: string; policyCode: string }): Promise<void> => {
    if (!token || !isAdmin) throw new Error('Admin access required');
    
    setLoading(true);
    try {
      await policyService.updateRule(id, rule, token);
      await getRules(); // Refresh rules list
    } finally {
      setLoading(false);
    }
  };

  const deleteRule = async (id: string): Promise<void> => {
    if (!token || !isAdmin) throw new Error('Admin access required');
    
    setLoading(true);
    try {
      await policyService.deleteRule(id, token);
      await getRules(); // Refresh rules list
    } finally {
      setLoading(false);
    }
  };

  const value: PolicyContextType = {
    decision,
    rules,
    loading,
    evaluatePolicy,
    getRules,
    createRule,
    updateRule,
    deleteRule
  };

  return (
    <PolicyContext.Provider value={value}>
      {children}
    </PolicyContext.Provider>
  );
};