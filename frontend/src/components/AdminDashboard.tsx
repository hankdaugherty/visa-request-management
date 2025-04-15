import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from './Header';

export default function AdminDashboard() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/applications`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch applications');
        }
        
        const data = await response.json();
        setApplications(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, []);

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
      <main className="bg-[#F9FAFB] min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
          
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold">All Applications</h2>
            </div>
            
            {loading ? (
              <div className="p-6">Loading...</div>
            ) : error ? (
              <div className="p-6 text-red-600">{error}</div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">User</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Meeting</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Name</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Status</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {applications.map(app => (
                    <tr key={app._id}>
                      <td className="px-6 py-4 text-sm">{app.userId.email}</td>
                      <td className="px-6 py-4 text-sm">{app.meeting}</td>
                      <td className="px-6 py-4 text-sm">{`${app.firstName} ${app.lastName}`}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                          ${app.status === 'approved' ? 'bg-green-100 text-green-800' :
                            app.status === 'rejected' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'}`}>
                          {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <button
                          onClick={() => navigate(`/admin/applications/${app._id}`)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>
    </>
  );
} 