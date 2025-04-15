import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { applications as applicationsApi, meetings as meetingsApi } from '../../utils/api';
import DeleteConfirmationModal from './DeleteConfirmationModal';

interface Application {
  _id: string;
  userId: {
    email: string;
  };
  firstName: string;
  lastName: string;
  meeting: {
    _id: string;
    name: string;
  };
  status: string;
}

interface Meeting {
  _id: string;
  name: string;
  isActive: boolean;
}

export default function AdminApplications() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [selectedMeetingId, setSelectedMeetingId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [applicationToDelete, setApplicationToDelete] = useState<Application | null>(null);
  const navigate = useNavigate();

  // Fetch both meetings and applications when component mounts
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch meetings first
        const meetingsData = await meetingsApi.getAll();
        setMeetings(meetingsData);
        
        // Set initial selected meeting
        if (meetingsData.length > 0) {
          setSelectedMeetingId(meetingsData[0]._id);
        }

        // Use the admin-specific endpoint
        const applicationsData = await applicationsApi.getAllForAdmin();
        console.log('Fetched applications:', applicationsData);
        setApplications(applicationsData);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Filter applications based on selected meeting
  const filteredApplications = applications.filter(app => 
    app.meeting && app.meeting._id === selectedMeetingId
  );

  // Calculate statistics for the selected meeting
  const stats = {
    total: filteredApplications.length,
    pending: filteredApplications.filter(app => app.status.toLowerCase() === 'pending').length,
    approved: filteredApplications.filter(app => app.status.toLowerCase() === 'complete').length
  };

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

  // Add this function to render an application row (to avoid code duplication)
  const renderApplicationRow = (app: Application) => (
    <tr key={app._id}>
      <td className="px-6 py-4 text-sm">{app.userId.email}</td>
      <td className="px-6 py-4 text-sm">
        {app.meeting?.name || <span className="text-red-500">No Meeting</span>}
      </td>
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
        <div className="flex gap-2">
          <button
            onClick={() => navigate(`/admin/applications/${app._id}`)}
            className="text-indigo-600 hover:text-indigo-900"
          >
            View Details
          </button>
          <button
            onClick={() => handleDelete(app)}
            className="text-red-600 hover:text-red-900"
          >
            Delete
          </button>
        </div>
      </td>
    </tr>
  );

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  return (
    <>
      {/* Meeting Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {meetings.map(meeting => (
              <button
                key={meeting._id}
                onClick={() => setSelectedMeetingId(meeting._id)}
                className={`${
                  selectedMeetingId === meeting._id
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                {meeting.name}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Statistics Boxes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center gap-4">
            <div className="text-gray-500">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <p className="text-gray-500">Total Applications</p>
              <p className="text-2xl font-bold">{stats.total}</p>
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
              <p className="text-2xl font-bold">{stats.pending}</p>
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
              <p className="text-gray-500">Completed</p>
              <p className="text-2xl font-bold">{stats.approved}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Applications Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold">
            {meetings.find(m => m._id === selectedMeetingId)?.name || 'All'} Applications
          </h2>
        </div>
        
        {loading ? (
          <div className="p-6">Loading...</div>
        ) : error ? (
          <div className="p-6 text-red-600">{error}</div>
        ) : filteredApplications.length === 0 ? (
          <div className="p-6 text-gray-500">No applications found for this meeting.</div>
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
              {filteredApplications.map(app => renderApplicationRow(app))}
            </tbody>
          </table>
        )}
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
    </>
  );
} 