import React, { useState, useRef } from 'react';
import { Upload, X, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { fileService } from '../../services/api';
import type { FileItem } from '../../types';
import RiskIndicator from '../common/RiskIndicator';

interface FileUploadProps {
  onUploadComplete: (file: FileItem) => void;
  onCancel: () => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onUploadComplete, onCancel }) => {
  const { token } = useAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [riskScore, setRiskScore] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setError('');
    setSuccess(false);
    setRiskScore(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleUpload = async () => {
    if (!selectedFile || !token) return;

    setUploading(true);
    setError('');
    setProgress(0);

    try {
      const response = await fileService.uploadFile(selectedFile, token, setProgress);
      setSuccess(true);
      setRiskScore(response.riskScore);
      onUploadComplete(response.file);
    } catch (error: any) {
      setError(error.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="card">
      <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 className="card-title">Upload File</h3>
        <button onClick={onCancel} className="btn btn-secondary btn-sm">
          <X size={16} />
        </button>
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: 'var(--space-4)' }}>
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {success && (
        <div className="alert alert-success" style={{ marginBottom: 'var(--space-4)' }}>
          <CheckCircle size={16} />
          File uploaded successfully!
          {riskScore !== null && (
            <div style={{ marginTop: 'var(--space-2)' }}>
              <RiskIndicator score={riskScore} />
            </div>
          )}
        </div>
      )}

      {!selectedFile ? (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          style={{
            border: '2px dashed var(--color-border)',
            borderRadius: '8px',
            padding: 'var(--space-16)',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'border-color 0.15s ease'
          }}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload size={48} style={{ color: 'var(--color-gray-400)', marginBottom: 'var(--space-4)' }} />
          <h4 style={{ marginBottom: 'var(--space-2)' }}>Drop files here or click to browse</h4>
          <p style={{ color: 'var(--color-gray-600)', marginBottom: 0 }}>
            Supports PDF, images, text files, and Word documents (max 100MB)
          </p>
          <input
            ref={fileInputRef}
            type="file"
            onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
            style={{ display: 'none' }}
            accept=".pdf,.jpg,.jpeg,.png,.gif,.txt,.doc,.docx"
          />
        </div>
      ) : (
        <div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-3)',
            padding: 'var(--space-4)',
            backgroundColor: 'var(--color-bg-secondary)',
            borderRadius: '6px',
            marginBottom: 'var(--space-4)'
          }}>
            <Upload size={20} style={{ color: 'var(--color-gray-500)' }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 'var(--font-medium)' }}>{selectedFile.name}</div>
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-gray-600)' }}>
                {formatFileSize(selectedFile.size)}
              </div>
            </div>
            {!uploading && (
              <button
                onClick={() => setSelectedFile(null)}
                className="btn btn-secondary btn-sm"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {uploading && (
            <div style={{ marginBottom: 'var(--space-4)' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 'var(--space-2)'
              }}>
                <span style={{ fontSize: 'var(--text-sm)' }}>Uploading...</span>
                <span style={{ fontSize: 'var(--text-sm)' }}>{Math.round(progress)}%</span>
              </div>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
            <button
              onClick={handleUpload}
              disabled={uploading || success}
              className="btn btn-primary"
            >
              {uploading ? (
                <>
                  <div className="spinner" />
                  Uploading...
                </>
              ) : success ? (
                <>
                  <CheckCircle size={16} />
                  Uploaded
                </>
              ) : (
                <>
                  <Upload size={16} />
                  Upload File
                </>
              )}
            </button>
            <button
              onClick={onCancel}
              disabled={uploading}
              className="btn btn-secondary"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload;