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
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch meetings
        const meetingsData = await meetingsApi.getAll();
        setMeetings(meetingsData);
        
        if (meetingsData.length > 0) {
          setSelectedMeetingId(meetingsData[0]._id);
        }

        // Fetch applications - now returns just the array
        const applicationsData = await applicationsApi.getAllForAdmin();
        setApplications(applicationsData);
      } catch (err: any) {
        console.error('Error fetching data:', err);
        setError(err.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleDelete = async (application: Application) => {
    setApplicationToDelete(application);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!applicationToDelete) return;
    
    try {
      await applicationsApi.delete(applicationToDelete._id);
      setApplications(apps => apps.filter(app => app._id !== applicationToDelete._id));
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

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  return (
    <div className="p-4">
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-xl font-bold">Applications</h2>
        <button
          onClick={() => setShowImportModal(true)}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Import Applications
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {applications.map(app => (
              <tr key={app._id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  {app.firstName} {app.lastName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">{app.email}</td>
                <td className="px-6 py-4 whitespace-nowrap">{formatDate(app.createdAt)}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    app.status === 'complete' ? 'bg-green-100 text-green-800' :
                    app.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {app.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => navigate(`/admin/applications/${app._id}`)}
                    className="text-indigo-600 hover:text-indigo-900 mr-4"
                  >
                    View
                  </button>
                  <button
                    onClick={() => handleDelete(app)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
          const response = await applicationsApi.getAllForAdmin();
          if (response && response.applications) {
            setApplications(response.applications);
          }
          setShowImportModal(false);
        }}
      />
    </div>
  );
} 