import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { ApiError } from '../../services/api';

const AdminLoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { loginAdmin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await loginAdmin(email, password);
      navigate('/admin');
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Admin login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="card" style={{ width: '100%', maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>
          <Shield size={48} style={{ color: '#dc2626', marginBottom: 'var(--space-4)' }} />
          <h1 style={{ marginBottom: 'var(--space-2)' }}>Admin Access</h1>
          <p style={{ color: 'var(--color-gray-600)', marginBottom: 0 }}>
            Secure administrative login
          </p>
        </div>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: 'var(--space-4)' }}>
            <AlertCircle size={16} style={{ marginRight: 'var(--space-2)' }} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email" className="form-label">Admin Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-input"
              placeholder="admin@gmail.com"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">Admin Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-input"
              placeholder="Enter admin password"
              required
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginBottom: 'var(--space-4)', backgroundColor: '#dc2626' }}
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="spinner" />
                Authenticating...
              </>
            ) : (
              'Admin Sign In'
            )}
          </button>
        </form>

        <div style={{ 
          padding: 'var(--space-4)', 
          backgroundColor: '#fef2f2', 
          borderRadius: '8px',
          marginBottom: 'var(--space-4)'
        }}>
          <p style={{ 
            fontSize: '0.875rem', 
            color: '#991b1b', 
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <Shield size={16} />
            <span>Admin access only. No device verification required.</span>
          </p>
        </div>

        <div style={{ textAlign: 'center' }}>
          <span style={{ color: 'var(--color-gray-600)' }}>Regular user? </span>
          <Link to="/login">Sign in here</Link>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginForm;