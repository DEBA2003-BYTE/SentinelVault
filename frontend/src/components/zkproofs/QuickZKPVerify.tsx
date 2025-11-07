import React, { useState } from 'react';
import { Shield, CheckCircle, Loader, AlertCircle } from 'lucide-react';
import { useZKP } from '../../contexts/ZKPContext';

const QuickZKPVerify: React.FC = () => {
  const [isVerifying, setIsVerifying] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  const { generateIdentityProof, verifyIdentityProof, refreshStatus } = useZKP();

  const handleQuickVerify = async () => {
    try {
      setIsVerifying(true);
      setError(null);
      setResult(null);

      // Generate and verify identity proof in one step
      const proof = await generateIdentityProof();
      const verificationResult = await verifyIdentityProof(proof);
      
      setResult(verificationResult);
      
      // Refresh status after successful verification
      await refreshStatus();
      
      // Reload page to update all components
      setTimeout(() => {
        window.location.reload();
      }, 2000);
      
    } catch (err: any) {
      console.error('Quick verification error:', err);
      setError(err.message || 'Verification failed');
    } finally {
      setIsVerifying(false);
    }
  };

  if (result && result.verified) {
    return (
      <div className="quick-zkp-verify success">
        <CheckCircle className="w-6 h-6 text-green-500" />
        <div>
          <h4>Verification Complete!</h4>
          <p>Your identity has been cryptographically verified.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="quick-zkp-verify error">
        <AlertCircle className="w-6 h-6 text-red-500" />
        <div>
          <h4>Verification Failed</h4>
          <p>{error}</p>
          <button 
            onClick={() => {
              setError(null);
              setResult(null);
            }}
            className="btn btn-sm btn-secondary"
            style={{ marginTop: '8px' }}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="quick-zkp-verify">
      <Shield className="w-6 h-6 text-blue-500" />
      <div>
        <h4>Complete ZKP Verification</h4>
        <p>Verify your identity to reduce risk score and unlock enhanced features.</p>
        <button 
          onClick={handleQuickVerify}
          disabled={isVerifying}
          className="btn btn-sm btn-primary"
          style={{ 
            marginTop: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          {isVerifying && <Loader className="w-4 h-4 animate-spin" />}
          {isVerifying ? 'Verifying...' : 'Verify Identity'}
        </button>
      </div>
    </div>
  );
};

export default QuickZKPVerify;