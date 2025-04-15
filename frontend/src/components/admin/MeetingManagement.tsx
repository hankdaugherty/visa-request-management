import React, { useState, useEffect } from 'react';
import { meetings } from '../../utils/api';

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
      if (editingMeeting) {
        await meetings.update(editingMeeting._id, formData);
      } else {
        await meetings.create(formData);
      }
      await fetchMeetings();
      setFormData(initialFormState);
      setEditingMeeting(null);
    } catch (err: any) {
      setError(err.message || 'Failed to save meeting');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this meeting?')) return;
    
    try {
      await meetings.delete(id);
      await fetchMeetings();
    } catch (err: any) {
      setError(err.message || 'Failed to delete meeting');
    }
  };

  const handleEdit = (meeting: Meeting) => {
    setEditingMeeting(meeting);
    setFormData({
      name: meeting.name,
      startDate: new Date(meeting.startDate).toISOString().split('T')[0],
      endDate: new Date(meeting.endDate).toISOString().split('T')[0],
      location: meeting.location,
      isActive: meeting.isActive
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    setFormData(prev => ({
      ...prev,
      [e.target.name]: value
    }));
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="container mx-auto p-4">
      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
      
      <h2 className="text-2xl font-bold mb-4">
        {editingMeeting ? 'Edit Meeting' : 'Add New Meeting'}
      </h2>
      
      <form onSubmit={handleSubmit} className="mb-8 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Start Date</label>
          <input
            type="date"
            name="startDate"
            value={formData.startDate}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">End Date</label>
          <input
            type="date"
            name="endDate"
            value={formData.endDate}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Location</label>
          <input
            type="text"
            name="location"
            value={formData.location}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            required
          />
        </div>
        
        <div>
          <label className="flex items-center">
            <input
              type="checkbox"
              name="isActive"
              checked={formData.isActive}
              onChange={handleChange}
              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="ml-2">Active (show in application form)</span>
          </label>
        </div>
        
        <div className="flex gap-2">
          <button
            type="submit"
            className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            {editingMeeting ? 'Update Meeting' : 'Add Meeting'}
          </button>
          
          {editingMeeting && (
            <button
              type="button"
              onClick={() => {
                setEditingMeeting(null);
                setFormData(initialFormState);
              }}
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <h3 className="text-xl font-bold mb-4">Existing Meetings</h3>
      <div className="space-y-4">
        {meetingsList.map(meeting => (
          <div key={meeting._id} className="border p-4 rounded-lg flex justify-between items-center bg-white">
            <div>
              <h4 className="font-bold">{meeting.name}</h4>
              <p>{meeting.location}</p>
              <p className="text-sm text-gray-600">
                {new Date(meeting.startDate).toLocaleDateString()} - 
                {new Date(meeting.endDate).toLocaleDateString()}
              </p>
              <span className={`text-sm ${meeting.isActive ? 'text-green-600' : 'text-red-600'}`}>
                {meeting.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div className="space-x-2">
              <button
                onClick={() => handleEdit(meeting)}
                className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(meeting._id)}
                className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 