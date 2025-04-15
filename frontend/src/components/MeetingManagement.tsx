import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';

export default function MeetingManagement() {
  const [meetings, setMeetings] = useState([]);
  const [newMeeting, setNewMeeting] = useState({
    name: '',
    startDate: '',
    endDate: '',
    location: '',
  });

  useEffect(() => {
    fetchMeetings();
  }, []);

  const fetchMeetings = async () => {
    const response = await api.meetings.getAll();
    setMeetings(response.data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await api.meetings.create(newMeeting);
    fetchMeetings();
    setNewMeeting({ name: '', startDate: '', endDate: '', location: '' });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Manage Meetings</h2>
      
      {/* Add New Meeting Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Meeting Name</label>
            <input
              type="text"
              value={newMeeting.name}
              onChange={(e) => setNewMeeting({...newMeeting, name: e.target.value})}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          {/* Add other fields similarly */}
        </div>
        <button
          type="submit"
          className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
        >
          Add Meeting
        </button>
      </form>

      {/* Existing Meetings Table */}
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dates</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {meetings.map((meeting) => (
            <tr key={meeting._id}>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{meeting.name}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {new Date(meeting.startDate).toLocaleDateString()} - {new Date(meeting.endDate).toLocaleDateString()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{meeting.location}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {meeting.isActive ? 'Active' : 'Inactive'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button
                  onClick={() => handleToggleStatus(meeting._id)}
                  className="text-indigo-600 hover:text-indigo-900"
                >
                  Toggle Status
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
} 