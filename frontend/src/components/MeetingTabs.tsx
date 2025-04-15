import { useState } from 'react';

const meetings = ['Dallas 2025', 'Calgary 2026']; // Add more meetings as needed

export default function MeetingTabs({ applications }) {
  const [selectedMeeting, setSelectedMeeting] = useState(meetings[0]);

  const filteredApplications = applications.filter(app => app.meeting === selectedMeeting);

  return (
    <div>
      <div className="flex space-x-4">
        {meetings.map(meeting => (
          <button
            key={meeting}
            onClick={() => setSelectedMeeting(meeting)}
            className={`px-4 py-2 rounded ${selectedMeeting === meeting ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            {meeting}
          </button>
        ))}
      </div>
      <div>
        {/* Render filtered applications here */}
        {filteredApplications.map(app => (
          <div key={app._id}>
            <p>{`${app.firstName} ${app.lastName}`}</p>
            {/* Add more fields as needed */}
          </div>
        ))}
      </div>
    </div>
  );
} 