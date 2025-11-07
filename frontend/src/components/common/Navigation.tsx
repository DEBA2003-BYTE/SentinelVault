import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LogOut, Shield, Users, FileText, BarChart3, Info, MessageSquare, Key } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const Navigation: React.FC = () => {
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    logout();
  };

  return (
    <nav style={{
      backgroundColor: 'var(--color-bg-primary)',
      borderBottom: '1px solid var(--color-border)',
      padding: '0 var(--space-4)'
    }}>
      <div className="container" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '64px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-8)' }}>
          <Link to="/dashboard" style={{
            fontSize: 'var(--text-lg)',
            fontWeight: 'var(--font-semibold)',
            color: 'var(--color-gray-900)',
            textDecoration: 'none'
          }}>
            <Shield size={24} style={{ marginRight: 'var(--space-2)', display: 'inline' }} />
            Cloud Storage
          </Link>

          <div style={{ display: 'flex', gap: 'var(--space-6)' }}>
            <Link
              to="/dashboard"
              style={{
                color: isActive('/dashboard') ? 'var(--color-brand)' : 'var(--color-gray-600)',
                textDecoration: 'none',
                fontSize: 'var(--text-sm)',
                fontWeight: 'var(--font-medium)'
              }}
            >
              Dashboard
            </Link>
            <Link
              to="/files"
              style={{
                color: isActive('/files') ? 'var(--color-brand)' : 'var(--color-gray-600)',
                textDecoration: 'none',
                fontSize: 'var(--text-sm)',
                fontWeight: 'var(--font-medium)'
              }}
            >
              <FileText size={16} style={{ marginRight: 'var(--space-1)', display: 'inline' }} />
              Files
            </Link>
            <Link
              to="/about"
              style={{
                color: isActive('/about') ? 'var(--color-brand)' : 'var(--color-gray-600)',
                textDecoration: 'none',
                fontSize: 'var(--text-sm)',
                fontWeight: 'var(--font-medium)'
              }}
            >
              <Info size={16} style={{ marginRight: 'var(--space-1)', display: 'inline' }} />
              About
            </Link>
            <Link
              to="/zk-auth"
              style={{
                color: isActive('/zk-auth') ? 'var(--color-brand)' : 'var(--color-gray-600)',
                textDecoration: 'none',
                fontSize: 'var(--text-sm)',
                fontWeight: 'var(--font-medium)'
              }}
            >
              <Key size={16} style={{ marginRight: 'var(--space-1)', display: 'inline' }} />
              ZK-Auth
            </Link>
            <Link
              to="/feedback"
              style={{
                color: isActive('/feedback') ? 'var(--color-brand)' : 'var(--color-gray-600)',
                textDecoration: 'none',
                fontSize: 'var(--text-sm)',
                fontWeight: 'var(--font-medium)'
              }}
            >
              <MessageSquare size={16} style={{ marginRight: 'var(--space-1)', display: 'inline' }} />
              Feedback
            </Link>
            {isAdmin && (
              <Link
                to="/admin"
                style={{
                  color: isActive('/admin') ? 'var(--color-brand)' : 'var(--color-gray-600)',
                  textDecoration: 'none',
                  fontSize: 'var(--text-sm)',
                  fontWeight: 'var(--font-medium)'
                }}
              >
                <Users size={16} style={{ marginRight: 'var(--space-1)', display: 'inline' }} />
                Admin
              </Link>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
          <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-gray-600)' }}>
            {user?.email}
          </span>
          <button
            onClick={handleLogout}
            className="btn btn-secondary btn-sm"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;