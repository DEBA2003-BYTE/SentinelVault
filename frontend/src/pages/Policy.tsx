import React, { useEffect, useState } from 'react';
import { Shield, Plus, Edit, Trash2, Eye, AlertCircle, CheckCircle } from 'lucide-react';
import { usePolicy } from '../contexts/PolicyContext';
import { useAuth } from '../contexts/AuthContext';
import type { PolicyRule } from '../types';

const Policy: React.FC = () => {
  const { rules, loading, getRules, createRule, updateRule, deleteRule, evaluatePolicy } = usePolicy();
  const { isAdmin, deviceContext } = useAuth();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingRule, setEditingRule] = useState<PolicyRule | null>(null);
  const [testResult, setTestResult] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    policyCode: ''
  });

  useEffect(() => {
    if (isAdmin) {
      getRules();
    }
  }, [isAdmin, getRules]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingRule) {
        await updateRule(editingRule.id, formData);
        setEditingRule(null);
      } else {
        await createRule(formData);
        setShowCreateForm(false);
      }
      setFormData({ name: '', description: '', policyCode: '' });
    } catch (error) {
      console.error('Failed to save policy:', error);
    }
  };

  const handleEdit = (rule: PolicyRule) => {
    setEditingRule(rule);
    setFormData({
      name: rule.name,
      description: rule.description,
      policyCode: rule.policyCode
    });
    setShowCreateForm(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this policy?')) {
      try {
        await deleteRule(id);
      } catch (error) {
        console.error('Failed to delete policy:', error);
      }
    }
  };

  const handleTestPolicy = async () => {
    try {
      const context = {
        action: 'test',
        context: {
          deviceFingerprint: deviceContext?.fingerprint,
          location: deviceContext?.location
        }
      };
      const result = await evaluatePolicy(context);
      setTestResult(result);
    } catch (error) {
      console.error('Policy test failed:', error);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', description: '', policyCode: '' });
    setShowCreateForm(false);
    setEditingRule(null);
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="header-content">
          <Shield className="w-8 h-8 text-blue-600" />
          <div>
            <h1>Policy Management</h1>
            <p>Configure and manage Open Policy Agent (OPA) rules</p>
          </div>
        </div>
        
        {isAdmin && (
          <div className="header-actions">
            <button
              onClick={handleTestPolicy}
              className="btn btn-secondary"
            >
              <Eye className="w-4 h-4" />
              Test Policy
            </button>
            <button
              onClick={() => setShowCreateForm(true)}
              className="btn btn-primary"
            >
              <Plus className="w-4 h-4" />
              Create Policy
            </button>
          </div>
        )}
      </div>

      <div className="page-content">
        {!isAdmin ? (
          <div className="card">
            <div className="card-content text-center">
              <AlertCircle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
              <h3>Admin Access Required</h3>
              <p>Policy management is only available to administrators.</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Policy List */}
            <div className="lg:col-span-2">
              {testResult && (
                <div className="card mb-6">
                  <div className="card-header">
                    <h3>Policy Test Result</h3>
                  </div>
                  <div className="card-content">
                    <div className={`test-result ${testResult.allow ? 'success' : 'error'}`}>
                      <div className="result-status">
                        {testResult.allow ? (
                          <CheckCircle className="w-6 h-6 text-green-500" />
                        ) : (
                          <AlertCircle className="w-6 h-6 text-red-500" />
                        )}
                        <span className="result-text">
                          {testResult.allow ? 'Access Allowed' : 'Access Denied'}
                        </span>
                      </div>
                      
                      <div className="result-details">
                        <p><strong>Decision:</strong> {testResult.decision}</p>
                        <p><strong>Risk Score:</strong> {testResult.riskScore}/100</p>
                        {testResult.reason && (
                          <p><strong>Reason:</strong> {testResult.reason}</p>
                        )}
                        {testResult.factors && testResult.factors.length > 0 && (
                          <p><strong>Factors:</strong> {testResult.factors.join(', ')}</p>
                        )}
                      </div>
                    </div>
                    
                    <button
                      onClick={() => setTestResult(null)}
                      className="btn btn-secondary btn-sm mt-4"
                    >
                      Clear Result
                    </button>
                  </div>
                </div>
              )}

              <div className="card">
                <div className="card-header">
                  <h3>Policy Rules</h3>
                </div>
                <div className="card-content">
                  {loading ? (
                    <div className="loading-state">
                      <div className="loading-spinner"></div>
                      <span>Loading policies...</span>
                    </div>
                  ) : rules.length === 0 ? (
                    <div className="empty-state">
                      <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h4>No Policies Found</h4>
                      <p>Create your first policy to get started with access control.</p>
                    </div>
                  ) : (
                    <div className="policy-list">
                      {rules.map((rule) => (
                        <div key={rule.id} className="policy-item">
                          <div className="policy-info">
                            <h4>{rule.name}</h4>
                            <p>{rule.description}</p>
                            <div className="policy-meta">
                              <span>Created: {new Date(rule.createdAt).toLocaleDateString()}</span>
                              {rule.updatedAt && (
                                <span>Updated: {new Date(rule.updatedAt).toLocaleDateString()}</span>
                              )}
                            </div>
                          </div>
                          
                          <div className="policy-actions">
                            <button
                              onClick={() => handleEdit(rule)}
                              className="btn btn-secondary btn-sm"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(rule.id)}
                              className="btn btn-danger btn-sm"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Policy Form */}
            <div className="lg:col-span-1">
              {showCreateForm && (
                <div className="card">
                  <div className="card-header">
                    <h3>{editingRule ? 'Edit Policy' : 'Create Policy'}</h3>
                  </div>
                  <div className="card-content">
                    <form onSubmit={handleSubmit}>
                      <div className="form-group">
                        <label htmlFor="name" className="form-label">Policy Name</label>
                        <input
                          id="name"
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="form-input"
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="description" className="form-label">Description</label>
                        <textarea
                          id="description"
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          className="form-input"
                          rows={3}
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="policyCode" className="form-label">Policy Code (Rego)</label>
                        <textarea
                          id="policyCode"
                          value={formData.policyCode}
                          onChange={(e) => setFormData({ ...formData, policyCode: e.target.value })}
                          className="form-input code-input"
                          rows={10}
                          placeholder="package example&#10;&#10;default allow = false&#10;&#10;allow {&#10;  input.user.verified == true&#10;}"
                          required
                        />
                      </div>

                      <div className="form-actions">
                        <button type="submit" className="btn btn-primary">
                          {editingRule ? 'Update Policy' : 'Create Policy'}
                        </button>
                        <button
                          type="button"
                          onClick={resetForm}
                          className="btn btn-secondary"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              <div className="card">
                <div className="card-header">
                  <h3>Policy Guidelines</h3>
                </div>
                <div className="card-content">
                  <div className="guidelines">
                    <h4>Rego Syntax Tips:</h4>
                    <ul>
                      <li>Use <code>default allow = false</code> for security</li>
                      <li>Access input data with <code>input.user.verified</code></li>
                      <li>Define rules with <code>allow { conditions }</code></li>
                      <li>Use <code>deny_reason["message"]</code> for explanations</li>
                    </ul>
                    
                    <h4>Available Input Fields:</h4>
                    <ul>
                      <li><code>input.user.id</code> - User ID</li>
                      <li><code>input.user.verified</code> - Verification status</li>
                      <li><code>input.user.zkpVerified</code> - ZKP status</li>
                      <li><code>input.riskScore</code> - Current risk score</li>
                      <li><code>input.action</code> - Requested action</li>
                      <li><code>input.location</code> - Current location</li>
                      <li><code>input.deviceFingerprint</code> - Device ID</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Policy;