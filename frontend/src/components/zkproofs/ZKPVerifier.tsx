import React, { useState } from 'react';
import { Shield, Key, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { useZKP } from '../../contexts/ZKPContext';
import { useAuth } from '../../contexts/AuthContext';

const ZKPVerifier: React.FC = () => {
  const [step, setStep] = useState<'input' | 'generating' | 'verifying' | 'complete'>('input');
  const [secret, setSecret] = useState('');
  const [publicValue, setPublicValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  
  const { generateProof, verifyProof, generateIdentityProof, verifyIdentityProof } = useZKP();
  const { user } = useAuth();

  const handleGenerateAndVerify = async () => {
    if (!secret.trim() || !publicValue.trim()) {
      setError('Please provide both secret and public value');
      return;
    }

    try {
      setError(null);
      setStep('generating');

      // Generate proof
      const proof = await generateProof({ secret, publicValue });
      
      setStep('verifying');
      
      // Verify proof
      const verificationResult = await verifyProof(proof);
      
      setResult(verificationResult);
      setStep('complete');
      
      // Refresh the ZKP status to update the UI
      setTimeout(() => {
        window.location.reload(); // Simple way to refresh all contexts
      }, 2000);
    } catch (err: any) {
      console.error('ZKP verification error:', err);
      setError(err.message || 'Verification failed');
      setStep('input');
    }
  };

  const handleIdentityVerification = async () => {
    try {
      setError(null);
      setStep('generating');

      // Generate identity proof
      const proof = await generateIdentityProof();
      
      setStep('verifying');
      
      // Verify identity proof
      const verificationResult = await verifyIdentityProof(proof);
      
      setResult(verificationResult);
      setStep('complete');
      
      // Refresh the ZKP status to update the UI
      setTimeout(() => {
        window.location.reload(); // Simple way to refresh all contexts
      }, 2000);
    } catch (err: any) {
      console.error('Identity verification error:', err);
      setError(err.message || 'Identity verification failed');
      setStep('input');
    }
  };

  const resetForm = () => {
    setStep('input');
    setSecret('');
    setPublicValue('');
    setError(null);
    setResult(null);
  };

  if (step === 'complete' && result) {
    return (
      <div className="zkp-verifier success">
        <div className="verification-result">
          <CheckCircle className="w-12 h-12 text-green-500" />
          <h3>Verification Successful!</h3>
          <p>{result.message}</p>
          
          <div className="result-details">
            <div className="detail-item">
              <span>Verification Time:</span>
              <span>{new Date(result.timestamp).toLocaleString()}</span>
            </div>
            {result.riskScore !== undefined && (
              <div className="detail-item">
                <span>Risk Score:</span>
                <span className="risk-score low">{result.riskScore}/100</span>
              </div>
            )}
          </div>

          <button onClick={resetForm} className="btn btn-secondary">
            Verify Another Proof
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="zkp-verifier">
      <div className="verifier-header">
        <Shield className="w-6 h-6" />
        <h3>Zero-Knowledge Proof Verification</h3>
      </div>

      {error && (
        <div className="error-message">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {step === 'generating' && (
        <div className="verification-step">
          <Loader className="w-8 h-8 animate-spin" />
          <h4>Generating Proof...</h4>
          <p>Creating cryptographic proof of your credentials</p>
        </div>
      )}

      {step === 'verifying' && (
        <div className="verification-step">
          <Loader className="w-8 h-8 animate-spin" />
          <h4>Verifying Proof...</h4>
          <p>Validating proof without revealing sensitive data</p>
        </div>
      )}

      {step === 'input' && (
        <div className="verification-form">
          <div className="verification-options">
            <div className="option-card">
              <div className="option-header">
                <Key className="w-5 h-5" />
                <h4>Custom Proof Verification</h4>
              </div>
              <p>Generate and verify a custom zero-knowledge proof</p>
              
              <div className="form-group">
                <label htmlFor="secret">Secret Value</label>
                <input
                  id="secret"
                  type="password"
                  value={secret}
                  onChange={(e) => setSecret(e.target.value)}
                  placeholder="Enter your secret value"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="publicValue">Public Value</label>
                <input
                  id="publicValue"
                  type="text"
                  value={publicValue}
                  onChange={(e) => setPublicValue(e.target.value)}
                  placeholder="Enter public value to prove"
                  className="form-input"
                />
              </div>

              <button 
                onClick={handleGenerateAndVerify}
                className="btn btn-primary"
                disabled={!secret.trim() || !publicValue.trim()}
              >
                Generate & Verify Proof
              </button>
            </div>

            <div className="option-card">
              <div className="option-header">
                <Shield className="w-5 h-5" />
                <h4>Identity Verification</h4>
              </div>
              <p>Verify your identity using your account credentials</p>
              
              <div className="identity-info">
                <p><strong>Email:</strong> {user?.email}</p>
                <p><strong>Account ID:</strong> {user?.id?.slice(0, 8)}...</p>
              </div>

              <button 
                onClick={handleIdentityVerification}
                className="btn btn-primary"
              >
                Verify Identity
              </button>
            </div>
          </div>

          <div className="zkp-info">
            <h4>About Zero-Knowledge Proofs</h4>
            <ul>
              <li>Prove you know a secret without revealing it</li>
              <li>Cryptographically secure and privacy-preserving</li>
              <li>Reduces your risk score when verified</li>
              <li>Enables access to enhanced security features</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default ZKPVerifier;