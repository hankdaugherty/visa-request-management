import { useParams, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Header from './Header';
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
      <div id="application-details" style={{ maxWidth: "1200px", margin: "0 32px" }}>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Application Details</h1>
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
        
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <h2 className="text-lg font-semibold">Meeting Information</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700">Meeting</label>
              <div className="mt-1">{application.meeting?.name}</div>
            </div>
          </div>

          <div className="border-t border-gray-200 p-6">
            <h2 className="text-lg font-semibold">Personal Information</h2>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">First Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedFields.firstName || ''}
                    onChange={(e) => handleFieldChange('firstName', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                ) : (
                  <div className="mt-1">{application.firstName}</div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Last Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedFields.lastName || ''}
                    onChange={(e) => handleFieldChange('lastName', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                ) : (
                  <div className="mt-1">{application.lastName}</div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                {isEditing ? (
                  <input
                    type="email"
                    value={editedFields.email || ''}
                    onChange={(e) => handleFieldChange('email', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                ) : (
                  <div className="mt-1">{application.email}</div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Birthdate</label>
                {isEditing ? (
                  <input
                    type="date"
                    value={editedFields.birthdate?.split('T')[0] || ''}
                    onChange={(e) => handleFieldChange('birthdate', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                ) : (
                  <div className="mt-1">{formatDate(application.birthdate)}</div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Gender</label>
                {isEditing ? (
                  <select
                    value={editedFields.gender || ''}
                    onChange={(e) => handleFieldChange('gender', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  >
                    {GENDER_OPTIONS.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                ) : (
                  <div className="mt-1">{application.gender}</div>
                )}
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 p-6">
            <h2 className="text-lg font-semibold">Passport Information</h2>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Passport Number</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedFields.passportNumber || ''}
                    onChange={(e) => handleFieldChange('passportNumber', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                ) : (
                  <div className="mt-1">{application.passportNumber}</div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Issuing Country</label>
                {isEditing ? (
                  <select
                    value={editedFields.issuingCountry || ''}
                    onChange={(e) => handleFieldChange('issuingCountry', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  >
                    <option value="">Select a country</option>
                    {COUNTRIES.map(country => (
                      <option key={country} value={country}>{country}</option>
                    ))}
                  </select>
                ) : (
                  <div className="mt-1">{application.issuingCountry}</div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Expiration Date</label>
                {isEditing ? (
                  <input
                    type="date"
                    value={editedFields.passportExpirationDate?.split('T')[0] || ''}
                    onChange={(e) => handleFieldChange('passportExpirationDate', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                ) : (
                  <div className="mt-1">{formatDate(application.passportExpirationDate)}</div>
                )}
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 p-6">
            <h2 className="text-lg font-semibold">Travel Information</h2>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Arrival Date</label>
                {isEditing ? (
                  <input
                    type="date"
                    value={editedFields.dateOfArrival?.split('T')[0] || ''}
                    onChange={(e) => handleFieldChange('dateOfArrival', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                ) : (
                  <div className="mt-1">{formatDate(application.dateOfArrival)}</div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Departure Date</label>
                {isEditing ? (
                  <input
                    type="date"
                    value={editedFields.dateOfDeparture?.split('T')[0] || ''}
                    onChange={(e) => handleFieldChange('dateOfDeparture', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                ) : (
                  <div className="mt-1">{formatDate(application.dateOfDeparture)}</div>
                )}
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 p-6">
            <h2 className="text-lg font-semibold">Company Information</h2>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-medium text-gray-500">Company Name</p>
                {renderField({
                  name: 'companyName',
                  value: application.companyName,
                  type: 'text',
                  editable: true
                })}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Position</p>
                {renderField({
                  name: 'position',
                  value: application.position,
                  type: 'text',
                  editable: true
                })}
              </div>
              <div className="col-span-2">
                <p className="text-sm font-medium text-gray-500 mb-2">Company Address</p>
                <div className="max-w-md">
                  {isEditing ? (
                    // Edit mode - show separate fields
                    <div className="space-y-1">
                      <div>
                        {renderField({
                          name: 'companyMailingAddress1',
                          value: application.companyMailingAddress1,
                          type: 'text',
                          editable: true
                        })}
                      </div>
                      <div>
                        {renderField({
                          name: 'companyMailingAddress2',
                          value: application.companyMailingAddress2,
                          type: 'text',
                          editable: true
                        })}
                      </div>
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
                      <div className="w-40">
                        {renderField({
                          name: 'country',
                          value: application.country,
                          type: 'select',
                          editable: true,
                          options: COUNTRIES
                        })}
                      </div>
                    </div>
                  ) : (
                    // View mode - show formatted address
                    <div className="space-y-1">
                      <div>{application.companyMailingAddress1}</div>
                      {application.companyMailingAddress2 && (
                        <div>{application.companyMailingAddress2}</div>
                      )}
                      <div>
                        {application.city}, {application.state} {application.postalCode}
                      </div>
                      <div>{application.country}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 p-6">
            <h2 className="text-lg font-semibold">Contact Information</h2>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-medium text-gray-500">Phone</p>
                {renderField({
                  name: 'phone',
                  value: application.phone,
                  type: 'tel',
                  editable: true
                })}
              </div>
              {application?.fax && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Fax</p>
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

          {(application.hotelName || application.hotelConfirmation) && (
            <div className="border-t border-gray-200 p-6">
              <h2 className="text-lg font-semibold">Hotel Information</h2>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm font-medium text-gray-500">Hotel Name</p>
                  {renderField({
                    name: 'hotelName',
                    value: application.hotelName || '',
                    type: 'text',
                    editable: true
                  })}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Confirmation Number</p>
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

          <div className="border-t border-gray-200 p-6">
            <h2 className="text-lg font-semibold">Additional Information</h2>
            {renderField({
              name: 'additionalInformation',
              value: application.additionalInformation || '',
              type: 'text',
              editable: true
            })}
          </div>

          <div className="border-t border-gray-200 p-6">
            <h2 className="text-lg font-semibold">Application Status</h2>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-medium text-gray-500">Created At</p>
                <p className="mt-1">{formatDateWithTime(application.createdAt)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Last Updated</p>
                <p className="mt-1">{formatDateWithTime(application.updatedAt)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Application Status</p>
                {isEditing && isAdminView ? (
                  <select
                    value={editedFields.status || ''}
                    onChange={(e) => handleFieldChange('status', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  >
                    {APPLICATION_STATUSES.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                ) : (
                  <p className="mt-1">{application.status}</p>
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Letter Emailed</p>
                {isEditing && isAdminView ? (
                  <input
                    type="checkbox"
                    checked={editedFields.letterEmailed || false}
                    onChange={(e) => handleFieldChange('letterEmailed', e.target.checked)}
                    className="mt-2"
                  />
                ) : (
                  <p className="mt-1">{application.letterEmailed ? 'Yes' : 'No'}</p>
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Hard Copy Mailed</p>
                {isEditing && isAdminView ? (
                  <input
                    type="checkbox"
                    checked={editedFields.hardCopyMailed || false}
                    onChange={(e) => handleFieldChange('hardCopyMailed', e.target.checked)}
                    className="mt-2"
                  />
                ) : (
                  <p className="mt-1">{application.hardCopyMailed ? 'Yes' : 'No'}</p>
                )}
              </div>
              {(application.hardCopyMailed || isAdminView) && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Hard Copy Mailed Date</p>
                  {isEditing && isAdminView ? (
                    <input
                      type="date"
                      value={editedFields.hardCopyMailedDate?.split('T')[0] || ''}
                      onChange={(e) => handleFieldChange('hardCopyMailedDate', e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  ) : (
                    <p className="mt-1">
                      {application.hardCopyMailedDate ? formatDate(application.hardCopyMailedDate) : ''}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
