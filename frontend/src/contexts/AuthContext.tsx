import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { User, AuthResponse, DeviceContext } from '../types';
import { authService } from '../services/api';
import { getDeviceContext } from '../utils/deviceFingerprint';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  deviceContext: DeviceContext | null;
  login: (email: string, password: string, zkpProof?: any) => Promise<AuthResponse>;
  loginAdmin: (email: string, password: string) => Promise<AuthResponse>;
  register: (email: string, password: string, zkpProof?: any) => Promise<AuthResponse>;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  refreshDeviceContext: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [deviceContext, setDeviceContext] = useState<DeviceContext | null>(null);

  const refreshDeviceContext = async () => {
    try {
      const context = await getDeviceContext();
      setDeviceContext({
        ...context,
        location: context.location || undefined
      });
    } catch (error) {
      console.error('Failed to get device context:', error);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      // Initialize device context
      await refreshDeviceContext();
      
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        try {
          const userData = await authService.getCurrentUser(storedToken);
          setUser(userData.user);
          setToken(storedToken);
        } catch (error) {
          localStorage.removeItem('token');
          setToken(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string, _zkpProof?: any): Promise<AuthResponse> => {
    console.log('Login called with:', { email, deviceContext });
    
    let context = deviceContext;
    if (!context) {
      console.log('Device context not available, generating new one...');
      context = await getDeviceContext();
    }
    
    console.log('Using device context for login:', context);
    
    const data = await authService.login(email, password, {
      deviceFingerprint: context.fingerprint,
      location: context.location
    });
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('token', data.token);
    return data;
  };

  const loginAdmin = async (email: string, password: string): Promise<AuthResponse> => {
    // Admin login without device fingerprint or location
    const data = await authService.loginAdmin(email, password);
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('token', data.token);
    return data;
  };

  const register = async (email: string, password: string, _zkpProof?: any): Promise<AuthResponse> => {
    console.log('Register called with:', { email, deviceContext });
    
    let context = deviceContext;
    if (!context) {
      console.log('Device context not available, generating new one...');
      context = await getDeviceContext();
    }
    
    console.log('Using device context for registration:', context);
    
    const data = await authService.register(email, password, {
      deviceFingerprint: context.fingerprint,
      location: context.location
    });
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('token', data.token);
    return data;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
  };

  const value: AuthContextType = {
    user,
    token,
    loading,
    deviceContext,
    login,
    loginAdmin,
    register,
    logout,
    isAuthenticated: !!user && !!token,
    isAdmin: user?.isAdmin || false,
    refreshDeviceContext
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};