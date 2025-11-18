import { useState, useEffect } from 'react';
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
  startDate: string;
}

interface PaginatedResponse {
  applications: Application[];
  pagination: {
    total: number;
    page: number;
    pages: number;
  };
}

export default function AdminApplications() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [selectedMeetingId, setSelectedMeetingId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [applicationToDelete, setApplicationToDelete] = useState<Application | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState<'date' | 'status'>('status');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const itemsPerPage = 10;
  const navigate = useNavigate();
  const [userHasManuallySelected, setUserHasManuallySelected] = useState(false);
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [openActionsMenu, setOpenActionsMenu] = useState<string | null>(null);

  // Fetch meetings on mount
  useEffect(() => {
    const fetchMeetings = async () => {
      try {
        const meetingsData = await meetingsApi.getAll();
        setMeetings(meetingsData);
        
        if (meetingsData.length > 0 && !selectedMeetingId) {
          // Auto-select the next upcoming meeting
          const now = new Date();
          const upcomingMeetings = meetingsData
            .filter(meeting => meeting.isActive && new Date(meeting.startDate) > now)
            .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
          
          if (upcomingMeetings.length > 0) {
            // Select the next upcoming meeting
            setSelectedMeetingId(upcomingMeetings[0]._id);
          } else {
            // If no upcoming meetings, select the most recent active meeting
            const activeMeetings = meetingsData
              .filter(meeting => meeting.isActive)
              .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
            
            if (activeMeetings.length > 0) {
              setSelectedMeetingId(activeMeetings[0]._id);
            } else if (meetingsData.length > 0) {
              // Fallback to first meeting if no active meetings
              setSelectedMeetingId(meetingsData[0]._id);
            }
          }
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load meetings');
      }
    };
    fetchMeetings();
    // eslint-disable-next-line
  }, []);

  // Fetch applications when filters change
  useEffect(() => {
    if (!selectedMeetingId) return;
    const fetchApplications = async () => {
      try {
        setLoading(true);
        let backendSortBy = sortBy === 'date' ? 'createdAt' : 'status';
        const response = await applicationsApi.getAllForAdmin(
          currentPage,
          selectedMeetingId,
          backendSortBy,
          sortDirection
        );
        setApplications(response.applications);
        setTotalPages(response.pagination.pages);
      } catch (err: any) {
        setError(err.message || 'Failed to load applications');
      } finally {
        setLoading(false);
      }
    };
    fetchApplications();
  }, [selectedMeetingId, currentPage, sortBy, sortDirection]);

  // Fetch statistics when meeting changes
  useEffect(() => {
    if (!selectedMeetingId) return;
    const fetchStats = async () => {
      try {
        const statsData = await applicationsApi.getStats(selectedMeetingId);
        setStats(statsData);
      } catch (err: any) {
        console.error('Failed to load statistics:', err);
      }
    };
    fetchStats();
  }, [selectedMeetingId]);

  // Reset to page 1 when meeting or sort changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedMeetingId, sortBy, sortDirection]);

  const handleDelete = async (application: Application) => {
    setApplicationToDelete(application);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!applicationToDelete) return;
    
    try {
      await applicationsApi.delete(applicationToDelete._id);
      setApplications(apps => apps.filter(app => app._id !== applicationToDelete._id));
      
      // Refresh statistics after deletion
      if (selectedMeetingId) {
        const statsData = await applicationsApi.getStats(selectedMeetingId);
        setStats(statsData);
      }
      
      setDeleteModalOpen(false);
      setApplicationToDelete(null);
    } catch (err: any) {
      setError(err.message || 'Failed to delete application');
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString();
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

  const getStatusBadgeStyles = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Sort meetings by startDate (chronological order) and filter out inactive meetings
  const sortedMeetings = [...meetings]
    .filter(meeting => meeting.isActive)
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

  // Find the next upcoming meeting for visual indication
  const now = new Date();
  const nextUpcomingMeeting = sortedMeetings.find(meeting => new Date(meeting.startDate) > now);

  // Only show auto-selection indicators if the user hasn't manually selected a meeting
  const isAutoSelected = !userHasManuallySelected && nextUpcomingMeeting && selectedMeetingId === nextUpcomingMeeting._id;

  // Filter applications based on search term
  const filteredApplications = applications.filter(app => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    const fullName = `${app.firstName} ${app.lastName}`.toLowerCase();
    const email = app.email.toLowerCase();
    
    return fullName.includes(searchLower) || email.includes(searchLower);
  });

  const handleDownloadPDF = async (application: Application) => {
    try {
      // Use VITE_API_URL if available, otherwise fallback to localhost:5000
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const url = `${baseUrl}/api/applications/${application._id}/pdf`;
      const link = document.createElement('a');
      link.href = url;
      link.download = `visa-request-letter-${application.firstName}-${application.lastName}.pdf`;
      
      // Add authorization header
      const token = localStorage.getItem('token');
      if (token) {
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const blob = await response.blob();
          const downloadUrl = window.URL.createObjectURL(blob);
          link.href = downloadUrl;
          link.click();
          window.URL.revokeObjectURL(downloadUrl);
        } else {
          throw new Error('Failed to download PDF');
        }
      }
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Failed to download PDF. Please try again.');
    }
  };

  const toggleActionsMenu = (id: string) => {
    setOpenActionsMenu(openActionsMenu === id ? null : id);
  };

  const closeActionsMenu = () => {
    setOpenActionsMenu(null);
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => closeActionsMenu();
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  if (loading) return <div className="p-4">Loading...</div>;
  if (error) return <div className="p-4 text-red-600">{error}</div>;

  return (
    <div className="p-4">
      {/* Stats Boxes */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-indigo-100 text-indigo-600">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-gray-500">Total Applications</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-gray-500">Pending Review</p>
              <p className="text-2xl font-bold">{stats.pending}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-gray-500">Approved</p>
              <p className="text-2xl font-bold">{stats.approved}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Meeting Tabs */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Applications by Meeting</h2>
          {isAutoSelected && (
            <p className="text-sm text-gray-600 mt-1">
              Auto-selected: <span className="font-medium text-green-600">{nextUpcomingMeeting.name}</span> 
              (starts {new Date(nextUpcomingMeeting.startDate).toLocaleDateString()})
            </p>
          )}
        </div>
        <div className="p-4 overflow-x-auto">
          <nav className="flex space-x-4">
            {sortedMeetings.map(meeting => {
              const isNextUpcoming = nextUpcomingMeeting && meeting._id === nextUpcomingMeeting._id;
              const isSelected = selectedMeetingId === meeting._id;
              
              return (
                <button
                  key={meeting._id}
                  onClick={() => {
                    setSelectedMeetingId(meeting._id);
                    setUserHasManuallySelected(true); // Mark that user has manually selected
                  }}
                  className={`${
                    isSelected
                      ? 'text-indigo-600 border-indigo-500'
                      : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm relative`}
                >
                  {meeting.name}
                  {isAutoSelected && isNextUpcoming && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full"></span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      <div className="mb-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Applications</h1>
        <div className="flex gap-2">
          <button
            onClick={async () => {
              if (!selectedMeetingId) {
                alert('Please select a meeting first');
                return;
              }
              try {
                await applicationsApi.export(selectedMeetingId);
              } catch (err: any) {
                alert(err.message || 'Failed to export applications');
              }
            }}
            disabled={!selectedMeetingId}
            className="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export Applications
          </button>
          <button
            onClick={() => setShowImportModal(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            Import Applications
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>
        {searchTerm && (
          <p className="mt-2 text-sm text-gray-600">
            Showing {filteredApplications.length} of {applications.length} applications for "{searchTerm}"
          </p>
        )}
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer select-none"
                onClick={() => {
                  if (sortBy === 'date') setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                  setSortBy('date');
                }}
              >
                Date {sortBy === 'date' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer select-none"
                onClick={() => {
                  if (sortBy === 'status') setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                  setSortBy('status');
                }}
              >
                Status {sortBy === 'status' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredApplications.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-gray-500">
                  {searchTerm ? 'No applications found matching your search.' : 'No applications found.'}
                </td>
              </tr>
            ) : (
              filteredApplications.map(app => (
                <tr key={app._id} className={getRowStyles(app.status)}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {app.firstName} {app.lastName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {app.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(app.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeStyles(app.status)}`}>
                      {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="relative inline-block text-right">
                      <button
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
                      {openActionsMenu === app._id && (
                        <div className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                          <div className="py-1">
                            <button
                              onClick={() => { navigate(`/admin/applications/${app._id}`); closeActionsMenu(); }}
                              className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                              View
                            </button>
                            {app.status.toLowerCase() === 'approved' && (
                              <button
                                onClick={() => { handleDownloadPDF(app); closeActionsMenu(); }}
                                className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              >
                                Download PDF
                              </button>
                            )}
                            <button
                              onClick={() => { handleDelete(app); closeActionsMenu(); }}
                              className="flex w-full items-center px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 rounded-lg shadow">
        <div className="flex-1 flex justify-between sm:hidden">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-500"
          >
            Previous
          </button>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-500"
          >
            Next
          </button>
        </div>
        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700">
              Page <span className="font-medium">{currentPage}</span> of{' '}
              <span className="font-medium">{totalPages}</span>
            </p>
          </div>
          <div>
            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100"
              >
                Previous
              </button>
              
              {/* Smart pagination with ellipsis */}
              {(() => {
                const pages = [];
                const maxVisiblePages = 7; // Show max 7 page numbers
                const halfVisible = Math.floor(maxVisiblePages / 2);
                
                if (totalPages <= maxVisiblePages) {
                  // Show all pages if total is small
                  for (let i = 1; i <= totalPages; i++) {
                    pages.push(
                      <button
                        key={i}
                        onClick={() => setCurrentPage(i)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          currentPage === i
                            ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {i}
                      </button>
                    );
                  }
                } else {
                  // Show smart pagination with ellipsis
                  let startPage = Math.max(1, currentPage - halfVisible);
                  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
                  
                  // Adjust if we're near the end
                  if (endPage - startPage < maxVisiblePages - 1) {
                    startPage = Math.max(1, endPage - maxVisiblePages + 1);
                  }
                  
                  // Always show page 1
                  if (startPage > 1) {
                    pages.push(
                      <button
                        key={1}
                        onClick={() => setCurrentPage(1)}
                        className="relative inline-flex items-center px-4 py-2 border text-sm font-medium bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                      >
                        1
                      </button>
                    );
                    
                    if (startPage > 2) {
                      pages.push(
                        <span key="ellipsis1" className="relative inline-flex items-center px-4 py-2 border text-sm font-medium bg-white border-gray-300 text-gray-500">
                          ...
                        </span>
                      );
                    }
                  }
                  
                  // Show visible pages
                  for (let i = startPage; i <= endPage; i++) {
                    if (i === 1 && startPage > 1) continue; // Skip if already added
                    pages.push(
                      <button
                        key={i}
                        onClick={() => setCurrentPage(i)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          currentPage === i
                            ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {i}
                      </button>
                    );
                  }
                  
                  // Always show last page
                  if (endPage < totalPages) {
                    if (endPage < totalPages - 1) {
                      pages.push(
                        <span key="ellipsis2" className="relative inline-flex items-center px-4 py-2 border text-sm font-medium bg-white border-gray-300 text-gray-500">
                          ...
                        </span>
                      );
                    }
                    
                    pages.push(
                      <button
                        key={totalPages}
                        onClick={() => setCurrentPage(totalPages)}
                        className="relative inline-flex items-center px-4 py-2 border text-sm font-medium bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                      >
                        {totalPages}
                      </button>
                    );
                  }
                }
                
                return pages;
              })()}
              
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100"
              >
                Next
              </button>
            </nav>
          </div>
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
          // Refresh both applications and statistics
          const response = await applicationsApi.getAllForAdmin(currentPage, selectedMeetingId, sortBy === 'date' ? 'createdAt' : 'status', sortDirection);
          if (response && response.applications) {
            setApplications(response.applications);
          }
          
          // Refresh statistics
          if (selectedMeetingId) {
            const statsData = await applicationsApi.getStats(selectedMeetingId);
            setStats(statsData);
          }
        }}
      />
    </div>
  );
} 