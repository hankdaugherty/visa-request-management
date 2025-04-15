import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import ApplicationForm from './components/ApplicationForm';
import ApplicationDetails from './components/ApplicationDetails';
import AdminDashboard from './components/AdminDashboard';
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
        
        {/* Protected admin routes */}
        <Route path="/admin" element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        } />
        <Route path="/admin/applications/:id" element={
          <AdminRoute>
            <ApplicationDetails isAdmin={true} />
          </AdminRoute>
        } />
      </Routes>
    </Router>
  );
}

export default App;
