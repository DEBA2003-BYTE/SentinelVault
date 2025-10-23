# Frontend Plan - Risk-Adaptive Cloud Storage

## Tech Stack
- **Framework**: React 19 + TypeScript
- **Build Tool**: Vite
- **Runtime**: Bun
- **Styling**: CSS Modules (simple approach)
- **State Management**: React Context + useState
- **HTTP Client**: Fetch API
- **Routing**: React Router

## Core Components

### Authentication Components
- `LoginForm` - Email/password login with risk score display
- `RegisterForm` - User registration with validation
- `AuthGuard` - Protected route wrapper
- `LogoutButton` - Secure logout with token cleanup

### File Management Components
- `FileUpload` - Drag & drop upload with progress bar
- `FileList` - Grid/list view of user files with metadata
- `FileCard` - Individual file display with actions
- `UploadProgress` - Real-time upload progress indicator
- `FileTypeIcon` - Visual file type indicators

### Dashboard Components
- `UserDashboard` - Main user interface with file overview
- `RiskMeter` - Visual risk score indicator (0-100)
- `QuickStats` - File count, storage used, recent activity
- `RecentActivity` - Latest user actions with timestamps

### Risk & Security Components
- `RiskIndicator` - Color-coded risk level badge
- `SecurityAlert` - High-risk warnings and notifications
- `AccessDenied` - Risk-based access denial messages
- `PolicyTooltip` - Explanation of risk policies

### Admin Components (Admin Users Only)
- `AdminDashboard` - System overview with statistics
- `UserManagement` - User list with block/unblock actions
- `UserCard` - Individual user info with admin controls
- `AuditLogViewer` - Searchable audit trail
- `SystemStats` - Charts and metrics dashboard
- `AdminNavigation` - Admin-specific navigation menu

## Page Structure

```
/
├── /login
├── /register
├── /dashboard
├── /files
├── /admin (admin only)
└── /profile
```

## Key Features

### File Upload Flow
1. User selects files
2. Risk assessment runs in background
3. Progress indicator shows upload status
4. Success/failure notification with risk info

### Access Control Visualization
- Risk meter showing current user risk level
- Color-coded access indicators (green/yellow/red)
- Clear messaging when access is restricted

### Responsive Design
- Mobile-first approach
- Clean, minimal interface
- Focus on usability over complexity

## Component Architecture

### Context Providers
- `AuthContext` - User authentication state
- `FileContext` - File management state
- `RiskContext` - Risk assessment data

### Custom Hooks
```typescript
// Authentication hook
const useAuth = () => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  
  const login = async (email: string, password: string) => {
    const data = await authService.login(email, password);
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('token', data.token);
    return data;
  };
  
  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
  };
  
  return { user, token, login, logout, loading };
};

// File upload hook with progress
const useFileUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  
  const uploadFile = async (file: File, token: string) => {
    setUploading(true);
    setError(null);
    setProgress(0);
    
    try {
      const result = await fileService.uploadFile(file, token, setProgress);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };
  
  return { uploadFile, uploading, progress, error };
};

// Risk assessment hook
const useRiskAssessment = () => {
  const [riskData, setRiskData] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const assessRisk = async (token: string) => {
    setLoading(true);
    try {
      const data = await riskService.getRiskAssessment(token);
      setRiskData(data);
      return data;
    } finally {
      setLoading(false);
    }
  };
  
  const getRiskLevel = (score: number) => {
    if (score <= 30) return 'low';
    if (score <= 60) return 'medium';
    if (score <= 80) return 'high';
    return 'critical';
  };
  
  return { riskData, assessRisk, getRiskLevel, loading };
};

// Admin operations hook
const useAdmin = () => {
  const [users, setUsers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [stats, setStats] = useState(null);
  
  const toggleUserBlock = async (userId: string, blocked: boolean, token: string) => {
    const result = await adminService.toggleUserBlock(userId, blocked, token);
    // Update local state
    setUsers(prev => prev.map(user => 
      user.id === userId ? { ...user, isBlocked: blocked } : user
    ));
    return result;
  };
  
  return { users, auditLogs, stats, toggleUserBlock, setUsers, setAuditLogs, setStats };
};
```

