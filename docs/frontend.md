
# 🚀 Frontend Plan – Risk-Adaptive Cloud Storage (Enhanced with OPA + ZKP + Rejection Reason System)

---

## 🎯 Objectives

### 1. **Dynamic Risk-Adaptive Access Control (RAdAC)**

Integrate **Open Policy Agent (OPA)** for **policy-as-code** enforcement, dynamically evaluating contextual risk (device, location, user behavior) before granting access.

### 2. **Privacy-Preserving Identity Verification**

Use **Zero-Knowledge Proofs (ZKP)** + **Self-Sovereign Identity (SSI)** to verify user identity securely without revealing sensitive data.

### 3. **Advanced Device Authentication**

Implement comprehensive device fingerprinting with automatic device characteristic detection, location-based authentication, and real-time device recognition status with visual feedback and security recommendations.

### 4. **User Transparency**

When an action is denied, the user **can view a detailed, friendly explanation** (e.g., “location mismatch” or “fingerprint mismatch”) through a **RejectionReasonModal**.

---

## 🧰 Tech Stack

| Layer            | Technology                       |
| ---------------- | -------------------------------- |
| Framework        | React 19 + TypeScript            |
| Build Tool       | Vite                             |
| Runtime          | Bun                              |
| Styling          | CSS Modules                      |
| State Management | React Context + useState         |
| HTTP Client      | Fetch API                        |
| Routing          | React Router                     |
| ZKP Integration  | SnarkJS / Circom                 |
| Policy Engine    | Open Policy Agent (OPA) REST API |
| SSI              | DID-based identity               |
| Visualization    | Recharts or simple CSS gauges    |

---

## 🧩 Core Components

### 🔐 Authentication Components

| Component                      | Purpose                                                                      |
| ------------------------------ | ---------------------------------------------------------------------------- |
| **LoginForm**                  | Email/password + automatic ZKP proof submission, shows risk & policy decision |
| **RegisterForm**               | Register with fingerprint & ZKP proof                                        |
| **AuthGuard**                  | Protects routes with OPA policy checks                                       |
| **LogoutButton**               | Revokes auth token and proof                                                 |
| **ZKPVerifier (new)**          | Generates & submits ZKPs via Circom/SnarkJS                                  |
| **DeviceAuthStatus (new)**     | Shows device recognition status and risk factors                              |
| **IdentityBadge (new)**        | Displays verified DID/SSI identity                                           |
| **RejectionReasonModal (new)** | Shows reason when OPA denies access                                          |
| **ZKMFASetup (new)**           | Multi-factor authentication setup with biometric capture                     |
| **BiometricCapture (new)**     | Face recognition and fingerprint capture interface                           |
| **QuickZKPVerify (new)**       | One-click ZKP verification from dashboard                                     |

---

### 📂 File Management Components

| Component                    | Purpose                                         |
| ---------------------------- | ----------------------------------------------- |
| **FileUpload**               | Upload with OPA pre-check + progress bar        |
| **FileList**                 | Displays files with OPA-enforced visibility     |
| **FileCard**                 | Displays metadata, risk score, and proof status |
| **UploadProgress**           | Real-time visual feedback                       |
| **FileTypeIcon**             | Shows file type symbol                          |
| **PolicyDecisionTag (new)**  | Displays OPA “allow” / “deny” per action        |
| **ZKPProtectedAction (new)** | Requires proof before high-risk actions         |

---

### 📊 Dashboard Components

| Component                   | Purpose                                       |
| --------------------------- | --------------------------------------------- |
| **UserDashboard**           | Overview of files, risk score, and ZKP status |
| **RiskMeter**               | Animated gauge (0–100)                        |
| **QuickStats**              | File count, proof count, recent activity      |
| **RecentActivity**          | Tracks latest operations                      |
| **PolicyDecisionLog (new)** | Displays OPA evaluation results               |
| **ZKPStatusCard (new)**     | Displays last proof state & timestamp         |

---

### 🔒 Risk & Security Components

| Component                   | Purpose                                |
| --------------------------- | -------------------------------------- |
| **RiskIndicator**           | Low/Medium/High/Critical badges        |
| **SecurityAlert**           | Shows real-time security notifications |
| **AccessDenied**            | Displays OPA denial info               |
| **PolicyTooltip**           | Explains active OPA rules              |
| **ContextMonitor (new)**    | Shows location/device/IP               |
| **OPADecisionViewer (new)** | Displays raw OPA JSON decision         |
| **ProofStatusBanner (new)** | Shows ZKP status visually              |

---

### 🧑‍💼 Admin Components

| Component                | Purpose                                    |
| ------------------------ | ------------------------------------------ |
| **AdminDashboard**       | System overview (OPA + ZKP stats)          |
| **UserManagement**       | User table with risk + proof info          |
| **UserCard**             | Displays risk score, proof, OPA compliance |
| **AuditLogViewer**       | Shows access logs with reasons             |
| **SystemStats**          | Charts of ZKP + risk patterns              |
| **PolicyEditor (new)**   | Edit/test OPA Rego rules in UI             |
| **ProofAnalytics (new)** | Analyze proof verification trends          |

---

## 🗺️ Page Structure

```
/
├── /login
├── /register
├── /dashboard
├── /files
├── /proofs          ← ZKP proof management
├── /zkauth          ← Multi-factor authentication setup
├── /policy          ← Policy visualization/editor
├── /admin
└── /profile
```

---

## 🧠 Key Features

### ✅ ZKP Authentication Flow

1. User enters credentials.
2. Browser **automatically** generates ZKP proof using **Circom/SnarkJS** (no checkbox required).
3. Proof sent to `/api/zkp/verify`.
4. On success, user marked verified → low-risk OPA context.

