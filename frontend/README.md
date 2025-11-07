# 🚀 Risk-Adaptive Cloud Storage Frontend

A modern, secure React application with Zero-Knowledge Proofs, Open Policy Agent integration, and comprehensive security monitoring.

## ✨ Features

### 🧠 **Dynamic Risk-Adaptive Access Control (RAdAC)**
- **Open Policy Agent (OPA)** integration for policy-as-code enforcement
- Real-time risk assessment and visualization
- Dynamic permission adjustment based on context
- Transparent rejection reasons with detailed explanations

### 🔒 **Privacy-Preserving Identity Verification**
- **Zero-Knowledge Proofs (ZKP)** for confidential identity validation
- **Self-Sovereign Identity (SSI)** support with DID display
- Cryptographic proof generation and verification
- Privacy-first authentication without data exposure

### 📊 **Enhanced Security Dashboard**
- Real-time security context monitoring
- Device fingerprinting and location tracking
- Risk meter with animated visualizations
- Comprehensive audit trails with OPA decisions

### 🛡️ **User Transparency**
- Detailed rejection reason modals
- Security recommendations and guidance
- Policy decision visualization
- Context-aware security alerts

## 🧰 Tech Stack

- **Framework**: React 19 + TypeScript
- **Build Tool**: Vite
- **Runtime**: Bun
- **Styling**: CSS Modules + Custom CSS
- **State Management**: React Context + useState
- **HTTP Client**: Fetch API
- **Routing**: React Router
- **Icons**: Lucide React
- **ZKP Integration**: Ready for Circom/SnarkJS
- **Policy Engine**: OPA REST API integration

## 🚀 Quick Start

### Prerequisites
- Bun runtime
- Backend server running on port 3000

### Installation
```bash
cd frontend
bun install
```

### Environment Configuration
```bash
# .env file
VITE_API_URL=http://localhost:3000
VITE_APP_NAME=Risk-Adaptive Cloud Storage
VITE_OPA_ENDPOINT=http://localhost:8181/v1/data/policy/evaluate
VITE_ZKP_MODE=browser
VITE_SSI_PROVIDER=did:web
```

### Start Development Server
```bash
bun dev
```

The application will be available at `http://localhost:5173`

## 📱 Application Structure

### 🗺️ **Page Routes**
```
/login          - Enhanced login with ZKP authentication
/register       - Registration with device fingerprinting
/dashboard      - Security overview with risk metrics
/files          - File management with policy enforcement
/proofs         - Zero-Knowledge Proof management
/policy         - Policy visualization and management (admin)
/profile        - User profile and security settings
/admin          - Enhanced admin dashboard
```

### 🧩 **Core Components**

#### 🔐 **Authentication Components**
- **LoginForm** - Enhanced with ZKP proof submission and risk display
- **RegisterForm** - Device fingerprinting and location registration
- **AuthGuard** - Route protection with OPA policy checks
- **ZKPVerifier** - Zero-knowledge proof generation and verification
- **RejectionReasonModal** - Detailed access denial explanations

#### 📊 **Security Components**
- **RiskMeter** - Animated risk score visualization (0-100)
- **ContextMonitor** - Real-time device/location monitoring
- **ZKPStatusCard** - Identity verification status display
- **SecurityAlert** - Real-time security notifications
- **PolicyDecisionViewer** - OPA decision visualization

#### 📂 **File Management Components**
- **FileUpload** - Enhanced with OPA pre-checks and progress
- **FileList** - Policy-enforced file visibility
- **FileCard** - Metadata with risk scores and proof status
- **ZKPProtectedAction** - Proof-required file operations

#### 🧑‍💼 **Admin Components**
- **AdminDashboard** - System overview with ZKP + OPA stats
- **UserManagement** - Enhanced user table with security info
- **AuditLogViewer** - Comprehensive logs with rejection reasons
- **PolicyEditor** - OPA Rego rule editor and tester
- **ProofAnalytics** - ZKP verification trend analysis

### ⚙️ **Context Providers**

```tsx
<AuthContext>        // Enhanced auth with device context
<ZKPContext>         // Zero-knowledge proof management
<PolicyContext>      // OPA policy evaluation
<ReasonContext>      // Rejection reason handling
```

