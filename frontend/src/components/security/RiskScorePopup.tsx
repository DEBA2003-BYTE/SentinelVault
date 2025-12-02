import React from 'react';
import { AlertTriangle, CheckCircle, XCircle, Fingerprint } from 'lucide-react';
import './RiskScorePopup.css';

interface RiskScorePopupProps {
  isOpen: boolean;
  riskScore: number;
  breakdown?: {
    failedAttempts: number;
    gps: number;
    typing: number;
    timeOfDay: number;
    velocity: number;
    newDevice: number;
    otherTotal: number;
  };
  lockReason?: string;
  onContinue: () => void;
  onStartMFA: () => void;
  onClose: () => void;
}

const RiskScorePopup: React.FC<RiskScorePopupProps> = ({
  isOpen,
  riskScore,
  breakdown,
  lockReason,
  onContinue,
  onStartMFA,
  onClose
}) => {
  if (!isOpen) return null;

  // Determine risk level and action
  const getRiskLevel = () => {
    if (riskScore >= 71) return 'blocked';
    if (riskScore >= 41) return 'mfa';
    return 'allowed';
  };

  const riskLevel = getRiskLevel();

  const getRiskColor = () => {
    if (riskScore >= 71) return '#dc2626'; // red
    if (riskScore >= 41) return '#f59e0b'; // amber
    return '#10b981'; // green
  };

  const getRiskIcon = () => {
    if (riskScore >= 71) return <XCircle size={48} />;
    if (riskScore >= 41) return <AlertTriangle size={48} />;
    return <CheckCircle size={48} />;
  };

  const getRiskMessage = () => {
    if (riskScore >= 71) {
      // Check if it's due to failed attempts or admin block
      const isFailedAttempts = breakdown && breakdown.failedAttempts >= 50;
      const isAdminBlock = lockReason && lockReason.includes('administrator');
      
      let description = 'Your account has been temporarily locked due to suspicious activity. Please contact your administrator to regain access.';
      
      if (isFailedAttempts) {
        description = 'Your account has been blocked due to multiple failed login attempts. Please contact your administrator to unblock your account.';
      } else if (isAdminBlock) {
        description = 'You have been blocked. Please contact the administrator to unblock your account.';
      } else if (lockReason) {
        description = `Your account has been blocked: ${lockReason}. Please contact your administrator to unblock your account.`;
      }
      
      return {
        title: 'Access Blocked',
        message: 'You have been blocked',
        description
      };
    }
    if (riskScore >= 41) {
      return {
        title: 'Additional Verification Required',
        message: 'Please provide fingerprint authentication.',
        description: 'We detected unusual activity. For your security, please complete multi-factor authentication to continue.'
      };
    }
    return {
      title: 'Access Granted',
      message: 'ALLOWED',
      description: 'Your login attempt has been verified and approved. Click ENTER to continue to your dashboard.'
    };
  };

  const message = getRiskMessage();

  return (
    <div className="risk-popup-overlay" onClick={riskLevel === 'blocked' ? onClose : undefined}>
      <div className="risk-popup-container" onClick={(e) => e.stopPropagation()}>
        <div className="risk-popup-header" style={{ borderColor: getRiskColor() }}>
          <div className="risk-icon" style={{ color: getRiskColor() }}>
            {getRiskIcon()}
          </div>
          <h2 style={{ color: getRiskColor() }}>{message.title}</h2>
        </div>

        <div className="risk-popup-body">
          <div className="risk-score-display">
            <div className="risk-score-circle" style={{ borderColor: getRiskColor() }}>
              <span className="risk-score-value" style={{ color: getRiskColor() }}>
                {riskScore}
              </span>
              <span className="risk-score-label">Risk Score</span>
            </div>
          </div>

          <div className="risk-message">
            <p className="risk-message-main">{message.message}</p>
            <p className="risk-message-description">{message.description}</p>
          </div>

          {breakdown && (
            <div className="risk-breakdown">
              <h3>Risk Factors</h3>
              <div className="risk-factors">
                {breakdown.failedAttempts > 0 && (
                  <div className="risk-factor">
                    <span className="factor-label">Failed Login Attempts</span>
                    <span className="factor-value">{breakdown.failedAttempts}</span>
                  </div>
                )}
                {breakdown.gps > 0 && (
                  <div className="risk-factor">
                    <span className="factor-label">Location Anomaly</span>
                    <span className="factor-value">{breakdown.gps}</span>
                  </div>
                )}
                {breakdown.typing > 0 && (
                  <div className="risk-factor">
                    <span className="factor-label">Typing Pattern</span>
                    <span className="factor-value">{breakdown.typing}</span>
                  </div>
                )}
                {breakdown.timeOfDay > 0 && (
                  <div className="risk-factor">
                    <span className="factor-label">Unusual Time</span>
                    <span className="factor-value">{breakdown.timeOfDay}</span>
                  </div>
                )}
                {breakdown.velocity > 0 && (
                  <div className="risk-factor">
                    <span className="factor-label">Impossible Travel</span>
                    <span className="factor-value">{breakdown.velocity}</span>
                  </div>
                )}
                {breakdown.newDevice > 0 && (
                  <div className="risk-factor">
                    <span className="factor-label">New Device</span>
                    <span className="factor-value">{breakdown.newDevice}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="risk-popup-footer">
          {riskLevel === 'allowed' && (
            <button className="btn btn-primary btn-large" onClick={onContinue}>
              ENTER
            </button>
          )}
          {riskLevel === 'mfa' && (
            <button className="btn btn-warning btn-large" onClick={onStartMFA}>
              <Fingerprint size={20} style={{ marginRight: '8px' }} />
              Give FingerPrint
            </button>
          )}
          {riskLevel === 'blocked' && (
            <button className="btn btn-secondary btn-large" onClick={onClose}>
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default RiskScorePopup;
