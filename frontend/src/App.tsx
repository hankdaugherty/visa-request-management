import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import ApplicationForm from './components/ApplicationForm';
import ApplicationDetails from './components/ApplicationDetails';
import AdminDashboard from './components/admin/AdminDashboard';
import Register from './components/Register';
import UserManagement from './components/admin/UserManagement';
import MeetingManagement from './components/admin/MeetingManagement';
import AdminApplications from './components/admin/AdminApplications';
import './App.css'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = !!localStorage.getItem('token');
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
}

function AdminRoute({ children }) {
  const isAdmin = localStorage.getItem('userRole') === 'admin';
  return isAdmin ? <>{children}</> : <Navigate to="/" />;
}

function App() {
  return (
    <Router>
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
      </Routes>
    </Router>
  );
}

export default App;