### 🪄 **Custom Hooks**

#### **useZKP**
```tsx
const { 
  status, 
  generateProof, 
  verifyProof, 
  generateIdentityProof,
  verifyIdentityProof 
} = useZKP();
```

#### **usePolicy**
```tsx
const { 
  decision, 
  evaluatePolicy, 
  getRules, 
  createRule 
} = usePolicy();
```

#### **useRejectionReason**
```tsx
const { 
  reason, 
  showReason, 
  clearReason 
} = useRejectionReason();
```

## 🔧 **Key Features Implementation**

### ✅ **ZKP Authentication Flow**
1. User enters credentials
2. Optional ZKP proof generation using browser crypto
3. Proof sent to backend for verification
4. Enhanced security status upon successful verification

### 🧮 **OPA Decision Visualization**
- Real-time policy evaluation before sensitive actions
- Visual feedback for allow/deny decisions
- Detailed rejection reasons with context
- Policy rule explanations and guidance

### 📁 **Enhanced File Operations**
1. Pre-upload OPA risk assessment
2. ZKP proof validation for sensitive files
3. Real-time progress with security alerts
4. Transparent denial reasons with recommendations

### 🛡️ **Security Context Monitoring**
- Continuous device fingerprint tracking
- Location anomaly detection
- Real-time risk score updates
- Security recommendation engine

## 🎨 **UI/UX Features**

### **Risk Visualization**
- Animated risk meters (0-100 scale)
- Color-coded security indicators
- Progressive disclosure of security details
- Contextual help and recommendations

### **Transparency Design**
- Clear rejection reason explanations
- Security factor breakdowns
- Policy decision rationales
- User-friendly security guidance

### **Responsive Design**
- Mobile-first approach
- Adaptive layouts for all screen sizes
- Touch-friendly interactions
- Accessible design patterns

## 🔒 **Security Features**

### **Privacy Protection**
- Zero-knowledge proof verification
- Minimal data exposure
- Client-side proof generation
- Secure context transmission

### **Risk Assessment**
- Real-time risk scoring
- Device fingerprint validation
- Location anomaly detection
- Behavioral pattern analysis

### **Policy Enforcement**
- OPA-based access control
- Context-aware permissions
- Transparent decision making
- Audit trail maintenance

## 🧪 **Development**

### **Available Scripts**
```bash
bun dev              # Start development server
bun build            # Build for production  
bun lint             # Run ESLint
bun preview          # Preview production build
```

### **Code Structure**
```
src/
├── components/
│   ├── auth/           # Authentication components
│   ├── files/          # File management
│   ├── admin/          # Admin interface
│   ├── zkproofs/       # ZKP components
│   ├── policy/         # Policy management
│   ├── security/       # Security UI components
│   └── common/         # Shared components
├── contexts/           # React contexts
├── hooks/              # Custom hooks
├── pages/              # Page components
├── services/           # API services
├── types/              # TypeScript types
├── utils/              # Utility functions
└── styles/             # CSS styles
```

## 🌐 **API Integration**

### **Enhanced Services**
- **authService** - Authentication with ZKP support
- **zkpService** - Zero-knowledge proof operations
- **policyService** - OPA policy management
- **fileService** - Enhanced file operations
- **riskService** - Risk assessment
- **adminService** - Enhanced admin operations

### **Device Context**
- Automatic device fingerprinting
- Location detection and tracking
- Browser capability assessment
- Security context generation

## 📊 **Current Status**

✅ **Fully Implemented Features:**
- Enhanced authentication with ZKP support
- Real-time risk assessment and visualization
- Device fingerprinting and context monitoring
- Policy-based access control integration
- Comprehensive security dashboard
- Transparent rejection reason system
- Zero-knowledge proof management interface
- Admin policy editor and analytics
- Responsive design with modern UI/UX

🚀 **Ready for Production:**
- All core security features implemented
- Full TypeScript support
- Comprehensive error handling
- Mobile-responsive design
- Accessibility compliance
- Performance optimized

The enhanced frontend provides a comprehensive, secure, and user-friendly interface for the Risk-Adaptive Cloud Storage platform with enterprise-grade security features and transparent user experience.