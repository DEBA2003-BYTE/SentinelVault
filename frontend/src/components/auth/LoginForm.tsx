import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { ApiError } from '../../services/api';
import RiskIndicator from '../common/RiskIndicator';

const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [riskScore, setRiskScore] = useState<number | null>(null);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setRiskScore(null);

    try {
      const response = await login(email, password);
      setRiskScore(response.riskScore || 0);
      navigate('/dashboard');
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="card" style={{ width: '100%', maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>
          <Shield size={48} style={{ color: 'var(--color-brand)', marginBottom: 'var(--space-4)' }} />
          <h1 style={{ marginBottom: 'var(--space-2)' }}>Welcome Back</h1>
          <p style={{ color: 'var(--color-gray-600)', marginBottom: 0 }}>
            Sign in to your secure cloud storage
          </p>
        </div>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: 'var(--space-4)' }}>
            <AlertCircle size={16} style={{ marginRight: 'var(--space-2)' }} />
            {error}
          </div>
        )}

        {riskScore !== null && (
          <div style={{ marginBottom: 'var(--space-4)', textAlign: 'center' }}>
            <RiskIndicator score={riskScore} />
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email" className="form-label">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-input"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-input"
              required
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginBottom: 'var(--space-4)' }}
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="spinner" />
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div style={{ textAlign: 'center' }}>
          <span style={{ color: 'var(--color-gray-600)' }}>Don't have an account? </span>
          <Link to="/register">Sign up</Link>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;