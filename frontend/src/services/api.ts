const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Network error' }));
    throw new ApiError(response.status, error.error || 'Request failed');
  }
  return response.json();
};

export const authService = {
  async login(email: string, password: string) {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    return handleResponse(response);
  },

  async register(email: string, password: string) {
    const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
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
    const response = await fetch(`${API_BASE_URL}/api/files/${fileId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await handleResponse(response);
    
    if (data.downloadUrl) {
      window.open(data.downloadUrl, '_blank');
    }
    
    return data;
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

export { ApiError };