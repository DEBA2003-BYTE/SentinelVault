import { API_BASE_URL } from '../config/api';

class ApiError extends Error {
  status: number;
  
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Network error' }));
    console.error('API Error:', {
      status: response.status,
      statusText: response.statusText,
      error: error
    });
    throw new ApiError(response.status, error.error || error.message || 'Request failed');
  }
  return response.json();
};

export const authService = {
  async login(email: string, password: string, context?: any) {
    const payload = { 
      email, 
      password,
      deviceFingerprint: context?.deviceFingerprint,
      deviceId: context?.deviceId || context?.deviceFingerprint,
      location: context?.location,
      gps: context?.gps,
      localTimestamp: context?.localTimestamp || new Date().toISOString()
    };
    console.log('Login payload:', payload);
    
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return handleResponse(response);
  },

  async loginAdmin(email: string, password: string) {
    // Admin login without device fingerprint or location
    const payload = { 
      email, 
      password
    };
    console.log('Admin login payload:', payload);
    
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return handleResponse(response);
  },

  async register(email: string, password: string, context?: any) {
    const payload = { 
      email, 
      password,
      deviceFingerprint: context?.deviceFingerprint,
      deviceId: context?.deviceId || context?.deviceFingerprint,
      location: context?.location,
      gps: context?.gps,
      localTimestamp: context?.localTimestamp || new Date().toISOString()
    };
    console.log('Register payload:', payload);
    
    const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return handleResponse(response);
  },

  async getCurrentUser(token: string) {
    const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return handleResponse(response);
  },

  async logout(token: string) {
    const response = await fetch(`${API_BASE_URL}/api/auth/logout`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return handleResponse(response);
  }
};

export const fileService = {
  async uploadFile(file: File, token: string, onProgress?: (progress: number) => void) {
    const formData = new FormData();
    formData.append('file', file);

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable && onProgress) {
          onProgress((e.loaded / e.total) * 100);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status === 201) {
          resolve(JSON.parse(xhr.responseText));
        } else {
          const error = JSON.parse(xhr.responseText);
          reject(new ApiError(xhr.status, error.error || 'Upload failed'));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new ApiError(0, 'Network error'));
      });

      xhr.open('POST', `${API_BASE_URL}/api/files/upload`);
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.send(formData);
    });
  },

  async getUserFiles(token: string) {
    const response = await fetch(`${API_BASE_URL}/api/files`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return handleResponse(response);
  },

  async downloadFile(fileId: string, token: string) {
    try {
      // Use backend proxy endpoint to avoid CORS issues
      const response = await fetch(`${API_BASE_URL}/api/files/${fileId}/download`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) {
        throw new Error('Download failed');
      }
      
      // Get the filename from the response headers or use a default
      const contentDisposition = response.headers.get('content-disposition');
      let filename = 'download';
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }
      
      // Get the file content as a blob
      const blob = await response.blob();
      
      // Create a blob URL and trigger download
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      link.style.display = 'none';
      
      // Add to DOM, click, and remove
      document.body.appendChild(link);
      link.click();
      
      // Clean up the blob URL after download starts
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
      }, 100);
      
    } catch (error) {
      console.error('Download failed:', error);
      throw error;
    }
  },

  async shareFile(fileId: string, visibility: 'all' | 'specific' | 'none', sharedWith: string[], token: string) {
    const response = await fetch(`${API_BASE_URL}/api/files/${fileId}/share`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ visibility, sharedWith })
    });
    return handleResponse(response);
  },

  async deleteFile(fileId: string, token: string) {
    const response = await fetch(`${API_BASE_URL}/api/files/${fileId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return handleResponse(response);
  }
};

export const riskService = {
  async getRiskAssessment(token: string) {
    const response = await fetch(`${API_BASE_URL}/api/risk/evaluate`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return handleResponse(response);
  },

  async getRiskPolicies(token: string) {
    const response = await fetch(`${API_BASE_URL}/api/risk/policies`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return handleResponse(response);
  }
};

export const adminService = {
  async getAllUsers(token: string, page = 1, limit = 20) {
    const response = await fetch(`${API_BASE_URL}/api/admin/users?page=${page}&limit=${limit}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return handleResponse(response);
  },

  async toggleUserBlock(userId: string, blocked: boolean, token: string) {
    const response = await fetch(`${API_BASE_URL}/api/admin/users/${userId}/block`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ blocked })
    });
    return handleResponse(response);
  },

  async getAuditLogs(token: string, filters: Record<string, string> = {}) {
    const params = new URLSearchParams(filters);
    const response = await fetch(`${API_BASE_URL}/api/admin/audit?${params}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return handleResponse(response);
  },

  async getSystemStats(token: string) {
    const response = await fetch(`${API_BASE_URL}/api/admin/stats`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return handleResponse(response);
  }
};

export const zkpService = {
  async generateProof(inputs: { secret: string; publicValue: string }, token: string) {
    const response = await fetch(`${API_BASE_URL}/api/zkp/generate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(inputs)
    });
    return handleResponse(response);
  },

  async verifyProof(proof: { proof: string; publicSignals: string[] }, token: string) {
    const response = await fetch(`${API_BASE_URL}/api/zkp/verify`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(proof)
    });
    return handleResponse(response);
  },

  async getStatus(token: string) {
    const response = await fetch(`${API_BASE_URL}/api/zkp/status`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return handleResponse(response);
  },

  async generateIdentityProof(token: string) {
    const response = await fetch(`${API_BASE_URL}/api/zkp/identity`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return handleResponse(response);
  },

  async verifyIdentityProof(proof: { proof: string; publicSignals: string[] }, token: string) {
    const response = await fetch(`${API_BASE_URL}/api/zkp/identity/verify`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(proof)
    });
    return handleResponse(response);
  }
};

export const policyService = {
  async evaluate(context: any, token: string) {
    const response = await fetch(`${API_BASE_URL}/api/policy/evaluate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(context)
    });
    return handleResponse(response);
  },

  async getRules(token: string) {
    const response = await fetch(`${API_BASE_URL}/api/policy/rules`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return handleResponse(response);
  },

  async createRule(rule: { name: string; description: string; policyCode: string }, token: string) {
    const response = await fetch(`${API_BASE_URL}/api/policy/rules`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(rule)
    });
    return handleResponse(response);
  },

  async updateRule(id: string, rule: { name: string; description: string; policyCode: string }, token: string) {
    const response = await fetch(`${API_BASE_URL}/api/policy/rules/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(rule)
    });
    return handleResponse(response);
  },

  async deleteRule(id: string, token: string) {
    const response = await fetch(`${API_BASE_URL}/api/policy/rules/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return handleResponse(response);
  }
};

export { ApiError };