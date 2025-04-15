import { useParams, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Header from './Header';
import { applications as applicationsApi } from '../utils/api';

// First, add these constants at the top of the file
const GENDER_OPTIONS = ['Male', 'Female', 'Other', 'Prefer not to say'];
const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
];
const COUNTRIES = ['US', 'CA', 'GB', 'FR', 'DE', 'IT', 'ES', 'AU', 'JP', 'CN']; // Add more as needed
const APPLICATION_STATUSES = ['Pending', 'Complete', 'Rejected'];

interface ApplicationField {
  name: string;
  value: string | boolean | Date;
  type: 'text' | 'date' | 'email' | 'tel' | 'checkbox' | 'select';
  editable: boolean;
  options?: string[];
}

interface AdminUpdate {
  letterEmailed?: boolean;
  hardCopyMailed?: boolean;
  hardCopyMailedDate?: string;
  status?: string;
  [key: string]: any;
}

// Example of adding a solid pencil SVG icon next to a text field
const PencilIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5 text-gray-600" // Adjust color here
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M14.121 4.379l5.5 5.5-1.415 1.415-5.5-5.5 1.415-1.415zM2 16.5V22h5.5l11.5-11.5-5.5-5.5L2 16.5z"
    />
  </svg>
);

// Helper function to adjust date for timezone
const adjustDateForTimezone = (dateString: string) => {
  const date = new Date(dateString);
  const userTimezoneOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() + userTimezoneOffset).toISOString().split('T')[0];
};