### 🔐 Multi-Factor Authentication Flow

1. User navigates to `/zkauth` page.
2. Selects biometric method (fingerprint or face recognition).
3. **Face Recognition**: Live camera capture → local processing → hash generation.
4. **Fingerprint**: Simulated scanner → biometric capture → hash generation.
5. Biometric hash sent to `/api/zk-mfa/register-secret`.
6. Factor becomes active immediately for enhanced security.

### 🧮 OPA Decision Visualization

* Every sensitive action triggers an OPA policy check.
* Frontend visualizes `allow` / `deny` decision.
* User can **view the exact reason** if denied.

### 📁 File Upload Flow

1. Pre-upload OPA risk check.
2. Proof validation if file sensitive.
3. Real-time progress bar + risk alert.
4. Denials show reason in modal (e.g., *“Location mismatch: registered in Pune, accessed from Delhi”*).

---

## ⚙️ Context Providers

```tsx
<AuthContext>        // Auth + ZKP verification
<FileContext>        // File data & OPA decisions
<RiskContext>        // Risk scoring + metrics
<ZKPContext>         // Proof status & generation
<PolicyContext>      // OPA evaluation results
<ReasonContext>      // Stores rejection reason (new)
```

---

## 🪄 Custom Hooks

### 🧩 useZKP

```tsx
const useZKP = () => {
  const [proofStatus, setProofStatus] = useState(false);
  const [loading, setLoading] = useState(false);

  const generateProof = async (inputs) => {
    setLoading(true);
    const proof = await zkpService.generate(inputs);
    const verified = await zkpService.verify(proof);
    setProofStatus(verified);
    setLoading(false);
    return verified;
  };

  return { proofStatus, generateProof, loading };
};
```

### ⚖️ usePolicy

```tsx
const usePolicy = () => {
  const [decision, setDecision] = useState(null);
  const [reason, setReason] = useState(null);

  const evaluatePolicy = async (context, token) => {
    const res = await policyService.evaluate(context, token);
    setDecision(res.decision);
    setReason(res.reason || null);
    return res;
  };

  return { decision, reason, evaluatePolicy };
};
```

---

## 🪪 New Component – RejectionReasonModal

```tsx
const RejectionReasonModal = ({ reason, onClose }) => {
  if (!reason) return null;
  return (
    <div className="modal">
      <h2>Access Denied</h2>
      <p>{reason.details}</p>
      <div className="reason-details">
        <p><b>Policy:</b> {reason.policy?.description}</p>
        <p><b>Risk Score:</b> {reason.riskScore}</p>
        <p><b>Location:</b> {reason.factors?.location}</p>
        <p><b>Registered:</b> {reason.factors?.registeredLocation}</p>
        <p><b>Fingerprint Match:</b> {reason.factors?.fingerprintMatch ? "Yes" : "No"}</p>
      </div>
      <button onClick={onClose}>Close</button>
    </div>
  );
};
```

---

## 🔗 API Integration (Extended)

### 🔒 ZKP Service

```ts
const zkpService = {
  generate: async (inputs) => {
    const res = await fetch('/api/zkp/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(inputs)
    });
    return res.json();
  },
  verify: async (proof) => {
    const res = await fetch('/api/zkp/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(proof)
    });
    return res.json();
  }
};
```

### 🧩 Policy Service

```ts
const policyService = {
  evaluate: async (context, token) => {
    const res = await fetch('/api/policy/evaluate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(context)
    });
    return res.json(); // includes decision + reason
  },
  getRules: async (token) => {
    const res = await fetch('/api/policy/rules', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return res.json();
  }
};
```

---

## 🌐 Environment Variables

```
VITE_API_URL=http://localhost:3000
VITE_OPA_ENDPOINT=http://localhost:8181/v1/data/policy/evaluate
VITE_ZKP_MODE=browser
VITE_SSI_PROVIDER=did:web
```

---

## 🗂️ Folder Structure

```
src/
├── components/
│   ├── auth/
│   ├── files/
│   ├── admin/
│   ├── zkproofs/        ← new
│   ├── zkauth/          ← new (MFA components)
│   ├── policy/          ← new
│   ├── security/        ← new (RejectionReasonModal, Risk UI)
│   └── common/
├── contexts/
│   ├── AuthContext.tsx
│   ├── FileContext.tsx
│   ├── RiskContext.tsx
│   ├── ZKPContext.tsx
│   ├── PolicyContext.tsx
│   └── ReasonContext.tsx   ← new
├── hooks/
│   ├── useAuth.ts
│   ├── useZKP.ts
│   ├── usePolicy.ts
│   ├── useRiskAssessment.ts
│   └── useRejectionReason.ts ← new
├── pages/
│   ├── Dashboard.tsx
│   ├── Proofs.tsx
│   ├── ZKAuth.tsx       ← new (MFA page)
│   ├── Policy.tsx
│   └── Files.tsx
├── utils/
│   ├── zkpService.ts
│   ├── policyService.ts
│   └── contextUtils.ts
└── styles/
    ├── globals.css
    ├── components.css
    └── variables.css
```

---

## ✅ Final Summary of Additions

| Enhancement                    | Description                         |
| ------------------------------ | ----------------------------------- |
| **OPA Integration**            | Policy evaluation before actions    |
| **ZKP Authentication**         | Proof-based identity verification   |
| **SSI Integration**            | DID-based identity display          |
| **Rejection Reason System**    | Detailed transparency for denials   |
| **Policy Visualization Tools** | Admin & user OPA log viewers        |
| **Context Monitor**            | Real-time location/device tracking  |
| **Proof Analytics + Editor**   | Admin tools for advanced governance |


