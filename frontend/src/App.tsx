import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import ApplicationForm from './components/ApplicationForm';
import ApplicationDetails from './components/ApplicationDetails';
import AdminDashboard from './components/admin/AdminDashboard';
import Register from './components/Register';
import UserManagement from './components/admin/UserManagement';
import MeetingManagement from './components/admin/MeetingManagement';
import AdminApplications from './components/admin/AdminApplications';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import SessionTimeoutModal from './components/common/SessionTimeoutModal';
import { authManager } from './utils/auth';
import './utils/sessionTest'; // Import for development testing
import './App.css'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = authManager.isAuthenticated();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
}

function AdminRoute({ children }) {
  const isAdmin = authManager.getUserRole() === 'admin';
  return isAdmin ? <>{children}</> : <Navigate to="/" />;
}

function AppContent() {
  const navigate = useNavigate();
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [sessionTimeLeft, setSessionTimeLeft] = useState(0);

  useEffect(() => {
    // Set up auth manager callbacks
    authManager.setCallbacks(
      () => {
        // Logout callback
        navigate('/login');
      },
      (timeLeft: number) => {
        // Session timeout warning callback
        setSessionTimeLeft(timeLeft);
        setShowSessionModal(true);
      }
    );

    // Start session monitoring if user is authenticated
    if (authManager.isAuthenticated()) {
      authManager.startSessionMonitoring();
    }

    // Cleanup on unmount
    return () => {
      authManager.stopSessionMonitoring();
    };
  }, [navigate]);

  const handleRefreshSession = () => {
    setShowSessionModal(false);
    // Refresh the page to get a new token
    window.location.reload();
  };

  const handleLogout = () => {
    setShowSessionModal(false);
    authManager.logout();
  };

  return (
    <>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Protected routes */}
        <Route path="/" element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        } />
        <Route path="/applications/new" element={
          <PrivateRoute>
            <ApplicationForm />
          </PrivateRoute>
        } />
        <Route path="/applications/:id" element={
          <PrivateRoute>
            <ApplicationDetails />
          </PrivateRoute>
        } />
        
        {/* Admin routes */}
        <Route path="/admin" element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        }>
          <Route index element={<AdminApplications />} />
          <Route path="meetings" element={<MeetingManagement />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="applications/:id" element={<ApplicationDetails isAdmin={true} />} />
        </Route>

        {/* New routes */}
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
      </Routes>

      <SessionTimeoutModal
        isOpen={showSessionModal}
        timeLeft={sessionTimeLeft}
        onRefresh={handleRefreshSession}
        onLogout={handleLogout}
      />
    </>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