export default function ApplicationDetails({ isAdmin = false }) {
  const { id } = useParams();
  const location = useLocation();
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedFields, setEditedFields] = useState({});

  // Determine if we're in admin view based on the route
  const isAdminView = location.pathname.startsWith('/admin');

  // At the top of your component, add this to check admin status
  const isUserAdmin = localStorage.getItem('userRole') === 'admin';

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

  // Update handleFieldChange to adjust dates when they're changed
  const handleFieldChange = (field: string, value: any) => {
    // If it's a date field, adjust for timezone
    if (field === 'birthdate' || 
        field === 'passportExpirationDate' || 
        field === 'dateOfArrival' || 
        field === 'dateOfDeparture') {
      value = adjustDateForTimezone(value);
    }
    
    setEditedFields(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Update handleSave to ensure dates are handled correctly
  const handleSave = async () => {
    try {
      const updates = {
        ...editedFields,
        updatedAt: new Date().toISOString()
      };

      const updatedApplication = await applicationsApi.update(id, updates);
      setApplication(updatedApplication);
      setEditedFields(updatedApplication);
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update application');
    }
  };

  const handleEdit = () => {
    setEditedFields({
      ...application,
      birthdate: application.birthdate ? new Date(application.birthdate).toISOString().split('T')[0] : '',
      passportExpirationDate: application.passportExpirationDate ? new Date(application.passportExpirationDate).toISOString().split('T')[0] : '',
      dateOfArrival: application.dateOfArrival ? new Date(application.dateOfArrival).toISOString().split('T')[0] : '',
      dateOfDeparture: application.dateOfDeparture ? new Date(application.dateOfDeparture).toISOString().split('T')[0] : '',
    });
    setIsEditing(true);
  };

  // Update the formatDate function to handle timezone
  const formatDate = (date: string) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      timeZone: 'UTC'  // Use UTC to prevent timezone adjustments
    });
  };

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

  if (loading) return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  if (error) return <div className="flex justify-center items-center min-h-screen text-red-600">Error: {error}</div>;
  if (!application) return <div className="flex justify-center items-center min-h-screen">Application not found</div>;

  return (
    <>
      <Header />
      <main className="bg-[#F9FAFB] min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto text-left">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold">Application Details</h1>
              <div className="flex gap-4">
                {(
                  // Show edit button if:
                  (isUserAdmin && isAdminView) || // Admin in admin view
                  (
                    !isAdminView && // Not in admin view
                    application?.userId && // Application has a userId
                    localStorage.getItem('userId') && // User is logged in
                    application.userId.toString() === localStorage.getItem('userId') && // User owns the application
                    application.status === 'Pending' // Application is pending
                  )
                ) && (
                  <button
                    onClick={() => isEditing ? handleSave() : handleEdit()}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                  >
                    {isEditing ? 'Save Changes' : 'Edit'}
                  </button>
                )}
                {isEditing && (
                  <button
                    onClick={() => setIsEditing(false)}
                    className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>

            <div className="bg-white shadow rounded-lg overflow-hidden">
              {/* Personal Information */}
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold mb-4">Personal Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">First Name</p>
                    {renderField({
                      name: 'firstName',
                      value: application.firstName,
                      type: 'text',
                      editable: true
                    })}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Last Name</p>
                    {renderField({
                      name: 'lastName',
                      value: application.lastName,
                      type: 'text',
                      editable: true
                    })}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Email</p>
                    {renderField({
                      name: 'email',
                      value: application.email,
                      type: 'email',
                      editable: true
                    })}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Birthdate</p>
                    {renderField({
                      name: 'birthdate',
                      value: application.birthdate,
                      type: 'date',
                      editable: true
                    })}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Gender</p>
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Passport Number</p>
                    {renderField({
                      name: 'passportNumber',
                      value: application.passportNumber,
                      type: 'text',
                      editable: true
                    })}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Issuing Country</p>
                    {renderField({
                      name: 'passportIssuingCountry',
                      value: application.passportIssuingCountry,
                      type: 'text',
                      editable: true
                    })}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Expiration Date</p>
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Arrival Date</p>
                    {renderField({
                      name: 'dateOfArrival',
                      value: application.dateOfArrival,
                      type: 'date',
                      editable: true
                    })}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Departure Date</p>
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <p className="text-sm font-medium text-gray-500">Company Address</p>
                    <div className="space-y-2">
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
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          {renderField({
                            name: 'city',
                            value: application.city,
                            type: 'text',
                            editable: true
                          })}
                        </div>
                        <div>
                          {renderField({
                            name: 'state',
                            value: application.state,
                            type: 'select',
                            editable: true,
                            options: US_STATES
                          })}
                        </div>
                        <div>
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

              {/* Hotel Information */}
              {(application.hotelName || application.hotelConfirmation) && (
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-lg font-semibold mb-4">Hotel Information</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

              {/* Additional Information */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold">Additional Information</h2>
                </div>
                {renderField({
                  name: 'additionalInformation',
                  value: application.additionalInformation || '',
                  type: 'text',
                  editable: true
                })}
              </div>

              {/* Application Status */}
              <div className="p-6">
                <h2 className="text-lg font-semibold mb-4">Application Status</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    {isAdminView && isEditing ? (
                      renderField({
                        name: 'status',
                        value: application.status,
                        type: 'select',
                        editable: true,
                        options: APPLICATION_STATUSES
                      })
                    ) : (
                      <p className="mt-1 capitalize">{application.status}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Letter Emailed</p>
                    {isAdminView && isEditing ? (
                      renderField({
                        name: 'letterEmailed',
                        value: application.letterEmailed,
                        type: 'checkbox',
                        editable: true
                      })
                    ) : (
                      <p className="mt-1">{application.letterEmailed ? 'Yes' : 'No'}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Hard Copy Mailed</p>
                    {isAdminView && isEditing ? (
                      renderField({
                        name: 'hardCopyMailed',
                        value: application.hardCopyMailed,
                        type: 'checkbox',
                        editable: true
                      })
                    ) : (
                      <p className="mt-1">{application.hardCopyMailed ? 'Yes' : 'No'}</p>
                    )}
                  </div>
                  {(application.hardCopyMailed || (isAdminView && isEditing)) && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">Hard Copy Mailed Date</p>
                      {isAdminView && isEditing ? (
                        renderField({
                          name: 'hardCopyMailedDate',
                          value: application.hardCopyMailedDate || '',
                          type: 'date',
                          editable: true
                        })
                      ) : (
                        <p className="mt-1">
                          {application.hardCopyMailedDate ? formatDate(application.hardCopyMailedDate) : 'Not set'}
                        </p>
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