## Implementation Steps

1. **Setup React Router**
   - Configure routes
   - Protected route wrapper
   - Navigation component

2. **Authentication UI**
   - Login/register forms
   - JWT token handling
   - Auto-logout on token expiry

3. **File Management Interface**
   - Upload component with drag & drop
   - File list with download/delete actions
   - Progress indicators

4. **Risk Visualization**
   - Risk meter component
   - Access status indicators
   - Policy explanation tooltips

5. **Admin Interface**
   - User management table
   - Audit log viewer
   - Policy configuration forms

6. **Responsive Styling**
   - Mobile-friendly layouts
   - Consistent design system
   - Loading states and error handling

## API Integration

### Authentication Service
```typescript
// Login with risk assessment
const login = async (email: string, password: string) => {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'Login failed');
  }
  
  return data; // { token, user, riskScore }
};

// Register new user
const register = async (email: string, password: string) => {
  const response = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  return response.json();
};

// Get current user
const getCurrentUser = async (token: string) => {
  const response = await fetch('/api/auth/me', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.json();
};
```

### File Operations
```typescript
// Upload file with progress tracking
const uploadFile = async (file: File, token: string, onProgress?: (progress: number) => void) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const xhr = new XMLHttpRequest();
  
  return new Promise((resolve, reject) => {
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress((e.loaded / e.total) * 100);
      }
    });
    
    xhr.addEventListener('load', () => {
      if (xhr.status === 201) {
        resolve(JSON.parse(xhr.responseText));
      } else {
        reject(new Error('Upload failed'));
      }
    });
    
    xhr.open('POST', '/api/files/upload');
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.send(formData);
  });
};

// Get user files
const getUserFiles = async (token: string) => {
  const response = await fetch('/api/files', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.json();
};

// Download file (get presigned URL)
const downloadFile = async (fileId: string, token: string) => {
  const response = await fetch(`/api/files/${fileId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await response.json();
  
  if (response.ok) {
    // Open download URL in new tab
    window.open(data.downloadUrl, '_blank');
  }
  
  return data;
};

// Delete file
const deleteFile = async (fileId: string, token: string) => {
  const response = await fetch(`/api/files/${fileId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.json();
};
```

### Risk Assessment
```typescript
// Get current risk score
const getRiskAssessment = async (token: string) => {
  const response = await fetch('/api/risk/evaluate', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.json();
};

// Get risk policies
const getRiskPolicies = async (token: string) => {
  const response = await fetch('/api/risk/policies', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.json();
};
```

### Admin Operations
```typescript
// Get all users (admin only)
const getAllUsers = async (token: string, page = 1, limit = 20) => {
  const response = await fetch(`/api/admin/users?page=${page}&limit=${limit}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.json();
};

// Block/unblock user
const toggleUserBlock = async (userId: string, blocked: boolean, token: string) => {
  const response = await fetch(`/api/admin/users/${userId}/block`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ blocked })
  });
  return response.json();
};

