import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { format } from 'date-fns';
import { X, MapPin, Check, X as XIcon } from 'lucide-react';

// Fix for default marker icons in Leaflet
// @ts-ignore
delete (L.Icon.Default as any).prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

interface User {
  id: string;
  email: string;
  isBlocked: boolean;
  isAdmin: boolean;
  createdAt: string;
  lastLogin?: string;
  fileCount: number;
  recentLogins: number;
  zkpVerified: boolean;
  deviceFingerprint?: string;
  registeredLocation?: any;
  lastKnownLocation?: any;
  rejectionReasons?: string[];
}

interface Feedback {
  _id: string;
  email: string;
  complaint: string;
  rating: number;
  createdAt: string;
  status?: string;
  priority?: string;
}

interface PolicyDecision {
  policy: string;
  allow: boolean;
  risk_score: number;
  reason: string;
  details?: any;
}

interface AccessLog {
  _id: string;
  userId: string;
  user?: string;
  userEmail?: string;
  action: string;
  timestamp: string;
  allowed: boolean;
  riskScore: number;
  reason?: string;
  ipAddress?: string;
  userAgent?: string;
  deviceFingerprint?: string;
  location?: {
    type?: string;
    coordinates?: [number, number];
    name?: string;
    city?: string;
    country?: string;
  } | string;
  fileId?: {
    originalName?: string;
  };
  zkpVerified?: boolean;
  riskAssessment?: {
    breakdown?: {
      failedAttempts?: number;
      gps?: number;
      typing?: number;
      timeOfDay?: number;
      velocity?: number;
      newDevice?: number;
    };
    policy_results?: {
      device_trust?: PolicyDecision;
      geo_location_anomaly?: PolicyDecision;
      impossible_travel?: PolicyDecision;
      suspicious_ip?: PolicyDecision;
      failed_login_attempts?: PolicyDecision;
      privilege_escalation?: PolicyDecision;
      time_based_access?: PolicyDecision;
      mfa_enforcement?: PolicyDecision;
      behavioral_anomaly?: PolicyDecision;
    };
    weighted_scores?: Record<string, number>;
    details?: Record<string, any>;
  };
}

interface ConfirmationDialog {
  isOpen: boolean;
  type: 'block' | 'unblock' | 'delete';
  user: User | null;
  title: string;
  message: string;
  confirmText: string;
  onConfirm: () => void;
  onCancel: () => void;
}

interface ViewLogModalProps {
  isOpen: boolean;
  log: AccessLog | null;
  onClose: () => void;
}

