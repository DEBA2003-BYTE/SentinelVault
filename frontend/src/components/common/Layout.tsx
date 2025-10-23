import React, { ReactNode } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Navigation from './Navigation';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { isAuthenticated } = useAuth();

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      width: '100%'
    }}>
      {isAuthenticated && <Navigation />}
      <main style={{ 
        flex: 1,
        width: '100%',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {children}
      </main>
    </div>
  );
};

export default Layout;