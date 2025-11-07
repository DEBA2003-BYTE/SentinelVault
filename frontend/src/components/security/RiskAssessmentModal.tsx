import React from 'react';
import { AlertTriangle, Shield, X, Info, Clock, MapPin, Fingerprint, Activity, Wifi, User, Calendar } from 'lucide-react';

interface RiskFactor {
  name: string;
  score: number;
  description: string;
  icon: React.ReactNode;
  status: 'safe' | 'warning' | 'danger';
}

interface RiskAssessmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  riskAssessment: {
    allowed: boolean;
    risk_score: number;
    risk_level: string;
    reasons: string[];
    suggested_action: string;
    detailed_factors?: {
      device_fingerprint: boolean;
      location_anomaly: boolean;
      typing_speed_variance: number;
      failed_attempts: number;
      behavioral_score: number;
      network_reputation: string;
      account_age_hours: number;
    };
  };
}

const RiskAssessmentModal: React.FC<RiskAssessmentModalProps> = ({
  isOpen,
  onClose,
  riskAssessment
}) => {
  if (!isOpen) return null;

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low': return '#10b981';
      case 'medium': return '#f59e0b';
      case 'high': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getRiskFactors = (): RiskFactor[] => {
    const factors: RiskFactor[] = [];
    const details = riskAssessment.detailed_factors;

    if (!details) return factors;

    // Device Fingerprint (Weight: 20)
    factors.push({
      name: 'Device Recognition',
      score: details.device_fingerprint ? 20 : 0,
      description: details.device_fingerprint 
        ? 'New or unrecognized device detected' 
        : 'Device matches registered fingerprint',
      icon: <Fingerprint size={20} />,
      status: details.device_fingerprint ? 'danger' : 'safe'
    });

    // Location Anomaly (Weight: 15)
    factors.push({
      name: 'Location Verification',
      score: details.location_anomaly ? 15 : 0,
      description: details.location_anomaly 
        ? 'Login from different location than registered' 
        : 'Login from registered location',
      icon: <MapPin size={20} />,
      status: details.location_anomaly ? 'danger' : 'safe'
    });

    // Typing Speed (Weight: 10)
    const typingRisk = details.typing_speed_variance > 30 ? 10 : details.typing_speed_variance > 15 ? 5 : 0;
    factors.push({
      name: 'Typing Pattern',
      score: typingRisk,
      description: `Typing speed variance: ${details.typing_speed_variance.toFixed(1)}%`,
      icon: <Activity size={20} />,
      status: typingRisk > 5 ? 'danger' : typingRisk > 0 ? 'warning' : 'safe'
    });

    // Failed Attempts (Weight: 15)
    const attemptRisk = details.failed_attempts >= 3 ? 15 : details.failed_attempts === 2 ? 8 : details.failed_attempts === 1 ? 4 : 0;
    factors.push({
      name: 'Login Attempts',
      score: attemptRisk,
      description: `${details.failed_attempts} failed attempts`,
      icon: <Shield size={20} />,
      status: attemptRisk > 8 ? 'danger' : attemptRisk > 0 ? 'warning' : 'safe'
    });

    // Behavioral Score (Weight: 10)
    const behavioralRisk = details.behavioral_score > 70 ? 10 : 0;
    factors.push({
      name: 'Behavioral Pattern',
      score: behavioralRisk,
      description: `Behavioral score: ${details.behavioral_score}/100`,
      icon: <User size={20} />,
      status: behavioralRisk > 0 ? 'warning' : 'safe'
    });

    // Network Reputation (Weight: 10)
    const networkRisk = details.network_reputation === 'suspicious' ? 7 : 0;
    factors.push({
      name: 'Network Security',
      score: networkRisk,
      description: `Network reputation: ${details.network_reputation}`,
      icon: <Wifi size={20} />,
      status: networkRisk > 0 ? 'warning' : 'safe'
    });

    // Account Age (Weight: 5)
    const ageRisk = details.account_age_hours < 24 ? 5 : 0;
    factors.push({
      name: 'Account Age',
      score: ageRisk,
      description: `Account age: ${Math.round(details.account_age_hours)} hours`,
      icon: <Calendar size={20} />,
      status: ageRisk > 0 ? 'warning' : 'safe'
    });

    return factors;
  };

  const riskFactors = getRiskFactors();

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '24px',
        maxWidth: '600px',
        width: '90%',
        maxHeight: '80vh',
        overflow: 'auto',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <AlertTriangle 
              size={24} 
              style={{ color: getRiskColor(riskAssessment.risk_level) }} 
            />
            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '600' }}>
              Security Risk Assessment
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px'
            }}
          >
            <X size={24} style={{ color: '#6b7280' }} />
          </button>
        </div>

        {/* Risk Score Overview */}
        <div style={{
          backgroundColor: '#f8fafc',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '20px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '600' }}>
                Overall Risk Score
              </h3>
              <p style={{ margin: '4px 0 0 0', color: '#6b7280', fontSize: '0.9rem' }}>
                {riskAssessment.suggested_action}
              </p>
            </div>
            <div style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              color: getRiskColor(riskAssessment.risk_level)
            }}>
              {riskAssessment.risk_score}/100
            </div>
          </div>
          
          <div style={{
            marginTop: '12px',
            padding: '8px 12px',
            borderRadius: '6px',
            backgroundColor: getRiskColor(riskAssessment.risk_level) + '20',
            color: getRiskColor(riskAssessment.risk_level),
            fontSize: '0.9rem',
            fontWeight: '500',
            textTransform: 'uppercase'
          }}>
            {riskAssessment.risk_level} Risk Level
          </div>
        </div>

        {/* Risk Factors Breakdown */}
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', fontWeight: '600' }}>
            Risk Factors Analysis
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {riskFactors.map((factor, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  backgroundColor: factor.status === 'danger' ? '#fef2f2' : 
                                 factor.status === 'warning' ? '#fffbeb' : '#f0fdf4'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    color: factor.status === 'danger' ? '#ef4444' : 
                           factor.status === 'warning' ? '#f59e0b' : '#10b981'
                  }}>
                    {factor.icon}
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: '600' }}>
                      {factor.name}
                    </h4>
                    <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: '#6b7280' }}>
                      {factor.description}
                    </p>
                  </div>
                </div>
                <div style={{
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  color: factor.status === 'danger' ? '#ef4444' : 
                         factor.status === 'warning' ? '#f59e0b' : '#10b981'
                }}>
                  +{factor.score}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Detailed Reasons */}
        {riskAssessment.reasons.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '1.1rem', fontWeight: '600' }}>
              Specific Issues Detected
            </h3>
            <div style={{
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              padding: '12px'
            }}>
              {riskAssessment.reasons.map((reason, index) => (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: index < riskAssessment.reasons.length - 1 ? '8px' : 0
                  }}
                >
                  <Info size={16} style={{ color: '#ef4444' }} />
                  <span style={{ fontSize: '0.9rem', color: '#7f1d1d' }}>
                    {reason}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Button */}
        <div style={{ textAlign: 'center' }}>
          <button
            onClick={onClose}
            style={{
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 24px',
              fontSize: '1rem',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            Understood
          </button>
        </div>
      </div>
    </div>
  );
};

export default RiskAssessmentModal;