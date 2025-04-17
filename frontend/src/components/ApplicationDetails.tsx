import { useParams, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Header from './common/Header';
import { applications as applicationsApi } from '../utils/api';

// Constants
const GENDER_OPTIONS = ['Male', 'Female', 'Other', 'Prefer not to say'];
const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DC', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
];
const COUNTRIES = ['US', 'CA', 'GB', 'FR', 'DE', 'IT', 'ES', 'AU', 'JP', 'CN'];
const APPLICATION_STATUSES = ['Pending', 'Complete', 'Rejected'];
const MEETING_OPTIONS = ['Dallas 2025', 'Calgary 2026'];

interface ApplicationField {
  name: string;
  value: string | boolean | Date;
  type: 'text' | 'date' | 'email' | 'tel' | 'checkbox' | 'select';
  editable: boolean;
  options?: string[];
}

interface Application {
  _id: string;
  meeting: {
    _id: string;
    name: string;
  };
  userId: {
    _id: string;
  };
  status: string;
  // ... other fields
}

export default function ApplicationDetails({ isAdmin = false }) {
  const { id } = useParams();
  const location = useLocation();
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedFields, setEditedFields] = useState<any>({});
  const isAdminView = location.pathname.includes('/admin');
  const currentUserId = localStorage.getItem('userId');
  const userRole = localStorage.getItem('userRole');

  const canEdit = () => {
    if (!application) return false;
    
    const isOwner = application.userId?._id === currentUserId;
    const isPending = application.status?.toLowerCase() === 'pending';
    const isAdminUser = userRole === 'admin';

    return isAdminUser || (isOwner && isPending);
  };

  useEffect(() => {
    const fetchApplication = async () => {
      try {
        const data = await applicationsApi.getById(id);
        setApplication(data);
        setEditedFields(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch application');
      } finally {
        setLoading(false);
      }
    };

    fetchApplication();
  }, [id]);

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      timeZone: 'UTC'
    });
  };

  const handleFieldChange = (field: string, value: any) => {
    setEditedFields(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    try {
      // Ensure all date fields are in ISO format
      const updates = {
        ...editedFields,
        // Explicitly include the fields that aren't persisting
        issuingCountry: editedFields.issuingCountry,
        dateOfArrival: editedFields.dateOfArrival ? new Date(editedFields.dateOfArrival).toISOString() : null,
        dateOfDeparture: editedFields.dateOfDeparture ? new Date(editedFields.dateOfDeparture).toISOString() : null,
        updatedAt: new Date().toISOString()
      };

      console.log('Saving updates:', updates); // Add this for debugging

      const updatedApplication = await applicationsApi.update(id, updates);
      
      // Create a complete merged state that preserves all necessary fields
      const mergedApplication = {
        ...application,
        ...updatedApplication,
        userId: application?.userId, // Keep the original userId object
        status: updatedApplication.status || application?.status,
        meeting: updatedApplication.meeting || application?.meeting,
        // Explicitly preserve these fields from the update
        issuingCountry: updates.issuingCountry,
        dateOfArrival: updates.dateOfArrival,
        dateOfDeparture: updates.dateOfDeparture
      };

      setApplication(mergedApplication);
      setEditedFields(mergedApplication);
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update application');
    }
  };

  const handleEdit = () => {
    setEditedFields({
      ...application,
      // Ensure all fields are properly initialized
      issuingCountry: application?.issuingCountry || '',
      dateOfArrival: application?.dateOfArrival ? new Date(application.dateOfArrival).toISOString().split('T')[0] : '',
      dateOfDeparture: application?.dateOfDeparture ? new Date(application.dateOfDeparture).toISOString().split('T')[0] : '',
      birthdate: application?.birthdate ? new Date(application.birthdate).toISOString().split('T')[0] : '',
      passportExpirationDate: application?.passportExpirationDate ? new Date(application.passportExpirationDate).toISOString().split('T')[0] : '',
    });
    setIsEditing(true);
  };

  // Update the formatDate function to handle timezone
  const formatDateWithTime = (date: string) => {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short',
      timeZone: 'America/New_York'
    });
  };

  const formatDateForInput = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };

  const formatDateDisplay = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short'
    });
  };

  const renderField = (field: ApplicationField) => {
    const inputClass = isEditing
      ? "mt-1 block w-full rounded-md border-blue-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
      : "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500";

    if (!isEditing) {
      if (field.type === 'date') {
        return <p className="mt-1">{field.value ? formatDate(field.value as string) : ''}</p>;
      }
      return <p className="mt-1">{field.value?.toString()}</p>;
    }

    switch (field.type) {
      case 'date':
        return (
          <input
            type="date"
            value={editedFields[field.name] || field.value || ''}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            className={inputClass}
          />
        );
      case 'checkbox':
        return (
          <input
            type="checkbox"
            checked={editedFields[field.name] || false}
            onChange={(e) => handleFieldChange(field.name, e.target.checked)}
            className="mt-1"
          />
        );
      case 'select':
        return (
          <select
            value={editedFields[field.name] || ''}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            className={inputClass}
          >
            {field.options?.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        );
      default:
        return (
          <div className="flex items-center">
            <input
              type={field.type}
              value={editedFields[field.name] || ''}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
              className={inputClass}
            />
            {isEditing && (
              <span className="ml-2 text-gray-500">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-5 w-5" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={1.5}
                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" 
                  />
                </svg>
              </span>
            )}
          </div>
        );
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-600">{error}</div>;
  if (!application) return <div>Application not found</div>;

  return (
    <>
      {!isAdmin && <Header />}
      <main className="bg-[#F9FAFB] min-h-screen">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto py-8">
            {/* Title section outside the white box */}
            <div className="text-left mb-8">
              <h1 className="text-2xl font-bold mb-2">Application Details</h1>
            </div>

            {/* White box container */}
            <div className="bg-white shadow rounded-lg">
              {/* Action buttons in the top right */}
              <div className="flex justify-end p-4">
                {canEdit() && !isEditing && (
                  <button
                    onClick={handleEdit}
                    className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
                  >
                    Edit Application
                  </button>
                )}
                {isEditing && (
                  <div className="space-x-2">
                    <button
                      onClick={handleSave}
                      className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                    >
                      Save Changes
                    </button>
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setEditedFields(application);
                      }}
                      className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              {/* Meeting Information */}
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold mb-4 text-left">Meeting Information</h2>
                <div className="text-left">
                  <label className="block text-sm font-medium text-gray-700">Meeting</label>
                  <div className="mt-1">{application.meeting?.name}</div>
                </div>
              </div>

              {/* Personal Information */}
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold mb-4 text-left">Personal Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="text-left">
                    <label className="block text-sm font-medium text-gray-700">First Name</label>
                    {renderField({
                      name: 'firstName',
                      value: application.firstName,
                      type: 'text',
                      editable: true
                    })}
                  </div>
                  <div className="text-left">
                    <label className="block text-sm font-medium text-gray-700">Last Name</label>
                    {renderField({
                      name: 'lastName',
                      value: application.lastName,
                      type: 'text',
                      editable: true
                    })}
                  </div>
                  <div className="text-left">
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    {renderField({
                      name: 'email',
                      value: application.email,
                      type: 'email',
                      editable: true
                    })}
                  </div>
                  <div className="text-left">
                    <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                    {renderField({
                      name: 'birthdate',
                      value: application.birthdate,
                      type: 'date',
                      editable: true
                    })}
                  </div>
                  <div className="text-left">
                    <label className="block text-sm font-medium text-gray-700">Gender</label>
                    {renderField({
                      name: 'gender',
                      value: application.gender,
                      type: 'select',
                      editable: true,
                      options: GENDER_OPTIONS
                    })}
                  </div>
                </div>
              </div>

              {/* Passport Information */}
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold mb-4">Passport Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="text-left">
                    <label className="block text-sm font-medium text-gray-700">Passport Number</label>
                    {renderField({
                      name: 'passportNumber',
                      value: application.passportNumber,
                      type: 'text',
                      editable: true
                    })}
                  </div>
                  <div className="text-left">
                    <label className="block text-sm font-medium text-gray-700">Issuing Country</label>
                    {renderField({
                      name: 'issuingCountry',
                      value: application.issuingCountry,
                      type: 'select',
                      editable: true,
                      options: COUNTRIES
                    })}
                  </div>
                  <div className="text-left">
                    <label className="block text-sm font-medium text-gray-700">Expiration Date</label>
                    {renderField({
                      name: 'passportExpirationDate',
                      value: application.passportExpirationDate,
                      type: 'date',
                      editable: true
                    })}
                  </div>
                </div>
              </div>

              {/* Travel Information */}
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold mb-4">Travel Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="text-left">
                    <label className="block text-sm font-medium text-gray-700">Arrival Date</label>
                    {renderField({
                      name: 'dateOfArrival',
                      value: application.dateOfArrival,
                      type: 'date',
                      editable: true
                    })}
                  </div>
                  <div className="text-left">
                    <label className="block text-sm font-medium text-gray-700">Departure Date</label>
                    {renderField({
                      name: 'dateOfDeparture',
                      value: application.dateOfDeparture,
                      type: 'date',
                      editable: true
                    })}
                  </div>
                </div>
              </div>

              {/* Company Information */}
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold mb-4">Company Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="text-left">
                    <label className="block text-sm font-medium text-gray-700">Company Name</label>
                    {renderField({
                      name: 'companyName',
                      value: application.companyName,
                      type: 'text',
                      editable: true
                    })}
                  </div>
                  <div className="text-left">
                    <label className="block text-sm font-medium text-gray-700">Position</label>
                    {renderField({
                      name: 'position',
                      value: application.position,
                      type: 'text',
                      editable: true
                    })}
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Company Address</label>
                    <div className="max-w-md">
                      {renderField({
                        name: 'companyMailingAddress1',
                        value: application.companyMailingAddress1,
                        type: 'text',
                        editable: true
                      })}
                      {renderField({
                        name: 'companyMailingAddress2',
                        value: application.companyMailingAddress2,
                        type: 'text',
                        editable: true
                      })}
                      <div className="flex gap-1">
                        <div className="w-48">
                          {renderField({
                            name: 'city',
                            value: application.city,
                            type: 'text',
                            editable: true
                          })}
                        </div>
                        <div className="w-16">
                          {renderField({
                            name: 'state',
                            value: application.state,
                            type: 'select',
                            editable: true,
                            options: US_STATES
                          })}
                        </div>
                        <div className="w-24">
                          {renderField({
                            name: 'postalCode',
                            value: application.postalCode,
                            type: 'text',
                            editable: true
                          })}
                        </div>
                      </div>
                      {renderField({
                        name: 'country',
                        value: application.country,
                        type: 'select',
                        editable: true,
                        options: COUNTRIES
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold mb-4">Contact Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="text-left">
                    <label className="block text-sm font-medium text-gray-700">Phone</label>
                    {renderField({
                      name: 'phone',
                      value: application.phone,
                      type: 'tel',
                      editable: true
                    })}
                  </div>
                  {application?.fax && (
                    <div className="text-left">
                      <label className="block text-sm font-medium text-gray-700">Fax</label>
                      {renderField({
                        name: 'fax',
                        value: application.fax,
                        type: 'tel',
                        editable: true
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Hotel Information */}
              {(application.hotelName || application.hotelConfirmation) && (
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-lg font-semibold mb-4">Hotel Information</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="text-left">
                      <label className="block text-sm font-medium text-gray-700">Hotel Name</label>
                      {renderField({
                        name: 'hotelName',
                        value: application.hotelName || '',
                        type: 'text',
                        editable: true
                      })}
                    </div>
                    <div className="text-left">
                      <label className="block text-sm font-medium text-gray-700">Confirmation Number</label>
                      {renderField({
                        name: 'hotelConfirmation',
                        value: application.hotelConfirmation || '',
                        type: 'text',
                        editable: true
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Additional Information */}
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold mb-4">Additional Information</h2>
                {renderField({
                  name: 'additionalInformation',
                  value: application.additionalInformation || '',
                  type: 'text',
                  editable: true
                })}
              </div>

              {/* Application Status */}
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold mb-4">Application Status</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="text-left">
                    <label className="block text-sm font-medium text-gray-700">Created At</label>
                    <div className="mt-1">{formatDateWithTime(application.createdAt)}</div>
                  </div>
                  <div className="text-left">
                    <label className="block text-sm font-medium text-gray-700">Last Updated</label>
                    <div className="mt-1">{formatDateWithTime(application.updatedAt)}</div>
                  </div>
                  <div className="text-left">
                    <label className="block text-sm font-medium text-gray-700">Application Status</label>
                    {isEditing && isAdminView ? (
                      <select
                        value={editedFields.status || ''}
                        onChange={(e) => handleFieldChange('status', e.target.value)}
                        className={inputClass}
                      >
                        {APPLICATION_STATUSES.map(status => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
                    ) : (
                      <div className="mt-1">{application.status}</div>
                    )}
                  </div>
                  <div className="text-left">
                    <label className="block text-sm font-medium text-gray-700">Letter Emailed</label>
                    {isEditing && isAdminView ? (
                      <input
                        type="checkbox"
                        checked={editedFields.letterEmailed || false}
                        onChange={(e) => handleFieldChange('letterEmailed', e.target.checked)}
                        className="mt-2"
                      />
                    ) : (
                      <div className="mt-1">{application.letterEmailed ? 'Yes' : 'No'}</div>
                    )}
                  </div>
                  <div className="text-left">
                    <label className="block text-sm font-medium text-gray-700">Hard Copy Mailed</label>
                    {isEditing && isAdminView ? (
                      <input
                        type="checkbox"
                        checked={editedFields.hardCopyMailed || false}
                        onChange={(e) => handleFieldChange('hardCopyMailed', e.target.checked)}
                        className="mt-2"
                      />
                    ) : (
                      <div className="mt-1">{application.hardCopyMailed ? 'Yes' : 'No'}</div>
                    )}
                  </div>
                  {(application.hardCopyMailed || isAdminView) && (
                    <div className="text-left">
                      <label className="block text-sm font-medium text-gray-700">Hard Copy Mailed Date</label>
                      {isEditing && isAdminView ? (
                        <input
                          type="date"
                          value={editedFields.hardCopyMailedDate?.split('T')[0] || ''}
                          onChange={(e) => handleFieldChange('hardCopyMailedDate', e.target.value)}
                          className={inputClass}
                        />
                      ) : (
                        <div className="mt-1">
                          {application.hardCopyMailedDate ? formatDate(application.hardCopyMailedDate) : ''}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
