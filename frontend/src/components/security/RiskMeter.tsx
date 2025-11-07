import React from 'react';
import { AlertTriangle, Shield, CheckCircle } from 'lucide-react';

interface RiskMeterProps {
  riskScore: number;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
}

const RiskMeter: React.FC<RiskMeterProps> = ({ 
  riskScore, 
  size = 'medium', 
  showLabel = true 
}) => {
  const getRiskLevel = (score: number) => {
    if (score >= 80) return { level: 'critical', color: '#dc2626', text: 'Critical' };
    if (score >= 60) return { level: 'high', color: '#ea580c', text: 'High' };
    if (score >= 40) return { level: 'medium', color: '#d97706', text: 'Medium' };
    return { level: 'low', color: '#16a34a', text: 'Low' };
  };

  const risk = getRiskLevel(riskScore);
  const circumference = 2 * Math.PI * 45; // radius = 45
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (riskScore / 100) * circumference;

  const sizeClasses = {
    small: 'w-16 h-16',
    medium: 'w-24 h-24',
    large: 'w-32 h-32'
  };

  const getIcon = () => {
    if (riskScore >= 80) return <AlertTriangle className="w-6 h-6" />;
    if (riskScore >= 40) return <Shield className="w-6 h-6" />;
    return <CheckCircle className="w-6 h-6" />;
  };

  return (
    <div className={`risk-meter ${size}`}>
      <div className={`risk-circle ${sizeClasses[size]}`}>
        <svg className="risk-svg" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="8"
          />
          {/* Progress circle */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke={risk.color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            transform="rotate(-90 50 50)"
            className="risk-progress"
          />
        </svg>
        
        <div className="risk-content">
          <div className="risk-icon" style={{ color: risk.color }}>
            {getIcon()}
          </div>
          <div className="risk-score" style={{ color: risk.color }}>
            {riskScore}
          </div>
        </div>
      </div>

      {showLabel && (
        <div className="risk-label">
          <span className="risk-level" style={{ color: risk.color }}>
            {risk.text} Risk
          </span>
          <span className="risk-description">
            {riskScore >= 80 && 'Immediate attention required'}
            {riskScore >= 60 && riskScore < 80 && 'Enhanced security measures active'}
            {riskScore >= 40 && riskScore < 60 && 'Moderate security monitoring'}
            {riskScore < 40 && 'Normal security status'}
          </span>
        </div>
      )}
    </div>
  );
};

export default RiskMeter;