// Get audit logs
const getAuditLogs = async (token: string, filters = {}) => {
  const params = new URLSearchParams(filters);
  const response = await fetch(`/api/admin/audit?${params}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.json();
};

// Get system stats
const getSystemStats = async (token: string) => {
  const response = await fetch('/api/admin/stats', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.json();
};
```

## Design System & Styling

### Color Palette
```css
:root {
  /* Primary Colors */
  --color-brand: #10b981;
  --color-brand-hover: #059669;
  --color-brand-light: #d1fae5;
  
  /* Neutral Colors */
  --color-gray-50: #f9fafb;
  --color-gray-100: #f3f4f6;
  --color-gray-200: #e5e7eb;
  --color-gray-300: #d1d5db;
  --color-gray-400: #9ca3af;
  --color-gray-500: #6b7280;
  --color-gray-600: #4b5563;
  --color-gray-700: #374151;
  --color-gray-800: #1f2937;
  --color-gray-900: #111827;
  
  /* Status Colors */
  --color-success: #10b981;
  --color-warning: #f59e0b;
  --color-error: #ef4444;
  --color-info: #3b82f6;
  
  /* Background Colors */
  --color-bg-primary: #ffffff;
  --color-bg-secondary: #f9fafb;
  --color-bg-tertiary: #f3f4f6;
  
  /* Border Colors */
  --color-border: #e5e7eb;
  --color-border-hover: #d1d5db;
}
```

### Typography
```css
/* Font Stack */
--font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;

/* Font Sizes */
--text-xs: 0.75rem;    /* 12px */
--text-sm: 0.875rem;   /* 14px */
--text-base: 1rem;     /* 16px */
--text-lg: 1.125rem;   /* 18px */
--text-xl: 1.25rem;    /* 20px */
--text-2xl: 1.5rem;    /* 24px */
--text-3xl: 1.875rem;  /* 30px */

/* Font Weights */
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

### Spacing System
```css
/* Spacing Scale (rem units) */
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.25rem;   /* 20px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
```

### Component Styles

#### Buttons
```css
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-2) var(--space-4);
  border-radius: 6px;
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-primary {
  background-color: var(--color-brand);
  color: white;
  border-color: var(--color-brand);
}

.btn-primary:hover {
  background-color: var(--color-brand-hover);
}

.btn-secondary {
  background-color: white;
  color: var(--color-gray-700);
  border-color: var(--color-border);
}

.btn-secondary:hover {
  background-color: var(--color-gray-50);
  border-color: var(--color-border-hover);
}
```

#### Cards
```css
.card {
  background-color: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: var(--space-6);
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
}

.card-header {
  margin-bottom: var(--space-4);
  padding-bottom: var(--space-4);
  border-bottom: 1px solid var(--color-border);
}
```

#### Forms
```css
.form-group {
  margin-bottom: var(--space-4);
}

.form-label {
  display: block;
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--color-gray-700);
  margin-bottom: var(--space-2);
}

.form-input {
  width: 100%;
  padding: var(--space-3) var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  font-size: var(--text-sm);
  transition: border-color 0.15s ease;
}

.form-input:focus {
  outline: none;
  border-color: var(--color-brand);
  box-shadow: 0 0 0 3px var(--color-brand-light);
}
```

#### Risk Indicators
```css
.risk-indicator {
  display: inline-flex;
  align-items: center;
  padding: var(--space-1) var(--space-3);
  border-radius: 12px;
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
}

.risk-low {
  background-color: #d1fae5;
  color: #065f46;
}

.risk-medium {
  background-color: #fef3c7;
  color: #92400e;
}

.risk-high {
  background-color: #fee2e2;
  color: #991b1b;
}
```

### Layout Principles
- **Clean whitespace**: Generous spacing between elements
- **Consistent alignment**: Left-align text, center-align actions
- **Subtle shadows**: Minimal elevation for cards and modals
- **Sharp corners**: 6-8px border radius, no excessive rounding
- **Monochromatic approach**: Rely on grays with single brand color
- **Clear hierarchy**: Use font weight and size, not color, for emphasis

### Component Guidelines
- No gradients or fancy effects
- Solid colors only
- Consistent border radius (6-8px)
- Subtle hover states with opacity/color changes
- Focus states with brand color outline
- Loading states with simple spinners or skeleton screens

## Environment Variables
```
VITE_API_URL=http://localhost:3000
VITE_APP_NAME=Cloud Storage Platform
```

## Folder Structure
```
src/
├── components/
│   ├── auth/
│   ├── files/
│   ├── admin/
│   └── common/
├── contexts/
├── hooks/
├── pages/
├── types/
├── utils/
└── styles/
    ├── globals.css
    ├── variables.css
    └── components.css
```