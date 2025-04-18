import { useState, useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import Header from '../common/Header';
import { applications as applicationsApi } from '../../utils/api';

interface Application {
  _id: string;
  meeting: {
    _id: string;
    name: string;
  };
  status: string;
}

export default function AdminDashboard() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedMeeting, setSelectedMeeting] = useState('Dallas 2025');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const location = useLocation();

  const meetings = ['Dallas 2025', 'Calgary 2026'];

  // Filter applications based on selected meeting
  const filteredApplications = applications.filter(app => app.meeting === selectedMeeting);

  // Calculate statistics for the selected meeting
  const stats = {
    total: applications.length,
    pending: applications.filter(app => app.status.toLowerCase() === 'pending').length,
    approved: applications.filter(app => app.status.toLowerCase() === 'complete').length
  };

  useEffect(() => {
    const getApplications = async () => {
      try {
        const response = await applicationsApi.getAllForAdmin();
        // Make sure we're setting the applications array, not the whole response
        setApplications(response.applications || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    getApplications();
  }, []);

  // Calculate statistics
  const totalApplications = applications.length;
  const pendingReview = applications.filter(app => app.status.toLowerCase() === 'pending').length;
  const approved = applications.filter(app => app.status.toLowerCase() === 'approved').length;

  console.log('Total:', totalApplications, 'Pending:', pendingReview, 'Approved:', approved); // Log the counts

  const handleEdit = async (appId, field, value) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/applications/${appId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ [field]: value })
      });

      if (!response.ok) {
        throw new Error('Failed to update application');
      }

      const updatedApp = await response.json();
      setApplications((prev) => prev.map(app => app._id === updatedApp._id ? { ...app, [field]: value } : app));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      <Header />
      <div className="bg-white shadow">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:space-x-8 space-y-2 sm:space-y-0 py-4">
            <Link
              to="/admin"
              className={`px-3 py-2 rounded-md text-sm font-medium text-center sm:text-left ${
                location.pathname === '/admin'
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Applications
            </Link>
            <Link
              to="/admin/meetings"
              className={`px-3 py-2 rounded-md text-sm font-medium text-center sm:text-left ${
                location.pathname === '/admin/meetings'
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Manage Meetings
            </Link>
            <Link
              to="/admin/users"
              className={`px-3 py-2 rounded-md text-sm font-medium text-center sm:text-left ${
                location.pathname === '/admin/users'
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Manage Users
            </Link>
          </div>
        </div>
      </div>
      <main className="bg-[#F9FAFB] min-h-screen">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Outlet />
        </div>
      </main>
    </>
  );
} 