const ViewLogModal: React.FC<ViewLogModalProps> = ({ isOpen, log, onClose }) => {
  console.log('ViewLogModal render:', { isOpen, hasLog: !!log });
  
  if (!isOpen || !log) {
    console.log('ViewLogModal not showing:', { isOpen, hasLog: !!log });
    return null;
  }
  
  console.log('ViewLogModal rendering with log:', log);

  // RBA Scoring breakdown from rba_scoring.rego
  const rbaBreakdown = log.riskAssessment?.breakdown || {
    failedAttempts: 0,
    gps: 0,
    typing: 0,
    timeOfDay: 0,
    velocity: 0,
    newDevice: 0
  };

  // Create pie chart data for RBA factors
  const rbaChartData = [
    { name: 'Failed Attempts', value: rbaBreakdown.failedAttempts || 0, color: '#EF4444', weight: 50 },
    { name: 'GPS Location', value: rbaBreakdown.gps || 0, color: '#F59E0B', weight: 15 },
    { name: 'Typing Pattern', value: rbaBreakdown.typing || 0, color: '#8B5CF6', weight: 12 },
    { name: 'Time of Day', value: rbaBreakdown.timeOfDay || 0, color: '#3B82F6', weight: 8 },
    { name: 'Velocity/Travel', value: rbaBreakdown.velocity || 0, color: '#EC4899', weight: 10 },
    { name: 'New Device', value: rbaBreakdown.newDevice || 0, color: '#10B981', weight: 5 }
  ].filter(item => item.value > 0); // Only show factors that contributed

  // Extract GPS coordinates from log
  let hasLocation = false;
  let position: [number, number] = [0, 0];
  let locationName = 'Unknown Location';
  
  if (log.location && typeof log.location === 'object' && log.location.coordinates && log.location.coordinates.length === 2) {
    hasLocation = true;
    position = [log.location.coordinates[0], log.location.coordinates[1]];
    locationName = log.location.name || 'Unknown Location';
  } else if (typeof log.location === 'string' && log.location.includes(',')) {
    // Try to parse "lat, lng" format
    const parts = log.location.split(',').map((p: string) => parseFloat(p.trim()));
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      hasLocation = true;
      position = [parts[0], parts[1]];
      locationName = log.location;
    }
  }

  return (
    <div 
      className="fixed inset-0 z-[9999]"
      style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0,
        backgroundColor: '#f9fafb',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Header with Close Button - Fixed at top */}
      <div 
        className="flex-shrink-0 shadow-md"
        style={{ 
          backgroundColor: '#ffffff',
          borderBottom: '2px solid #e5e7eb',
          zIndex: 10
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold" style={{ color: '#111827' }}>
              🔍 Risk Analysis Dashboard
            </h1>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              title="Close"
              style={{ 
                backgroundColor: '#f3f4f6',
                border: '2px solid #e5e7eb'
              }}
            >
              <X size={24} style={{ color: '#374151' }} />
            </button>
          </div>
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div 
        className="flex-1"
        style={{ 
          overflowY: 'auto',
          overflowX: 'hidden',
          backgroundColor: '#f9fafb'
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="space-y-6">
          
            {/* Overall Risk Score Banner */}
            <div 
              className="rounded-lg p-6 shadow-md"
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: '1px solid #e5e7eb'
              }}
            >
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold mb-2" style={{ color: '#ffffff' }}>
                    Overall Risk Score
                  </h2>
                  <p className="text-base mb-1" style={{ color: '#f3f4f6' }}>
                    {log.allowed ? '✅ Access Granted' : '❌ Access Denied'} • {format(new Date(log.timestamp), 'PPpp')}
                  </p>
                  <p className="text-sm" style={{ color: '#e5e7eb' }}>
                    User: {log.userEmail || log.user || 'Unknown'} • Action: {log.action}
                  </p>
                </div>
                <div className="text-center bg-white rounded-lg p-4 shadow-lg">
                  <div 
                    className="text-5xl font-bold mb-1"
                    style={{ 
                      color: log.riskScore > 70 ? '#dc2626' : log.riskScore > 40 ? '#f59e0b' : '#10b981'
                    }}
                  >
                    {log.riskScore}
                  </div>
                  <div className="text-lg font-semibold mb-1" style={{ color: '#374151' }}>
                    {log.riskScore > 70 ? '🔴 High Risk' : log.riskScore > 40 ? '🟡 Medium Risk' : '🟢 Low Risk'}
                  </div>
                  <div className="text-xs" style={{ color: '#6b7280' }}>
                    {log.riskScore <= 40 ? 'Normal Access' : log.riskScore <= 70 ? 'MFA Required' : 'Blocked'}
                  </div>
                </div>
              </div>
            </div>

            {/* Risk Score Dashboard */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left: Risk Score Pie Chart */}
              <div 
                className="p-6 rounded-lg shadow-md"
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e7eb'
                }}
              >
                <h3 className="text-xl font-bold mb-4 text-center" style={{ color: '#111827' }}>
                  Risk Engine Score
                </h3>
                
                {/* Pie Chart showing Risk vs Safe */}
                <div className="h-64 relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Risk', value: log.riskScore },
                          { name: 'Safe', value: 100 - log.riskScore }
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={0}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                        label={false}
                      >
                        <Cell fill={log.riskScore > 70 ? '#ef4444' : log.riskScore > 40 ? '#f59e0b' : '#10b981'} />
                        <Cell fill="#e5e7eb" />
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  
                  {/* Score Display in Center */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <div className="text-5xl font-bold" style={{ color: '#111827' }}>
                      {log.riskScore}
                    </div>
                    <div className="text-base font-semibold mt-1" style={{ color: '#6b7280' }}>
                      Risk Score
                    </div>
                  </div>
                </div>
                
                {/* Score Label */}
                <div className="text-center mt-3">
                  <div className="text-2xl font-bold" style={{ color: '#111827' }}>
                    {log.riskScore}/100
                  </div>
                  <div className="text-base mt-1" style={{ color: '#6b7280' }}>
                    {log.riskScore <= 40 ? 'Low Risk' : log.riskScore <= 70 ? 'Moderate Risk' : 'High Risk'}
                  </div>
                </div>
              </div>

              {/* Right: Risk Factors Distribution */}
              <div 
                className="p-6 rounded-lg shadow-md"
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e7eb'
                }}
              >
                <h3 className="text-xl font-bold mb-4 text-center" style={{ color: '#111827' }}>
                  Risk Factors Distribution
                </h3>
                
                {rbaChartData.length > 0 ? (
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={rbaChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={2}
                          dataKey="value"
                          label={({ value }) => `${value}`}
                          labelLine={false}
                        >
                          {rbaChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => [`${value} points`, 'Risk']} />
                        <Legend 
                          verticalAlign="bottom" 
                          height={36}
                          formatter={(value, entry: any) => `${value} (${entry.payload.value})`}
                          wrapperStyle={{ fontSize: '12px' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-80 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-5xl mb-3">✓</div>
                      <p className="text-lg font-semibold" style={{ color: '#10b981' }}>
                        No Risk Factors Detected
                      </p>
                      <p className="text-sm mt-2" style={{ color: '#6b7280' }}>
                        All security checks passed
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Location Map */}
            <div 
              className="p-6 rounded-lg shadow-md"
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e5e7eb'
              }}
            >
              <h3 className="text-xl font-bold mb-4" style={{ color: '#111827' }}>
                📍 Access Location
              </h3>
              {hasLocation ? (
                <>
                  <div className="h-80 rounded-lg overflow-hidden border border-gray-300 shadow-sm">
                    <MapContainer 
                      center={position} 
                      zoom={13} 
                      style={{ height: '100%', width: '100%' }}
                      zoomControl={true}
                    >
                      <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      />
                      <Marker position={position}>
                        <Popup>
                          <div className="text-sm">
                            <p className="font-semibold">{locationName}</p>
                            <p className="text-gray-600">Lat: {position[0].toFixed(4)}</p>
                            <p className="text-gray-600">Lng: {position[1].toFixed(4)}</p>
                          </div>
                        </Popup>
                      </Marker>
                    </MapContainer>
                  </div>
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-700">
                      {locationName}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Coordinates: {position[0].toFixed(6)}, {position[1].toFixed(6)}
                    </p>
                    {(rbaBreakdown.gps || 0) > 0 && (
                      <p className="text-xs text-orange-600 mt-2">
                        ⚠️ GPS Anomaly: +{rbaBreakdown.gps} risk points
                      </p>
                    )}
                  </div>
                </>
              ) : (
                <div className="h-80 bg-gray-100 rounded-lg flex items-center justify-center">
                  <div className="text-center p-4">
                    <MapPin className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                    <p className="text-gray-500 font-medium">No GPS data available</p>
                    <p className="text-sm text-gray-400 mt-1">Location tracking was not enabled</p>
                  </div>
                </div>
              )}
            </div>

            {/* RBA Factor Details */}
            <div 
              className="p-6 rounded-lg shadow-md"
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e5e7eb'
              }}
            >
              <h3 className="text-xl font-bold mb-4" style={{ color: '#111827' }}>
                🔍 Risk Factor Analysis
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {/* Failed Attempts */}
                <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border-2 border-red-200 dark:border-red-800">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-bold text-red-900 dark:text-red-200">Failed Attempts</h4>
                    <span className="text-lg font-bold text-red-600">{rbaBreakdown.failedAttempts || 0}</span>
                  </div>
                  <div className="w-full bg-red-200 dark:bg-red-800 rounded-full h-2 mb-2">
                    <div 
                      className="bg-red-600 h-2 rounded-full transition-all" 
                      style={{ width: `${((rbaBreakdown.failedAttempts || 0) / 50) * 100}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-red-700 dark:text-red-300">Max: 50 points (10 per attempt)</p>
                </div>

                {/* GPS Location */}
                <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border-2 border-orange-200 dark:border-orange-800">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-bold text-orange-900 dark:text-orange-200">GPS Location</h4>
                    <span className="text-lg font-bold text-orange-600">{rbaBreakdown.gps || 0}</span>
                  </div>
                  <div className="w-full bg-orange-200 dark:bg-orange-800 rounded-full h-2 mb-2">
                    <div 
                      className="bg-orange-600 h-2 rounded-full transition-all" 
                      style={{ width: `${((rbaBreakdown.gps || 0) / 15) * 100}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-orange-700 dark:text-orange-300">Max: 15 points (location anomaly)</p>
                </div>

                {/* Typing Pattern */}
                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border-2 border-purple-200 dark:border-purple-800">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-bold text-purple-900 dark:text-purple-200">Typing Pattern</h4>
                    <span className="text-lg font-bold text-purple-600">{rbaBreakdown.typing || 0}</span>
                  </div>
                  <div className="w-full bg-purple-200 dark:bg-purple-800 rounded-full h-2 mb-2">
                    <div 
                      className="bg-purple-600 h-2 rounded-full transition-all" 
                      style={{ width: `${((rbaBreakdown.typing || 0) / 12) * 100}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-purple-700 dark:text-purple-300">Max: 12 points (keystroke deviation)</p>
                </div>

                {/* Time of Day */}
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-2 border-blue-200 dark:border-blue-800">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-bold text-blue-900 dark:text-blue-200">Time of Day</h4>
                    <span className="text-lg font-bold text-blue-600">{rbaBreakdown.timeOfDay || 0}</span>
                  </div>
                  <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2 mb-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all" 
                      style={{ width: `${((rbaBreakdown.timeOfDay || 0) / 8) * 100}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-blue-700 dark:text-blue-300">Max: 8 points (unusual hours)</p>
                </div>

                {/* Velocity/Travel */}
                <div className="p-4 bg-pink-50 dark:bg-pink-900/20 rounded-lg border-2 border-pink-200 dark:border-pink-800">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-bold text-pink-900 dark:text-pink-200">Velocity/Travel</h4>
                    <span className="text-lg font-bold text-pink-600">{rbaBreakdown.velocity || 0}</span>
                  </div>
                  <div className="w-full bg-pink-200 dark:bg-pink-800 rounded-full h-2 mb-2">
                    <div 
                      className="bg-pink-600 h-2 rounded-full transition-all" 
                      style={{ width: `${((rbaBreakdown.velocity || 0) / 10) * 100}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-pink-700 dark:text-pink-300">Max: 10 points (impossible travel)</p>
                </div>

                {/* New Device */}
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border-2 border-green-200 dark:border-green-800">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-bold text-green-900 dark:text-green-200">New Device</h4>
                    <span className="text-lg font-bold text-green-600">{rbaBreakdown.newDevice || 0}</span>
                  </div>
                  <div className="w-full bg-green-200 dark:bg-green-800 rounded-full h-2 mb-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full transition-all" 
                      style={{ width: `${((rbaBreakdown.newDevice || 0) / 5) * 100}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-green-700 dark:text-green-300">Max: 5 points (unknown device)</p>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div style={{ borderTop: '2px solid #e5e7eb', margin: '2rem 0' }}></div>

            {/* Access Summary Section */}
            <div>
              <h2 className="text-2xl font-bold mb-6" style={{ color: '#111827' }}>
                📋 Access Summary
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div 
                  className="p-6 rounded-lg shadow"
                  style={{
                    backgroundColor: '#ffffff',
                    border: '2px solid #e5e7eb'
                  }}
                >
                  <h4 className="text-sm font-medium mb-3" style={{ color: '#6b7280' }}>👤 User</h4>
                  <p className="text-lg font-bold truncate" style={{ color: '#111827' }}>
                    {log.userEmail || log.user || 'Unknown'}
                  </p>
                </div>

                <div 
                  className="p-6 rounded-lg shadow"
                  style={{
                    backgroundColor: '#ffffff',
                    border: '2px solid #e5e7eb'
                  }}
                >
                  <h4 className="text-sm font-medium mb-3" style={{ color: '#6b7280' }}>⚡ Action</h4>
                  <p className="text-lg font-bold capitalize" style={{ color: '#111827' }}>
                    {log.action.replace(/_/g, ' ')}
                  </p>
                </div>

                <div 
                  className="p-6 rounded-lg shadow"
                  style={{
                    backgroundColor: '#ffffff',
                    border: '2px solid #e5e7eb'
                  }}
                >
                  <h4 className="text-sm font-medium mb-3" style={{ color: '#6b7280' }}>🔒 Status</h4>
                  <div className="flex items-center">
                    {log.allowed ? (
                      <Check className="w-5 h-5 mr-2" style={{ color: '#10b981' }} />
                    ) : (
                      <XIcon className="w-5 h-5 mr-2" style={{ color: '#ef4444' }} />
                    )}
                    <span className="text-lg font-bold" style={{ color: '#111827' }}>
                      {log.allowed ? 'Granted' : 'Denied'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Access Summary Section */}
            <div 
              className="p-6 rounded-lg shadow-md"
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e5e7eb'
              }}
            >
              <h3 className="text-xl font-bold mb-4" style={{ color: '#111827' }}>
                📋 Access Summary
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-gray-50">
                  <h4 className="text-xs font-medium mb-2" style={{ color: '#6b7280' }}>👤 User</h4>
                  <p className="text-base font-bold truncate" style={{ color: '#111827' }}>
                    {log.userEmail || log.user || 'Unknown'}
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-gray-50">
                  <h4 className="text-xs font-medium mb-2" style={{ color: '#6b7280' }}>⚡ Action</h4>
                  <p className="text-base font-bold capitalize" style={{ color: '#111827' }}>
                    {log.action.replace(/_/g, ' ')}
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-gray-50">
                  <h4 className="text-xs font-medium mb-2" style={{ color: '#6b7280' }}>🔒 Status</h4>
                  <div className="flex items-center">
                    {log.allowed ? (
                      <Check className="w-4 h-4 mr-2" style={{ color: '#10b981' }} />
                    ) : (
                      <XIcon className="w-4 h-4 mr-2" style={{ color: '#ef4444' }} />
                    )}
                    <span className="text-base font-bold" style={{ color: '#111827' }}>
                      {log.allowed ? 'Granted' : 'Denied'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Decision Reason */}
            {log.reason && (
              <div 
                className="border-l-4 p-4 rounded-r-lg shadow-sm"
                style={{
                  backgroundColor: '#fef3c7',
                  borderColor: '#f59e0b'
                }}
              >
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="#f59e0b">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-medium" style={{ color: '#92400e' }}>
                      ⚠️ Decision Reason
                    </h4>
                    <p className="text-sm mt-1" style={{ color: '#78350f' }}>
                      {log.reason}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Bottom padding for better scrolling */}
            <div style={{ height: '2rem' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Admin: React.FC = () => {
  const { user, token } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [logs, setLogs] = useState<AccessLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('users');
  const [confirmDialog, setConfirmDialog] = useState<ConfirmationDialog>({
    isOpen: false,
    type: 'block',
    user: null,
    title: '',
    message: '',
    confirmText: '',
    onConfirm: () => {},
    onCancel: () => {}
  });
  const [selectedLog, setSelectedLog] = useState<AccessLog | null>(null);
  const [viewLogModalOpen, setViewLogModalOpen] = useState(false);

  useEffect(() => {
    if (user?.isAdmin && token) {
      fetchUsers();
      fetchFeedback();
      fetchLogs();
    }
  }, [user, token]);

  const fetchUsers = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/admin/users`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const showBlockConfirmation = (targetUser: User, block: boolean) => {
    if (targetUser.isAdmin) {
      alert('Cannot block admin users');
      return;
    }

    setConfirmDialog({
      isOpen: true,
      type: block ? 'block' : 'unblock',
      user: targetUser,
      title: block ? 'Block User' : 'Unblock User',
      message: block 
        ? `Are you sure you want to block ${targetUser.email}? They will not be able to login until unblocked.`
        : `Are you sure you want to unblock ${targetUser.email}? They will be able to login again.`,
      confirmText: block ? 'Block User' : 'Unblock User',
      onConfirm: () => handleBlockUser(targetUser.id, block),
      onCancel: () => setConfirmDialog(prev => ({ ...prev, isOpen: false }))
    });
  };

  const showDeleteConfirmation = (targetUser: User) => {
    if (targetUser.isAdmin) {
      alert('Cannot delete admin users');
      return;
    }

    setConfirmDialog({
      isOpen: true,
      type: 'delete',
      user: targetUser,
      title: 'Delete User',
      message: `Are you sure you want to permanently delete ${targetUser.email}? This action cannot be undone and will delete all their files and data.`,
      confirmText: 'Delete User',
      onConfirm: () => handleDeleteUser(targetUser.id, targetUser.email),
      onCancel: () => setConfirmDialog(prev => ({ ...prev, isOpen: false }))
    });
  };

  const handleBlockUser = async (userId: string, block: boolean) => {
    try {
      console.log('Block/unblock user:', { userId, block });
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/admin/users/${userId}/block`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ blocked: block })
      });

      if (response.ok) {
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        fetchUsers(); // Refresh the user list
      } else {
        const error = await response.json();
        console.error('Failed to update user:', error);
        alert(`Failed to ${block ? 'block' : 'unblock'} user: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error updating user:', error);
      alert(`Error ${block ? 'blocking' : 'unblocking'} user`);
    }
  };

  const handleDeleteUser = async (userId: string, email: string) => {
    try {
      console.log('Deleting user:', { userId, email });
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        fetchUsers(); // Refresh the user list
      } else {
        const error = await response.json();
        console.error('Failed to delete user:', error);
        alert(`Failed to delete user: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Error deleting user');
    }
  };

  const handleViewLog = (log: AccessLog) => {
    setSelectedLog(log);
    setViewLogModalOpen(true);
  };

  const handleCloseLogModal = () => {
    setViewLogModalOpen(false);
    setSelectedLog(null);
  };

  const fetchFeedback = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/feedback/all`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setFeedback(data.feedback || []);
    } catch (error) {
      console.error('Failed to fetch feedback:', error);
    }
  };

  // Note: handleUpdateFeedback available for future feedback management features
  // const handleUpdateFeedback = async (feedbackId: string, updates: any) => {
  //   try {
  //     const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  //     const response = await fetch(`${apiUrl}/api/feedback/${feedbackId}`, {
  //       method: 'PUT',
  //       headers: {
  //         'Content-Type': 'application/json',
  //         'Authorization': `Bearer ${token}`
  //       },
  //       body: JSON.stringify(updates)
  //     });

  //     if (response.ok) {
  //       fetchFeedback(); // Refresh feedback list
  //     } else {
  //       console.error('Failed to update feedback');
  //     }
  //   } catch (error) {
  //     console.error('Error updating feedback:', error);
  //   }
  // };

  const fetchLogs = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/admin/audit`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setLogs(data.logs || []);
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user?.isAdmin) {
    return (
      <div className="container">
        <div className="card">
          <div className="card-content">
            <h2>Access Denied</h2>
            <p>You need admin privileges to access this page.</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container">
        <div className="card">
          <div className="card-content">
            <h2>Loading...</h2>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <h1>Admin Dashboard</h1>
      
      <div className="admin-tabs">
        <button 
          className={`tab-button ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          👥 Registered Users ({users.length})
        </button>
        <button 
          className={`tab-button ${activeTab === 'feedback' ? 'active' : ''}`}
          onClick={() => setActiveTab('feedback')}
        >
          💬 User Feedback ({feedback.length})
        </button>
        <button 
          className={`tab-button ${activeTab === 'logs' ? 'active' : ''}`}
          onClick={() => setActiveTab('logs')}
        >
          📋 Access Logs ({logs.length})
        </button>
      </div>

      {activeTab === 'users' && (
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">User Management</h2>
          </div>
          <div className="card-content">
            <div className="table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Registration Date</th>
                    <th>Last Login</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center">
                        <div className="empty-state">
                          <h3>No users found</h3>
                          <p>No registered users in the system.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    users.map((user) => (
                      <tr key={user.id}>
                        <td>
                          <div>
                            <div className="font-medium">{user.email}</div>
                            {user.isBlocked && (
                              <div className="text-xs text-red-600 font-medium mt-1">
                                🚫 BLOCKED
                              </div>
                            )}
                          </div>
                        </td>
                        <td>
                          <span className={`role ${user.isAdmin ? 'admin' : 'user'}`}>
                            {user.isAdmin ? 'Admin' : 'User'}
                          </span>
                        </td>
                        <td>
                          <span className={`status ${user.isBlocked ? 'blocked' : 'active'}`}>
                            {user.isBlocked ? 'Blocked' : 'Active'}
                          </span>
                        </td>
                        <td>
                          <div className="text-xs">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </div>
                        </td>
                        <td>
                          <div className="text-xs">
                            {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                          </div>
                        </td>
                        <td>
                          <div className="action-buttons">
                            {user.isAdmin ? (
                              <span className="text-xs text-gray-500">Protected</span>
                            ) : (
                              <>
                                <button
                                  className={`btn ${user.isBlocked ? 'btn-success' : 'btn-warning'}`}
                                  onClick={() => showBlockConfirmation(user, !user.isBlocked)}
                                >
                                  {user.isBlocked ? 'Unblock' : 'Block'}
                                </button>
                                <button
                                  className="btn btn-danger"
                                  onClick={() => showDeleteConfirmation(user)}
                                >
                                  Delete
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'feedback' && (
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">User Feedback</h2>
          </div>
          <div className="card-content">
            <div className="feedback-list">
              {feedback.length === 0 ? (
                <div className="empty-state">
                  <h3>No feedback yet</h3>
                  <p>No user feedback has been submitted.</p>
                </div>
              ) : (
                feedback.map((item) => (
                  <div key={item._id} className="feedback-item">
                    <div className="feedback-header">
                      <span className="feedback-rating">
                        {'★'.repeat(item.rating || 5)}{'☆'.repeat(5 - (item.rating || 5))}
                      </span>
                      <span className="feedback-date">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="feedback-message">{item.complaint}</p>
                    <small className="feedback-user">From: {item.email}</small>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'logs' && (
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Access Logs</h2>
          </div>
          <div className="card-content">
            <div className="table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Action</th>
                    <th>User Email</th>
                    <th>Location</th>
                    <th>Risk Score</th>
                    <th>Status</th>
                    <th>Reason</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center">
                        <div className="empty-state">
                          <h3>No access logs found</h3>
                          <p>No access logs available in the system.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr key={log._id}>
                        <td>
                          <div className="text-xs">
                            {new Date(log.timestamp).toLocaleString()}
                          </div>
                        </td>
                        <td>
                          <div className="text-sm font-medium">
                            {log.action}
                          </div>
                        </td>
                        <td>
                          <div className="text-sm">
                            {log.user || 'Unknown'}
                          </div>
                        </td>
                        <td>
                          <div className="text-xs">
                            {log.location ? (
                              typeof log.location === 'string' ? (
                                log.location
                              ) : log.location.coordinates && log.location.coordinates.length === 2 ? (
                                <div>
                                  <div className="font-medium">{log.location.name || 'Location'}</div>
                                  <div className="text-gray-500 dark:text-gray-400">
                                    {log.location.coordinates[0].toFixed(4)}, {log.location.coordinates[1].toFixed(4)}
                                  </div>
                                </div>
                              ) : log.location.name ? (
                                log.location.name
                              ) : (
                                `${log.location.city || 'Unknown'}, ${log.location.country || 'Unknown'}`
                              )
                            ) : '-'}
                          </div>
                        </td>
                        <td>
                          <span className={`risk-score ${log.riskScore > 70 ? 'high' : log.riskScore > 30 ? 'medium' : 'low'}`}>
                            {log.riskScore}
                          </span>
                        </td>
                        <td>
                          <span className={`status ${log.allowed ? 'active' : 'blocked'}`}>
                            {log.allowed ? 'Allowed' : 'Blocked'}
                          </span>
                        </td>
                        <td>
                          <div className="text-xs">
                            {log.reason || '-'}
                          </div>
                        </td>
                        <td>
                          <button
                            onClick={() => handleViewLog(log)}
                            className="btn btn-primary btn-sm"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      {confirmDialog.isOpen && (
        <div className="confirmation-dialog">
          <div className="confirmation-content">
            <div className="confirmation-header">
              <div className={`confirmation-icon ${confirmDialog.type === 'delete' ? 'danger' : 'warning'}`}>
                {confirmDialog.type === 'delete' ? '🗑️' : confirmDialog.type === 'block' ? '🚫' : '✅'}
              </div>
              <div>
                <h3 className="confirmation-title">{confirmDialog.title}</h3>
                <p className="confirmation-message">{confirmDialog.message}</p>
              </div>
            </div>
            
            {confirmDialog.user && (
              <div className="mb-4 p-3 bg-gray-50 rounded border">
                <div className="text-sm">
                  <div className="font-medium">User Details:</div>
                  <div className="mt-1 text-gray-600">
                    <div>Email: {confirmDialog.user.email}</div>
                    <div>Role: {confirmDialog.user.isAdmin ? 'Admin' : 'User'}</div>
                    <div>Files: {confirmDialog.user.fileCount}</div>
                    <div>Status: {confirmDialog.user.isBlocked ? 'Blocked' : 'Active'}</div>
                  </div>
                </div>
              </div>
            )}

            {confirmDialog.type === 'delete' && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
                <div className="text-sm text-red-800">
                  <div className="font-medium mb-1">⚠️ Warning: This action is irreversible!</div>
                  <div>This will permanently delete:</div>
                  <ul className="list-disc list-inside mt-1 text-xs">
                    <li>User account</li>
                    <li>All user's files</li>
                    <li>Device registration</li>
                    <li>ZKP proofs</li>
                  </ul>
                  <div className="mt-1 text-xs">Access logs will be kept for audit purposes.</div>
                </div>
              </div>
            )}

            <div className="confirmation-actions">
              <button
                className="btn btn-secondary"
                onClick={confirmDialog.onCancel}
              >
                Cancel
              </button>
              <button
                className={`btn ${confirmDialog.type === 'delete' ? 'btn-danger' : confirmDialog.type === 'block' ? 'btn-warning' : 'btn-success'}`}
                onClick={confirmDialog.onConfirm}
              >
                {confirmDialog.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Log Modal */}
      <ViewLogModal 
        isOpen={viewLogModalOpen}
        log={selectedLog}
        onClose={handleCloseLogModal}
      />
    </div>
  );
};

export default Admin;