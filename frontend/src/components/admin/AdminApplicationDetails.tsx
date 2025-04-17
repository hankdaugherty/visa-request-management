import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Header from '../common/Header';
import { applications as applicationsApi } from '../../utils/api';

interface ApplicationField {
  name: string;
  value: string | boolean;
  type: 'text' | 'date' | 'select' | 'checkbox';
  editable: boolean;
  options?: string[];
}

export default function AdminApplicationDetails() {
  const { id } = useParams();
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(true); // Always in edit mode for admin

  const inputClass = "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500";

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

  const handleEdit = async (field: string, value: any) => {
    try {
      const response = await applicationsApi.update(id, { [field]: value });
      setApplication(response);
    } catch (err) {
      console.error(err);
    }
  };

  const renderField = (field: ApplicationField) => {
    switch (field.type) {
      case 'date':
        return (
          <input
            type="date"
            value={field.value || ''}
            onChange={(e) => handleEdit(field.name, e.target.value)}
            className={inputClass}
          />
        );
      case 'checkbox':
        return (
          <input
            type="checkbox"
            checked={field.value as boolean}
            onChange={(e) => handleEdit(field.name, e.target.checked)}
            className="mt-1"
          />
        );
      case 'select':
        return (
          <select
            value={field.value as string}
            onChange={(e) => handleEdit(field.name, e.target.value)}
            className={inputClass}
          >
            {field.options?.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        );
      default:
        return (
          <input
            type={field.type}
            value={field.value as string}
            onChange={(e) => handleEdit(field.name, e.target.value)}
            className={inputClass}
          />
        );
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!application) return <div>Application not found</div>;

  return (
    <>
      <Header />
      <main className="bg-[#F9FAFB] min-h-screen">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto py-8">
            <div className="text-left mb-8">
              <h1 className="text-2xl font-bold mb-2">Application Details</h1>
            </div>

            <div className="bg-white shadow rounded-lg">
              {/* Meeting Information */}
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold mb-4 text-left">Meeting Information</h2>
                <div className="text-left">
                  <label className="block text-sm font-medium text-gray-700">Meeting</label>
                  <div className="mt-1">{application.meeting?.name}</div>
                </div>
              </div>

              {/* Application Status */}
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold mb-4 text-left">Application Status</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="text-left">
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    {renderField({
                      name: 'status',
                      value: application.status,
                      type: 'select',
                      editable: true,
                      options: ['pending', 'complete']
                    })}
                  </div>
                  <div className="text-left">
                    <label className="block text-sm font-medium text-gray-700">Letter Emailed</label>
                    {renderField({
                      name: 'letterEmailed',
                      value: application.letterEmailed,
                      type: 'checkbox',
                      editable: true
                    })}
                  </div>
                  <div className="text-left">
                    <label className="block text-sm font-medium text-gray-700">Hard Copy Mailed</label>
                    {renderField({
                      name: 'hardCopyMailed',
                      value: application.hardCopyMailed,
                      type: 'checkbox',
                      editable: true
                    })}
                  </div>
                  <div className="text-left">
                    <label className="block text-sm font-medium text-gray-700">Hard Copy Mailed Date</label>
                    {renderField({
                      name: 'hardCopyMailedDate',
                      value: application.hardCopyMailedDate ? new Date(application.hardCopyMailedDate).toISOString().split('T')[0] : '',
                      type: 'date',
                      editable: true
                    })}
                  </div>
                </div>
              </div>

              {/* Personal Information (read-only) */}
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold mb-4 text-left">Personal Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="text-left">
                    <label className="block text-sm font-medium text-gray-700">Name</label>
                    <div className="mt-1">{`${application.firstName} ${application.lastName}`}</div>
                  </div>
                  <div className="text-left">
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <div className="mt-1">{application.email}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
} 