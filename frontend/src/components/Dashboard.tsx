import { useState, useEffect } from 'react';
import { applications as applicationsApi } from '../utils/api';
import { useNavigate } from 'react-router-dom';
import Header from './Header';

interface Application {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  status: string;
  createdAt: string;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const response = await applicationsApi.getAll();
        console.log('Fetched applications:', response);
        setApplications(response);
      } catch (err) {
        console.error('Error fetching applications:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch applications');
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, []);

  const handleViewDetails = (id: string) => {
    navigate(`/applications/${id}`);
  };

  return (
    <>
      <Header />
      <main className="bg-[#F9FAFB] min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-8">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center gap-4">
                <div className="text-gray-500">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-gray-500">Total Applications</p>
                  <p className="text-2xl font-bold">{applications.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center gap-4">
                <div className="text-gray-500">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-gray-500">Pending Review</p>
                  <p className="text-2xl font-bold">
                    {applications.filter(app => app.status === 'pending').length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center gap-4">
                <div className="text-gray-500">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-gray-500">Approved</p>
                  <p className="text-2xl font-bold">
                    {applications.filter(app => app.status === 'approved').length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Applications Table */}
          <div className="bg-white rounded-lg shadow mb-8">
            <div className="p-6">
              <h2 className="text-xl font-semibold">Recent Applications</h2>
            </div>
            <div className="overflow-x-auto">
              {loading ? (
                <div className="p-6 text-center">Loading...</div>
              ) : error ? (
                <div className="p-6 text-center text-red-600">{error}</div>
              ) : applications.length === 0 ? (
                <div className="p-6 text-center text-gray-500">No applications found</div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left text-sm font-medium text-gray-500 px-6 py-3">NAME</th>
                      <th className="text-left text-sm font-medium text-gray-500 px-6 py-3">STATUS</th>
                      <th className="text-left text-sm font-medium text-gray-500 px-6 py-3">SUBMITTED DATE</th>
                      <th className="text-left text-sm font-medium text-gray-500 px-6 py-3">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {applications.map(app => (
                      <tr key={app._id}>
                        <td className="px-6 py-4 text-sm text-gray-900">{`${app.firstName} ${app.lastName}`}</td>
                        <td className="px-6 py-4 text-sm">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                            ${app.status === 'approved' ? 'bg-green-100 text-green-800' :
                              app.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                'bg-yellow-100 text-yellow-800'}`}>
                            {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">{new Date(app.createdAt).toLocaleDateString()}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          <button
                            onClick={() => handleViewDetails(app._id)}
                            className="text-indigo-600 hover:text-indigo-900 font-medium"
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
        </div>
      </main>
    </>
  );
}
