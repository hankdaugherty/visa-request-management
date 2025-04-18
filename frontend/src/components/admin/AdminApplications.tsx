import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { applications as applicationsApi, meetings as meetingsApi } from '../../utils/api';
import DeleteConfirmationModal from './DeleteConfirmationModal';
import ImportModal from './ImportModal';

interface Application {
  _id: string;
  userId: {
    email: string;
  };
  firstName: string;
  lastName: string;
  email: string;
  applicationDate: string;
  meeting: {
    _id: string;
    name: string;
  };
  status: string;
  createdAt: string;
}

interface Meeting {
  _id: string;
  name: string;
  isActive: boolean;
}

interface PaginatedResponse {
  applications: Application[];
  pagination: {
    total: number;
    page: number;
    pages: number;
  };
}

const ITEMS_PER_PAGE = 10;

export default function AdminApplications() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [selectedMeetingId, setSelectedMeetingId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [applicationToDelete, setApplicationToDelete] = useState<Application | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch meetings first
        const meetingsData = await meetingsApi.getAll();
        console.log('Meetings data:', meetingsData);
        setMeetings(meetingsData);
        
        // Set initial selected meeting
        if (meetingsData.length > 0) {
          setSelectedMeetingId(meetingsData[0]._id);
        }

        // Use the admin-specific endpoint
        const response = await applicationsApi.getAllForAdmin(currentPage);
        console.log('Raw API response:', response);
        
        // Defensive check to ensure we have an array of applications
        const applicationsArray = Array.isArray(response.applications) 
          ? response.applications 
          : [];
        
        console.log('Applications array:', applicationsArray);
        setApplications(applicationsArray);
      } catch (err: any) {
        console.error('Error fetching data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [currentPage]);

  // Add defensive checks to filteredApplications
  const filteredApplications = useMemo(() => {
    // Ensure applications is an array
    if (!Array.isArray(applications)) {
      console.warn('Applications is not an array:', applications);
      return {
        data: [],
        totalPages: 0,
        totalItems: 0
      };
    }

    let filtered = [...applications];
    
    if (selectedMeetingId) {
      filtered = filtered.filter(app => 
        app && app.meeting && app.meeting._id === selectedMeetingId
      );
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(app => 
        app && 
        app.firstName && 
        app.lastName && 
        app.email && 
        (`${app.firstName} ${app.lastName}`.toLowerCase().includes(query) ||
        app.email.toLowerCase().includes(query))
      );
    }

    return {
      data: filtered,
      totalPages: Math.ceil(filtered.length / ITEMS_PER_PAGE),
      totalItems: filtered.length
    };
  }, [applications, selectedMeetingId, searchQuery]);

  // Update stats calculation with defensive checks
  const stats = useMemo(() => ({
    total: Array.isArray(applications) ? applications.length : 0,
    pending: Array.isArray(applications) 
      ? applications.filter(app => app && app.status && app.status.toLowerCase() === 'pending').length 
      : 0,
    approved: Array.isArray(applications) 
      ? applications.filter(app => app && app.status && app.status.toLowerCase() === 'complete').length 
      : 0
  }), [applications]);

  const handleDelete = async (application: Application) => {
    setApplicationToDelete(application);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!applicationToDelete) return;
    
    try {
      await applicationsApi.delete(applicationToDelete._id);
      // Refresh the applications list
      const updatedApplications = applications.filter(app => app._id !== applicationToDelete._id);
      setApplications(updatedApplications);
      setDeleteModalOpen(false);
      setApplicationToDelete(null);
    } catch (err: any) {
      setError(err.message || 'Failed to delete application');
    }
  };

  const getStatusConfig = (status: string) => {
    const configs = {
      complete: {
        bgColor: 'bg-blue-100',
        textColor: 'text-blue-800',
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
      }
    };
    return configs[status.toLowerCase()] || configs.pending;
  };

  const getRowStyles = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-50 hover:bg-yellow-100';
      case 'rejected':
        return 'bg-red-50 hover:bg-red-100';
      case 'complete':
        return 'bg-green-50 hover:bg-green-100';
      default:
        return 'bg-white hover:bg-gray-50';
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return ''; // Handle invalid dates
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const capitalizeStatus = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  // Update the renderApplicationRow function to be more responsive
  const renderApplicationRow = (app: Application) => (
    <tr 
      key={app._id} 
      className={`${getRowStyles(app.status)} transition-colors duration-150 ease-in-out`}
    >
      <td className="px-3 lg:px-6 py-4 whitespace-nowrap text-xs lg:text-sm font-medium text-gray-900">
        {`${app.firstName} ${app.lastName}`}
      </td>
      <td className="hidden lg:table-cell px-3 lg:px-6 py-4 whitespace-nowrap text-xs lg:text-sm text-gray-500">
        {app.email}
      </td>
      <td className="hidden lg:table-cell px-3 lg:px-6 py-4 whitespace-nowrap text-xs lg:text-sm text-gray-500">
        {formatDate(app.createdAt)}
      </td>
      <td className="px-3 lg:px-6 py-4 whitespace-nowrap text-xs lg:text-sm">
        {(() => {
          const config = getStatusConfig(app.status);
          return (
            <span className={`inline-flex items-center px-2 py-0.5 lg:px-2.5 lg:py-0.5 rounded-full text-xs font-medium ${config.bgColor} ${config.textColor}`}>
              <span className="mr-1">{config.icon}</span>
              {capitalizeStatus(app.status)}
            </span>
          );
        })()}
      </td>
      <td className="px-3 lg:px-6 py-4 whitespace-nowrap text-xs lg:text-sm">
        <div className="flex flex-col lg:flex-row justify-end gap-2">
          <button
            onClick={() => navigate(`/admin/applications/${app._id}`)}
            className="inline-flex items-center justify-center px-2 py-1 lg:px-3 lg:py-2 border border-transparent text-xs lg:text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            View Details
          </button>
          <button
            onClick={() => handleDelete(app)}
            className="inline-flex items-center justify-center px-2 py-1 lg:px-3 lg:py-2 border border-transparent text-xs lg:text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            Delete
          </button>
        </div>
      </td>
    </tr>
  );

  // Update the refreshApplications function
  const refreshApplications = async () => {
    try {
      const response: PaginatedResponse = await applicationsApi.getAllForAdmin(currentPage);
      setApplications(response.applications);
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Add pagination controls component
  const PaginationControls = () => {
    const { totalPages } = filteredApplications;
    
    if (totalPages <= 1) return null;

    return (
      <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
        <div className="flex-1 flex justify-between sm:hidden">
          <button
            onClick={() => setCurrentPage(page => Math.max(1, page - 1))}
            disabled={currentPage === 1}
            className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-500"
          >
            Previous
          </button>
          <button
            onClick={() => setCurrentPage(page => Math.min(totalPages, page + 1))}
            disabled={currentPage === totalPages}
            className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-500"
          >
            Next
          </button>
        </div>
        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700">
              Showing{' '}
              <span className="font-medium">
                {((currentPage - 1) * ITEMS_PER_PAGE) + 1}
              </span>
              {' '}-{' '}
              <span className="font-medium">
                {Math.min(currentPage * ITEMS_PER_PAGE, filteredApplications.totalItems)}
              </span>
              {' '}of{' '}
              <span className="font-medium">{filteredApplications.totalItems}</span>
              {' '}results
            </p>
          </div>
          <div>
            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
              <button
                onClick={() => setCurrentPage(page => Math.max(1, page - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100"
              >
                <span className="sr-only">Previous</span>
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </button>
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i + 1}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                    currentPage === i + 1
                      ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                      : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(page => Math.min(totalPages, page + 1))}
                disabled={currentPage === totalPages}
                className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100"
              >
                <span className="sr-only">Next</span>
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </button>
            </nav>
          </div>
        </div>
      </div>
    );
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  return (
    <>
      {/* Meeting Tabs - Made more responsive */}
      <div className="bg-white rounded-lg shadow mb-8">
        <div className="p-4 sm:p-6 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Applications by Meeting</h2>
          <button
            onClick={() => setShowImportModal(true)}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Import Applications
          </button>
        </div>
        <div className="p-3 sm:p-4 overflow-x-auto">
          <nav className="flex space-x-4 sm:space-x-8">
            {meetings.map(meeting => (
              <button
                key={meeting._id}
                onClick={() => setSelectedMeetingId(meeting._id)}
                className={`${
                  selectedMeetingId === meeting._id
                    ? 'text-indigo-600 border-indigo-500'
                    : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-xs sm:text-sm`}
              >
                {meeting.name}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Statistics Boxes - Made responsive grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4 sm:mb-8">
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="text-gray-500">
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <p className="text-sm sm:text-base text-gray-500">Total Applications</p>
              <p className="text-xl sm:text-2xl font-bold">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="text-gray-500">
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm sm:text-base text-gray-500">Pending Review</p>
              <p className="text-xl sm:text-2xl font-bold">{stats.pending}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="text-gray-500">
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm sm:text-base text-gray-500">Completed</p>
              <p className="text-xl sm:text-2xl font-bold">{stats.approved}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Applications Table with Search */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 lg:p-6 border-b border-gray-200">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <h2 className="text-lg lg:text-xl font-semibold text-gray-900">
              {meetings.find(m => m._id === selectedMeetingId)?.name || 'All'} Applications
            </h2>
            
            {/* Search Input */}
            <div className="w-full lg:w-64">
              <label htmlFor="search" className="sr-only">Search applications</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg 
                    className="h-5 w-5 text-gray-400" 
                    xmlns="http://www.w3.org/2000/svg" 
                    viewBox="0 0 20 20" 
                    fill="currentColor" 
                    aria-hidden="true"
                  >
                    <path 
                      fillRule="evenodd" 
                      d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" 
                      clipRule="evenodd" 
                    />
                  </svg>
                </div>
                <input
                  type="text"
                  name="search"
                  id="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Search by name..."
                />
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : error ? (
            <div className="p-4 lg:p-6 text-center text-red-600 bg-red-50 rounded-lg m-4">
              <p className="font-medium">{error}</p>
            </div>
          ) : filteredApplications.data.length === 0 ? (
            <div className="p-4 lg:p-6 text-center text-gray-500">
              {searchQuery 
                ? 'No applications found matching your search.'
                : 'No applications found for this meeting.'}
            </div>
          ) : (
            <>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="hidden lg:table-cell px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="hidden lg:table-cell px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted Date</th>
                    <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-3 lg:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {filteredApplications.data.map(app => renderApplicationRow(app))}
                </tbody>
              </table>
              <PaginationControls />
            </>
          )}
        </div>
      </div>

      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setApplicationToDelete(null);
        }}
        onConfirm={confirmDelete}
        itemName={applicationToDelete ? `${applicationToDelete.firstName} ${applicationToDelete.lastName}` : ''}
      />

      <ImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImportComplete={async () => {
          await refreshApplications();
          setShowImportModal(false);
        }}
      />
    </>
  );
} 