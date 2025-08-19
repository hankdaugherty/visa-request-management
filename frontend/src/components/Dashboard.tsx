import { useState, useEffect, useRef } from 'react';
import { applications as applicationsApi } from '../utils/api';
import { useNavigate } from 'react-router-dom';
import Header from './common/Header';
import ResponsiveTable from './common/ResponsiveTable';
import { createPortal } from 'react-dom';

interface Application {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  status: string;
  createdAt: string;
  meeting: {
    _id: string;
    name: string;
  };
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openActionsMenu, setOpenActionsMenu] = useState<string | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number } | null>(null);
  const buttonRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});

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

  const handleDownloadVisaLetter = async (id: string) => {
    try {
      // Find the application to get the name for the filename
      const application = applications.find(app => app._id === id);
      if (!application) {
        throw new Error('Application not found');
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/applications/${id}/pdf`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to download visa letter');
      }
      
      // Create blob and download with proper naming convention
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      // Use the same naming convention as ApplicationDetails
      a.download = `visa-request-letter-${application.firstName}-${application.lastName}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading visa letter:', error);
      alert('Failed to download visa letter. Please try again.');
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return {
          bgColor: 'bg-yellow-100',
          textColor: 'text-yellow-800',
          icon: '⏳',
        };
      case 'rejected':
        return {
          bgColor: 'bg-red-100',
          textColor: 'text-red-800',
          icon: '✕',
        };
      case 'approved':
        return {
          bgColor: 'bg-green-100',
          textColor: 'text-green-800',
          icon: '✓',
        };
      default:
        return {
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-800',
          icon: '?',
        };
    }
  };

  const getRowStyles = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-50 hover:bg-yellow-100';
      case 'rejected':
        return 'bg-red-50 hover:bg-red-100';
      case 'approved':
        return 'bg-green-50 hover:bg-green-100';
      default:
        return 'bg-white hover:bg-gray-50';
    }
  };

  const toggleActionsMenu = (id: string) => {
    if (openActionsMenu === id) {
      setOpenActionsMenu(null);
      setDropdownPosition(null);
    } else {
      const button = buttonRefs.current[id];
      if (button) {
        const rect = button.getBoundingClientRect();
        setDropdownPosition({
          top: rect.bottom + window.scrollY,
          left: rect.right - 224 // 224px is the width of the dropdown (w-56 = 14rem = 224px)
        });
      }
      setOpenActionsMenu(id);
    }
  };

  const closeActionsMenu = () => {
    setOpenActionsMenu(null);
    setDropdownPosition(null);
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openActionsMenu && !event.target) return;
      
      const target = event.target as Element;
      const isDropdownButton = target.closest('button[ref]');
      const isDropdownMenu = target.closest('.dropdown-menu');
      
      if (!isDropdownButton && !isDropdownMenu) {
        closeActionsMenu();
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [openActionsMenu]);

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
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Welcome Section - Made responsive */}
          <div className="bg-white rounded-lg shadow mb-8 p-4 sm:p-6">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">Welcome to the 3GPP Visa Request Portal</h1>
            <p className="text-sm sm:text-base text-gray-600 mb-2">
              This dashboard helps you manage your visa letter requests for upcoming meetings. You can:
            </p>
            <ul className="list-disc list-inside text-sm sm:text-base text-gray-600 ml-2 sm:ml-4 mb-4">
              <li>Submit new visa letter requests</li>
              <li>Track the status of your existing visa letter requests</li>
              <li>View and update your visa letter request details</li>
            </ul>
            <p className="text-xs text-gray-500 italic">
              Note: This is a separate system from the official <a href="https://portal.3gpp.org/" target="_blank" rel="noopener noreferrer" className="underline">3GPP Portal</a>.
            </p>
            <p className="text-sm sm:text-base text-gray-600">
              To get started, click the "New Application" button in the header to submit a new visa letter request.
            </p>
          </div>

          {/* Applications Table - Made responsive with ResponsiveTable component */}
          <div className="bg-white rounded-lg shadow mb-8">
            <div className="p-4 sm:p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">My Applications</h2>
              <button
                onClick={() => navigate('/applications/new')}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                + New Application
              </button>
            </div>
            
            <ResponsiveTable>
              {loading ? (
                <div className="flex justify-center items-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
              ) : error ? (
                <div className="p-4 sm:p-6 text-center text-red-600 bg-red-50 rounded-lg m-4">
                  <p className="font-medium">{error}</p>
                </div>
              ) : applications.length === 0 ? (
                <EmptyState />
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Meeting</th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="hidden sm:table-cell px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted Date</th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {applications.map(app => (
                      <tr 
                        key={app._id}
                        className={getRowStyles(app.status)}
                      >
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900">
                          {app.meeting?.name || 'Unknown Meeting'}
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                          {`${app.firstName} ${app.lastName}`}
                        </td>
                        <td className="hidden sm:table-cell px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                          {new Date(app.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm">
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusConfig(app.status).bgColor} ${getStatusConfig(app.status).textColor}`}>
                              {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                            </span>
                            {app.status.toLowerCase() === 'approved' && (
                              <span className="text-green-600 text-xs">📄 Visa Letter Available</span>
                            )}
                          </div>
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-right text-xs sm:text-sm">
                          <div className="relative inline-block text-right">
                            <button
                              ref={(el) => buttonRefs.current[app._id] = el}
                              className="inline-flex w-full justify-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleActionsMenu(app._id);
                              }}
                            >
                              Actions
                              <svg className="-mr-1 h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                              </svg>
                            </button>
                            {/* Dropdown menu removed from here - will be rendered via portal */}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </ResponsiveTable>
          </div>
        </div>
      </main>
      
      {/* Portal-based dropdown menu */}
      {openActionsMenu && dropdownPosition && createPortal(
        <div 
          className="fixed z-50 w-56 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none dropdown-menu"
          style={{
            top: dropdownPosition.top,
            left: dropdownPosition.left,
          }}
        >
          <div className="py-1">
            <button
              onClick={() => { handleViewDetails(openActionsMenu); closeActionsMenu(); }}
              className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              View Details
            </button>
            {applications.find(app => app._id === openActionsMenu)?.status.toLowerCase() === 'approved' && (
              <button
                onClick={() => { handleDownloadVisaLetter(openActionsMenu); closeActionsMenu(); }}
                className="flex w-full items-center px-4 py-2 text-sm text-green-700 hover:bg-green-100"
              >
                📄 Download Visa Letter
              </button>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
