import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Shield, Info, MessageSquare, Send, CheckCircle, AlertCircle } from 'lucide-react';

const RegisterTabs: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'register' | 'about' | 'feedback'>('register');
  
  // Register form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Feedback form state
  const [feedbackEmail, setFeedbackEmail] = useState('');
  const [feedbackComplaint, setFeedbackComplaint] = useState('');
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [feedbackError, setFeedbackError] = useState('');

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          password
        })
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        window.location.href = '/dashboard';
      } else {
        setError(data.error || 'Registration failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackLoading(true);
    setFeedbackError('');

    if (feedbackComplaint.length < 10) {
      setFeedbackError('Please provide more details (at least 10 characters)');
      setFeedbackLoading(false);
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/feedback/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: feedbackEmail,
          complaint: feedbackComplaint
        })
      });

      if (response.ok) {
        setFeedbackSubmitted(true);
        setFeedbackEmail('');
        setFeedbackComplaint('');
      } else {
        const data = await response.json();
        setFeedbackError(data.error || 'Failed to submit feedback');
      }
    } catch (err) {
      setFeedbackError('Network error. Please try again.');
    } finally {
      setFeedbackLoading(false);
    }
  };

  const features = [
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Zero-Knowledge Proofs",
      description: "Advanced cryptographic verification without revealing sensitive information.",
      color: "var(--color-brand)"
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Device Authentication", 
      description: "Unique device fingerprinting for enhanced security.",
      color: "#10b981"
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Risk Assessment",
      description: "Real-time risk scoring based on behavior and location.",
      color: "#f59e0b"
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Policy Engine",
      description: "Flexible, rule-based access control with OPA integration.",
      color: "#8b5cf6"
    }
  ];

  return (
    <div className="auth-container" style={{
      background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'var(--space-4)'
    }}>
      <div className="card" style={{ 
        width: '100%', 
        maxWidth: activeTab === 'about' ? '900px' : '500px',
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        borderRadius: '20px',
        padding: 0,
        overflow: 'hidden'
      }}>
        {/* Tabs Header */}
        <div style={{ 
          display: 'flex', 
          borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
          background: 'rgba(255, 255, 255, 0.1)'
        }}>
          <button
            onClick={() => setActiveTab('register')}
            style={{
              flex: 1,
              padding: 'var(--space-4)',
              border: 'none',
              background: activeTab === 'register' ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
              color: activeTab === 'register' ? '#f5576c' : 'var(--color-gray-600)',
              fontWeight: activeTab === 'register' ? '600' : '400',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 'var(--space-2)',
              transition: 'all 0.3s ease'
            }}
          >
            <Shield size={18} />
            Register
          </button>
          <button
            onClick={() => setActiveTab('about')}
            style={{
              flex: 1,
              padding: 'var(--space-4)',
              border: 'none',
              background: activeTab === 'about' ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
              color: activeTab === 'about' ? '#f5576c' : 'var(--color-gray-600)',
              fontWeight: activeTab === 'about' ? '600' : '400',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 'var(--space-2)',
              transition: 'all 0.3s ease'
            }}
          >
            <Info size={18} />
            About
          </button>
          <button
            onClick={() => setActiveTab('feedback')}
            style={{
              flex: 1,
              padding: 'var(--space-4)',
              border: 'none',
              background: activeTab === 'feedback' ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
              color: activeTab === 'feedback' ? '#f5576c' : 'var(--color-gray-600)',
              fontWeight: activeTab === 'feedback' ? '600' : '400',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 'var(--space-2)',
              transition: 'all 0.3s ease'
            }}
          >
            <MessageSquare size={18} />
            Feedback
          </button>
        </div>

        {/* Tab Content */}
        <div style={{ padding: 'var(--space-8)' }}>
          {/* Register Tab */}
          {activeTab === 'register' && (
            <div>
              <div style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>
                <div style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto var(--space-4)',
                  boxShadow: '0 10px 25px -5px rgba(245, 87, 108, 0.4)'
                }}>
                  <Shield size={40} style={{ color: 'white' }} />
                </div>
                <h1 style={{ 
                  marginBottom: 'var(--space-2)',
                  fontSize: '2rem',
                  fontWeight: 'var(--font-bold)',
                  background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}>
                  Create Account
                </h1>
                <p style={{ color: 'var(--color-gray-600)', fontSize: 'var(--text-lg)' }}>
                  Join our secure cloud storage platform
                </p>
              </div>

              {error && (
                <div className="alert alert-error" style={{ marginBottom: 'var(--space-4)' }}>
                  <AlertCircle size={16} style={{ marginRight: 'var(--space-2)' }} />
                  {error}
                </div>
              )}

              <form onSubmit={handleRegisterSubmit}>
                <div className="form-group">
                  <label htmlFor="register-email" className="form-label">Email</label>
                  <input
                    id="register-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="form-input"
                    required
                    disabled={loading}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="register-password" className="form-label">Password</label>
                  <input
                    id="register-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="form-input"
                    required
                    disabled={loading}
                    minLength={8}
                  />
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-gray-500)', marginTop: 'var(--space-1)' }}>
                    Must be at least 8 characters long
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="register-confirm-password" className="form-label">Confirm Password</label>
                  <input
                    id="register-confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="form-input"
                    required
                    disabled={loading}
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ 
                    width: '100%', 
                    marginBottom: 'var(--space-4)',
                    padding: 'var(--space-3) var(--space-6)'
                  }}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className="spinner" />
                      Creating account...
                    </>
                  ) : (
                    'Create Account'
                  )}
                </button>
              </form>

              <div style={{ textAlign: 'center' }}>
                <span style={{ color: 'var(--color-gray-600)' }}>Already have an account? </span>
                <Link to="/login">Sign in</Link>
              </div>
            </div>
          )}

          {/* About Tab - Same as AuthTabs */}
          {activeTab === 'about' && (
            <div>
              <div style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}>
                <div style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto var(--space-4)',
                  boxShadow: '0 10px 25px -5px rgba(245, 87, 108, 0.4)'
                }}>
                  <Shield size={40} style={{ color: 'white' }} />
                </div>
                <h1 style={{ 
                  marginBottom: 'var(--space-2)',
                  fontSize: '2rem',
                  fontWeight: 'var(--font-bold)',
                  background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}>
                  SentinelVault
                </h1>
                <p style={{ color: 'var(--color-gray-600)', fontSize: 'var(--text-lg)' }}>
                  Next-generation secure cloud storage with zero-knowledge proofs and advanced security.
                </p>
              </div>

              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(2, 1fr)', 
                gap: 'var(--space-4)',
                marginBottom: 'var(--space-6)'
              }}>
                {features.map((feature, index) => (
                  <div 
                    key={index}
                    style={{
                      padding: 'var(--space-4)',
                      backgroundColor: 'rgba(255, 255, 255, 0.5)',
                      borderRadius: '12px',
                      border: '1px solid rgba(255, 255, 255, 0.3)'
                    }}
                  >
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 'var(--space-3)',
                      marginBottom: 'var(--space-2)'
                    }}>
                      <div style={{ color: feature.color }}>
                        {feature.icon}
                      </div>
                      <h3 style={{ 
                        fontSize: 'var(--text-base)', 
                        fontWeight: 'var(--font-semibold)',
                        margin: 0
                      }}>
                        {feature.title}
                      </h3>
                    </div>
                    <p style={{ 
                      color: 'var(--color-gray-600)', 
                      fontSize: 'var(--text-sm)',
                      lineHeight: '1.5',
                      margin: 0
                    }}>
                      {feature.description}
                    </p>
                  </div>
                ))}
              </div>

              <div style={{ textAlign: 'center' }}>
                <p style={{ color: 'var(--color-gray-600)', marginBottom: 'var(--space-4)' }}>
                  Ready to experience secure cloud storage?
                </p>
                <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'center' }}>
                  <Link to="/login" className="btn btn-secondary" style={{ padding: 'var(--space-3) var(--space-6)' }}>
                    Sign In
                  </Link>
                  <button
                    onClick={() => setActiveTab('register')}
                    className="btn btn-primary"
                    style={{ padding: 'var(--space-3) var(--space-6)' }}
                  >
                    Create Account
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Feedback Tab - Same as AuthTabs */}
          {activeTab === 'feedback' && (
            <div>
              {feedbackSubmitted ? (
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    backgroundColor: '#d1fae5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto var(--space-4)'
                  }}>
                    <CheckCircle size={30} style={{ color: '#10b981' }} />
                  </div>
                  <h2 style={{ 
                    fontSize: '1.5rem',
                    fontWeight: 'var(--font-bold)',
                    marginBottom: 'var(--space-4)',
                    color: 'var(--color-success)'
                  }}>
                    Thank You!
                  </h2>
                  <p style={{ 
                    color: 'var(--color-gray-600)',
                    marginBottom: 'var(--space-6)',
                    lineHeight: '1.6'
                  }}>
                    Your feedback has been submitted successfully. Our team will review it and get back to you if needed.
                  </p>
                  <button
                    onClick={() => setFeedbackSubmitted(false)}
                    className="btn btn-primary"
                    style={{ padding: 'var(--space-3) var(--space-6)' }}
                  >
                    Submit Another Feedback
                  </button>
                </div>
              ) : (
                <div>
                  <div style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>
                    <MessageSquare size={48} style={{ color: '#f5576c', marginBottom: 'var(--space-3)' }} />
                    <h2 style={{ 
                      fontSize: '1.5rem',
                      fontWeight: 'var(--font-bold)',
                      marginBottom: 'var(--space-2)'
                    }}>
                      We Value Your Feedback
                    </h2>
                    <p style={{ color: 'var(--color-gray-600)' }}>
                      Help us improve SentinelVault by sharing your experience or reporting issues.
                    </p>
                  </div>

                  {feedbackError && (
                    <div className="alert alert-error" style={{ marginBottom: 'var(--space-4)' }}>
                      <AlertCircle size={16} style={{ marginRight: 'var(--space-2)' }} />
                      {feedbackError}
                    </div>
                  )}

                  <form onSubmit={handleFeedbackSubmit}>
                    <div className="form-group">
                      <label htmlFor="feedback-email" className="form-label">
                        Your Email Address
                      </label>
                      <input
                        id="feedback-email"
                        type="email"
                        value={feedbackEmail}
                        onChange={(e) => setFeedbackEmail(e.target.value)}
                        className="form-input"
                        placeholder="your@email.com"
                        required
                        disabled={feedbackLoading}
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="feedback-complaint" className="form-label">
                        Your Feedback
                      </label>
                      <textarea
                        id="feedback-complaint"
                        value={feedbackComplaint}
                        onChange={(e) => setFeedbackComplaint(e.target.value)}
                        className="form-input"
                        rows={4}
                        placeholder="Please describe your issue, suggestion, or feedback..."
                        required
                        disabled={feedbackLoading}
                        style={{ resize: 'vertical', minHeight: '100px' }}
                      />
                      <div style={{ 
                        fontSize: 'var(--text-xs)', 
                        color: 'var(--color-gray-500)', 
                        marginTop: 'var(--space-1)',
                        display: 'flex',
                        justifyContent: 'space-between'
                      }}>
                        <span>Minimum 10 characters required</span>
                        <span>{feedbackComplaint.length}/1000</span>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="btn btn-primary"
                      style={{ 
                        width: '100%', 
                        padding: 'var(--space-3) var(--space-6)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 'var(--space-2)'
                      }}
                      disabled={feedbackLoading || feedbackComplaint.length < 10}
                    >
                      {feedbackLoading ? (
                        <>
                          <div className="spinner" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Send size={18} />
                          Submit Feedback
                        </>
                      )}
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RegisterTabs;