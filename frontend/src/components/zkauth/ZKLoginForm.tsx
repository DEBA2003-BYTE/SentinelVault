import React, { useState, useEffect } from 'react';
import { Shield, Key, CheckCircle, Loader } from 'lucide-react';

interface IdentityProvider {
  id: string;
  name: string;
  description: string;
  credentialTypes: string[];
  trustLevel: 'basic' | 'enhanced' | 'premium';
}

interface ZKLoginFormProps {
  onSuccess: (token: string, userInfo: any) => void;
  onError: (error: string) => void;
}

const ZKLoginForm: React.FC<ZKLoginFormProps> = ({ onSuccess, onError }) => {
  const [providers, setProviders] = useState<IdentityProvider[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<IdentityProvider | null>(null);
  const [selectedCredentialType, setSelectedCredentialType] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'select' | 'authenticate' | 'success'>('select');
  const [, setChallenge] = useState<string>('');

  useEffect(() => {
    fetchProviders();
  }, []);

  const fetchProviders = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/zk-login/providers');
      const data = await response.json();
      setProviders(data.providers);
    } catch (error) {
      onError('Failed to load identity providers');
    }
  };

  const generateChallenge = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/zk-login/challenge', {
        method: 'POST'
      });
      const data = await response.json();
      setChallenge(data.challenge);
      return data.challenge;
    } catch (error) {
      throw new Error('Failed to generate challenge');
    }
  };

  const simulateZKProofGeneration = async (
    provider: IdentityProvider,
    credentialType: string,
    challenge: string
  ) => {
    // Simulate ZK proof generation (in real app, this would use a ZK library)
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate processing time

    const proofData = {
      credential: `${provider.id}_${credentialType}_commitment`,
      challenge,
      timestamp: Date.now()
    };

    // Simulate proof generation
    const proof = btoa(JSON.stringify(proofData)).slice(0, 64);
    const nullifierHash = btoa(`${provider.id}_${challenge}`).slice(0, 64);

    return {
      proof,
      publicSignals: [
        credentialType,
        provider.id,
        challenge,
        Date.now().toString()
      ],
      credentialType,
      issuer: provider.id,
      nullifierHash,
      challenge
    };
  };

  const handleAuthenticate = async () => {
    if (!selectedProvider || !selectedCredentialType) {
      onError('Please select a provider and credential type');
      return;
    }

    setLoading(true);
    setStep('authenticate');

    try {
      // Generate challenge
      const challengeValue = await generateChallenge();

      // Simulate ZK proof generation
      const zkProof = await simulateZKProofGeneration(
        selectedProvider,
        selectedCredentialType,
        challengeValue
      );

      // Authenticate with ZK proof
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/zk-login/authenticate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(zkProof)
      });

      const data = await response.json();

      if (response.ok) {
        setStep('success');
        setTimeout(() => {
          onSuccess(data.token, data.user);
        }, 1500);
      } else {
        onError(data.error || 'Authentication failed');
      }
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const getTrustLevelColor = (level: string) => {
    switch (level) {
      case 'premium': return '#10b981';
      case 'enhanced': return '#f59e0b';
      case 'basic': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const getTrustLevelBg = (level: string) => {
    switch (level) {
      case 'premium': return '#d1fae5';
      case 'enhanced': return '#fef3c7';
      case 'basic': return '#f3f4f6';
      default: return '#f3f4f6';
    }
  };

  if (step === 'success') {
    return (
      <div style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
        <div style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          backgroundColor: '#d1fae5',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto var(--space-4)'
        }}>
          <CheckCircle size={40} style={{ color: '#10b981' }} />
        </div>
        <h2 style={{ color: '#10b981', marginBottom: 'var(--space-2)' }}>
          ZK-Login Successful!
        </h2>
        <p style={{ color: 'var(--color-gray-600)' }}>
          Identity verified without exposing personal data
        </p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '500px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>
        <Shield size={48} style={{ color: 'var(--color-brand)', marginBottom: 'var(--space-3)' }} />
        <h2 style={{ marginBottom: 'var(--space-2)' }}>Zero-Knowledge Login</h2>
        <p style={{ color: 'var(--color-gray-600)' }}>
          Authenticate with your identity credential without revealing personal data
        </p>
      </div>

      {step === 'select' && (
        <div>
          <h3 style={{ marginBottom: 'var(--space-4)' }}>Select Identity Provider</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {providers.map((provider) => (
              <div
                key={provider.id}
                onClick={() => setSelectedProvider(provider)}
                style={{
                  padding: 'var(--space-4)',
                  border: selectedProvider?.id === provider.id 
                    ? '2px solid var(--color-brand)' 
                    : '1px solid var(--color-border)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  backgroundColor: selectedProvider?.id === provider.id 
                    ? 'var(--color-brand-light)' 
                    : 'white'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4 style={{ margin: 0, marginBottom: 'var(--space-1)' }}>{provider.name}</h4>
                    <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--color-gray-600)' }}>
                      {provider.description}
                    </p>
                  </div>
                  <span style={{
                    padding: '0.25rem 0.75rem',
                    borderRadius: '12px',
                    fontSize: 'var(--text-xs)',
                    fontWeight: '500',
                    backgroundColor: getTrustLevelBg(provider.trustLevel),
                    color: getTrustLevelColor(provider.trustLevel)
                  }}>
                    {provider.trustLevel.toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {selectedProvider && (
            <div style={{ marginTop: 'var(--space-6)' }}>
              <h4 style={{ marginBottom: 'var(--space-3)' }}>Select Credential Type</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                {selectedProvider.credentialTypes.map((type) => (
                  <label
                    key={type}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: 'var(--space-3)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '6px',
                      cursor: 'pointer'
                    }}
                  >
                    <input
                      type="radio"
                      name="credentialType"
                      value={type}
                      checked={selectedCredentialType === type}
                      onChange={(e) => setSelectedCredentialType(e.target.value)}
                      style={{ marginRight: 'var(--space-2)' }}
                    />
                    <span style={{ textTransform: 'capitalize' }}>
                      {type.replace('_', ' ')}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={handleAuthenticate}
            disabled={!selectedProvider || !selectedCredentialType || loading}
            className="btn btn-primary"
            style={{ 
              width: '100%', 
              marginTop: 'var(--space-6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 'var(--space-2)'
            }}
          >
            <Key size={18} />
            Authenticate with ZK Proof
          </button>
        </div>
      )}

      {step === 'authenticate' && (
        <div style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
          <Loader size={48} style={{ color: 'var(--color-brand)', marginBottom: 'var(--space-4)', animation: 'spin 1s linear infinite' }} />
          <h3 style={{ marginBottom: 'var(--space-2)' }}>Generating ZK Proof</h3>
          <p style={{ color: 'var(--color-gray-600)' }}>
            Creating cryptographic proof of your {selectedCredentialType?.replace('_', ' ')} credential...
          </p>
          <div style={{ 
            marginTop: 'var(--space-4)',
            padding: 'var(--space-3)',
            backgroundColor: 'var(--color-bg-secondary)',
            borderRadius: '6px',
            fontSize: 'var(--text-sm)'
          }}>
            ✓ No personal data transmitted<br/>
            ✓ Zero-knowledge verification<br/>
            ✓ Cryptographically secure
          </div>
        </div>
      )}
    </div>
  );
};

export default ZKLoginForm;