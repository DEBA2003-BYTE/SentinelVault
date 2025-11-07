import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ZKPProvider } from './contexts/ZKPContext';
import { PolicyProvider } from './contexts/PolicyContext';
import { ReasonProvider } from './contexts/ReasonContext';
import Layout from './components/common/Layout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AuthTabs from './components/auth/AuthTabs';
import RegisterTabs from './components/auth/RegisterTabs';
import AdminLoginForm from './components/auth/AdminLoginForm';
import Dashboard from './pages/Dashboard';
import Files from './pages/Files';
import AdminPage from './pages/Admin';
import Proofs from './pages/Proofs.tsx';
import Policy from './pages/Policy.tsx';
import Profile from './pages/Profile.tsx';
import About from './pages/About';
import Feedback from './pages/Feedback';
import ZKAuth from './pages/ZKAuth';
import './styles/globals.css';
import './styles/components.css';

function App() {
  return (
    <AuthProvider>
      <ZKPProvider>
        <PolicyProvider>
          <ReasonProvider>
            <Router>
              <Layout>
                <Routes>
                  <Route path="/login" element={<AuthTabs />} />
                  <Route path="/admin-login" element={<AdminLoginForm />} />
                  <Route path="/register" element={<RegisterTabs />} />
                  <Route
                    path="/dashboard"
                    element={
                      <ProtectedRoute>
                        <Dashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/files"
                    element={
                      <ProtectedRoute>
                        <Files />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/proofs"
                    element={
                      <ProtectedRoute>
                        <Proofs />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/policy"
                    element={
                      <ProtectedRoute>
                        <Policy />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/profile"
                    element={
                      <ProtectedRoute>
                        <Profile />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin"
                    element={
                      <ProtectedRoute requireAdmin>
                        <AdminPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="/about" element={<About />} />
                  <Route path="/zk-auth" element={<ZKAuth />} />
                  <Route
                    path="/feedback"
                    element={
                      <ProtectedRoute>
                        <Feedback />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </Layout>
            </Router>
          </ReasonProvider>
        </PolicyProvider>
      </ZKPProvider>
    </AuthProvider>
  );
}

export default App;
