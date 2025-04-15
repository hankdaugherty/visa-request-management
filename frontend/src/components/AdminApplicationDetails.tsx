import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Header from './Header';
import { applications as applicationsApi } from '../utils/api';

export default function AdminApplicationDetails() {
  const { id } = useParams();
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchApplication = async () => {
      try {
        const data = await applicationsApi.getById(id);
        setApplication(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchApplication();
  }, [id]);

  const handleEdit = async (field, value) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/applications/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ [field]: value })
      });

      if (!response.ok) {
        throw new Error('Failed to update application');
      }

      const updatedApp = await response.json();
      setApplication(updatedApp);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!application) return <div>Application not found</div>;

  return (
    <>
      <Header />
      <main className="bg-[#F9FAFB] min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold mb-4">Application Details</h1>
          <div className="bg-white shadow rounded-lg p-6">
            <div>
              <p>Name: {`${application.firstName} ${application.lastName}`}</p>
              <p>Email: {application.email}</p>
              <div>
                <label>Letter Emailed:</label>
                <select
                  value={application.letterEmailed ? 'Yes' : 'No'}
                  onChange={(e) => handleEdit('letterEmailed', e.target.value === 'Yes')}
                >
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>
              <div>
                <label>Hard Copy Mailed:</label>
                <select
                  value={application.hardCopyMailed ? 'Yes' : 'No'}
                  onChange={(e) => handleEdit('hardCopyMailed', e.target.value === 'Yes')}
                >
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>
              <div>
                <label>Hard Copy Mailed Date:</label>
                <input
                  type="date"
                  value={application.hardCopyMailedDate ? new Date(application.hardCopyMailedDate).toISOString().split('T')[0] : ''}
                  onChange={(e) => handleEdit('hardCopyMailedDate', e.target.value)}
                />
              </div>
              <div>
                <label>Status:</label>
                <select
                  value={application.status}
                  onChange={(e) => handleEdit('status', e.target.value)}
                >
                  <option value="pending">Pending</option>
                  <option value="complete">Complete</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
} 