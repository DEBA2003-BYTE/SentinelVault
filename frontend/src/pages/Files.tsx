import React, { useState, useEffect } from 'react';
import { Upload, Download, Trash2, FileText, Image, File as FileIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { fileService } from '../services/api';
import type { FileItem } from '../types';
import FileUpload from '../components/files/FileUpload';

const Files: React.FC = () => {
  const { token } = useAuth();
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);

  useEffect(() => {
    loadFiles();
  }, [token]);

  const loadFiles = async () => {
    if (!token) return;

    try {
      const response = await fileService.getUserFiles(token);
      setFiles(response.files || []);
    } catch (error) {
      console.error('Failed to load files:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (fileId: string) => {
    if (!token) return;

    try {
      await fileService.downloadFile(fileId, token);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const handleDelete = async (fileId: string) => {
    if (!token || !confirm('Are you sure you want to delete this file?')) return;

    try {
      await fileService.deleteFile(fileId, token);
      setFiles(files.filter(file => file.id !== fileId));
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <Image size={20} />;
    if (mimeType === 'application/pdf') return <FileText size={20} />;
    return <FileIcon size={20} />;
  };

  if (loading) {
    return (
      <div className="page-container">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
          <div className="spinner" style={{ width: '40px', height: '40px' }} />
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: 'var(--space-8)' 
      }}>
        <div>
          <h1>My Files</h1>
          <p style={{ color: 'var(--color-gray-600)', marginBottom: 0 }}>
            Manage your secure cloud storage files
          </p>
        </div>
        <button
          onClick={() => setShowUpload(true)}
          className="btn btn-primary"
        >
          <Upload size={16} />
          Upload File
        </button>
      </div>

      {showUpload && (
        <div style={{ marginBottom: 'var(--space-8)' }}>
          <FileUpload
            onUploadComplete={(file) => {
              setFiles([file, ...files]);
              setShowUpload(false);
            }}
            onCancel={() => setShowUpload(false)}
          />
        </div>
      )}

      {files.length > 0 ? (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Your Files ({files.length})</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {files.map((file, index) => (
              <div
                key={file.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: 'var(--space-4)',
                  borderBottom: index < files.length - 1 ? '1px solid var(--color-border)' : 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                  <div style={{ color: 'var(--color-gray-500)' }}>
                    {getFileIcon(file.mimeType)}
                  </div>
                  <div>
                    <div style={{ fontWeight: 'var(--font-medium)' }}>{file.filename}</div>
                    <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-gray-600)' }}>
                      {formatFileSize(file.size)} • Uploaded {new Date(file.uploadedAt).toLocaleDateString()} • {file.accessCount} downloads
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                  <button
                    onClick={() => handleDownload(file.id)}
                    className="btn btn-secondary btn-sm"
                    title="Download"
                  >
                    <Download size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(file.id)}
                    className="btn btn-danger btn-sm"
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: 'var(--space-16)' }}>
          <Upload size={48} style={{ color: 'var(--color-gray-400)', marginBottom: 'var(--space-4)' }} />
          <h3 style={{ marginBottom: 'var(--space-2)' }}>No files yet</h3>
          <p style={{ color: 'var(--color-gray-600)', marginBottom: 'var(--space-6)' }}>
            Upload your first file to get started with secure cloud storage
          </p>
          <button
            onClick={() => setShowUpload(true)}
            className="btn btn-primary"
          >
            <Upload size={16} />
            Upload Your First File
          </button>
        </div>
      )}
    </div>
  );
};

export default Files;