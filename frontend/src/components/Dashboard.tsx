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
  meeting: string;
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

  const getStatusConfig = (status: string) => {
    const configs = {
      approved: {
        bgColor: 'bg-green-100',
        textColor: 'text-green-800',
        icon: '✓',
      },
      rejected: {
        bgColor: 'bg-red-100',
        textColor: 'text-red-800',
        icon: '✕',
      },
      pending: {
        bgColor: 'bg-yellow-100',
        textColor: 'text-yellow-800',
        icon: '⏳',
      },
      complete: {
        bgColor: 'bg-blue-100',
        textColor: 'text-blue-800',
        icon: '✓',
      }
    };
    return configs[status.toLowerCase()] || configs.pending;
  };

  const EmptyState = () => (
    <div className="text-center py-12">
      <div className="mx-auto h-12 w-12 text-gray-400 mb-4 text-4xl">
        📝
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">No applications yet</h3>
      <p className="text-gray-500 mb-6">Get started by creating your first visa application</p>
      <button
        onClick={() => navigate('/applications/new')}
        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        Create New Application
      </button>
    </div>
  );

  return (
    <>
      <Header />
      <main className="bg-[#F9FAFB] min-h-screen">
        <div className="container mx-auto px-4 py-8">
          {/* Welcome Section */}
          <div className="bg-white rounded-lg shadow mb-8 p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Welcome to Visa Request Management</h1>
            <p className="text-gray-600 mb-2">
              This dashboard helps you manage your visa applications for upcoming meetings. You can:
            </p>
            <ul className="list-disc list-inside text-gray-600 ml-4 mb-4">
              <li>Submit new visa applications</li>
              <li>Track the status of your existing applications</li>
              <li>View and update your application details</li>
              <li>Upload required documents</li>
            </ul>
            <p className="text-gray-600">
              To get started, click the "New Application" button in the header to submit a new visa request.
            </p>
          </div>

          {/* Applications Table */}
          <div className="bg-white rounded-lg shadow mb-8">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">My Applications</h2>
            </div>
            <div className="overflow-x-auto">
              {loading ? (
                <div className="flex justify-center items-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
              ) : error ? (
                <div className="p-6 text-center text-red-600 bg-red-50 rounded-lg m-4">
                  <p className="font-medium">{error}</p>
                </div>
              ) : applications.length === 0 ? (
                <EmptyState />
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Meeting</th>
                      <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Name</th>
                      <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Status</th>
                      <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Submitted Date</th>
                      <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {applications.map(app => (
                      <tr 
                        key={app._id}
                        className="hover:bg-gray-50 transition-colors duration-150 ease-in-out"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {app.meeting?.name || 'Unknown Meeting'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {`${app.firstName} ${app.lastName}`}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {(() => {
                            const config = getStatusConfig(app.status);
                            return (
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bgColor} ${config.textColor}`}>
                                <span className="mr-1">{config.icon}</span>
                                {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                              </span>
                            );
                          })()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(app.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                          <button
                            onClick={() => handleViewDetails(app._id)}
                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
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
