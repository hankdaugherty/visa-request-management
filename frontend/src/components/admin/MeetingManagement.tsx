import React, { useState, useEffect } from 'react';
import { meetings } from '../../utils/api';
import { Modal } from '../common/Modal';
import DeleteConfirmationModal from './DeleteConfirmationModal';

interface Meeting {
  _id: string;
  name: string;
  startDate: string;
  endDate: string;
  location: string;
  isActive: boolean;
}

export default function MeetingManagement() {
  const [meetingsList, setMeetingsList] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [meetingToDelete, setMeetingToDelete] = useState<Meeting | null>(null);
  
  const initialFormState = {
    name: '',
    startDate: '',
    endDate: '',
    location: '',
    isActive: true
  };
  
  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    fetchMeetings();
  }, []);

  const fetchMeetings = async () => {
    try {
      const data = await meetings.getAll();
      setMeetingsList(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load meetings');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Fix: Ensure dates are sent as 'YYYY-MM-DD' (local) to avoid timezone issues
      const localFormData = {
        ...formData,
        startDate: formData.startDate,
        endDate: formData.endDate,
      };
      if (editingMeeting) {
        await meetings.update(editingMeeting._id, localFormData);
      } else {
        const newMeeting = await meetings.create(localFormData);
        setMeetingsList([...meetingsList, newMeeting]);
      }
      await fetchMeetings();
      setFormData(initialFormState);
      setEditingMeeting(null);
      setShowAddModal(false);
    } catch (err: any) {
      setError(err.message || 'Failed to save meeting');
    }
  };

  const handleDelete = (meeting: Meeting) => {
    setMeetingToDelete(meeting);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!meetingToDelete) return;
    
    try {
      await meetings.delete(meetingToDelete._id);
      await fetchMeetings();
      setShowDeleteModal(false);
      setMeetingToDelete(null);
    } catch (err: any) {
      setError(err.message || 'Failed to delete meeting');
    }
  };

  const handleEdit = (meeting: Meeting) => {
    setEditingMeeting(meeting);
    // Fix: Use only the date part (YYYY-MM-DD) to avoid timezone shift
    setFormData({
      name: meeting.name,
      startDate: meeting.startDate.slice(0, 10),
      endDate: meeting.endDate.slice(0, 10),
      location: meeting.location,
      isActive: meeting.isActive
    });
    setShowAddModal(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    setFormData(prev => ({
      ...prev,
      [e.target.name]: value
    }));
  };

  const modalTitle = editingMeeting ? "Edit Meeting" : "Add New Meeting";
  const submitButtonText = editingMeeting ? "Save Changes" : "Add Meeting";

  if (loading) return <div>Loading...</div>;

  // Sort meetings by startDate ascending (chronological order)
  const sortedMeetingsList = [...meetingsList].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

  return (
    <div className="container mx-auto p-4">
      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0 mb-6">
        <h2 className="text-xl font-semibold">Upcoming Meetings</h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <svg 
            className="h-5 w-5 mr-2" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 6v6m0 0v6m0-6h6m-6 0H6" 
            />
          </svg>
          Add New Meeting
        </button>
      </div>

      <div className="space-y-4">
        {sortedMeetingsList.map(meeting => (
          <div key={meeting._id} className="border p-4 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0 bg-white">
            <div>
              <h4 className="font-bold">{meeting.name}</h4>
              <p>{meeting.location}</p>
              <p className="text-sm text-gray-600">
                {meeting.startDate.slice(0, 10)} - {meeting.endDate.slice(0, 10)}
              </p>
              <span className={`text-sm ${meeting.isActive ? 'text-green-600' : 'text-red-600'}`}>
                {meeting.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <button
                onClick={() => handleEdit(meeting)}
                className="flex-1 sm:flex-none bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(meeting)}
                className="flex-1 sm:flex-none bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setEditingMeeting(null);
          setFormData(initialFormState);
        }}
        title={modalTitle}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
              />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
                  Start Date
                </label>
                <input
                  type="date"
                  id="startDate"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  className="mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
                  End Date
                </label>
                <input
                  type="date"
                  id="endDate"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  className="mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  required
                />
              </div>
            </div>
          </div>
          
          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700">
              Location
            </label>
            <input
              type="text"
              id="location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              required
            />
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              name="isActive"
              checked={formData.isActive}
              onChange={handleChange}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
              Active (show in application form)
            </label>
          </div>
          
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setShowAddModal(false);
                setEditingMeeting(null);
                setFormData(initialFormState);
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {submitButtonText}
            </button>
          </div>
        </form>
      </Modal>

      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setMeetingToDelete(null);
        }}
        onConfirm={confirmDelete}
        itemName={meetingToDelete?.name || ''}
      />
    </div>
  );
} 