// Simple test to verify modal renders
import React from 'react';

export const TestModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  if (!isOpen) return null;

  console.log('TestModal is rendering!');

  return (
    <div 
      style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'white',
        zIndex: 9999,
        padding: '20px'
      }}
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>Test Modal</h1>
          <button 
            onClick={onClose}
            style={{
              padding: '10px 20px',
              backgroundColor: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            Close
          </button>
        </div>
        <div style={{ 
          backgroundColor: '#f3f4f6', 
          padding: '40px', 
          borderRadius: '12px',
          textAlign: 'center'
        }}>
          <h2 style={{ fontSize: '48px', marginBottom: '20px' }}>✅</h2>
          <p style={{ fontSize: '20px', fontWeight: 'bold' }}>
            Modal is rendering correctly!
          </p>
          <p style={{ marginTop: '10px', color: '#6b7280' }}>
            If you see this, the modal system works.
          </p>
        </div>
      </div>
    </div>
  );
};
