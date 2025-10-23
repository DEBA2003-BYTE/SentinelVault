import React from 'react';
import { Shield, AlertTriangle, AlertCircle, XCircle } from 'lucide-react';

interface RiskIndicatorProps {
  score: number;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const RiskIndicator: React.FC<RiskIndicatorProps> = ({ 
  score, 
  showLabel = true, 
  size = 'md' 
}) => {
  const getRiskLevel = (score: number) => {
    if (score <= 30) return 'low';
    if (score <= 60) return 'medium';
    if (score <= 80) return 'high';
    return 'critical';
  };

  const getRiskIcon = (level: string) => {
    const iconSize = size === 'sm' ? 12 : size === 'lg' ? 20 : 16;
    
    switch (level) {
      case 'low':
        return <Shield size={iconSize} />;
      case 'medium':
        return <AlertTriangle size={iconSize} />;
      case 'high':
        return <AlertCircle size={iconSize} />;
      case 'critical':
        return <XCircle size={iconSize} />;
      default:
        return <Shield size={iconSize} />;
    }
  };

  const level = getRiskLevel(score);
  const className = `risk-indicator risk-${level}`;

  return (
    <span className={className}>
      {getRiskIcon(level)}
      {showLabel && (
        <>
          Risk: {level.charAt(0).toUpperCase() + level.slice(1)} ({score})
        </>
      )}
    </span>
  );
};

export default RiskIndicator;