import { useParams, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Header from './common/Header';
import { applications as applicationsApi } from '../utils/api';
import { countries } from '../utils/countries';

// Constants
const GENDER_OPTIONS = ['Male', 'Female', 'Other', 'Prefer not to say'];
const APPLICATION_STATUSES = ['Pending', 'Complete', 'Rejected'];

interface ApplicationField {
  name: string;
  value: string | boolean | Date;
  type: 'text' | 'date' | 'email' | 'tel' | 'checkbox' | 'select';
  editable: boolean;
  options?: Array<string | { value: string; label: string }>;
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
  letterEmailedDate?: string;
  hardCopyMailedDate?: string;
  lastUpdatedBy?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
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
  const isAdminUser = userRole === 'admin' || isAdmin;

  const canEdit = () => {
    if (!application) {
      console.log('No application loaded');
      return false;
    }
    
    const isOwner = application.userId?._id === currentUserId;
    const isPending = application.status?.toLowerCase() === 'pending';
    const isAdminUser = userRole === 'admin' || isAdmin;
    
    console.log('Application Edit Check:', {
      isOwner,
      isPending,
      isAdmin: isAdminUser,
      applicationUserId: application.userId?._id,
      currentUserId,
      applicationStatus: application.status
    });
    
    // Admin can edit any application, regular users can only edit their own pending applications
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
      // Format dates properly before sending to the backend
      const updates = {
        ...editedFields,
        // Convert date strings to ISO format
        birthdate: editedFields.birthdate ? new Date(editedFields.birthdate).toISOString() : null,
        passportExpirationDate: editedFields.passportExpirationDate ? new Date(editedFields.passportExpirationDate).toISOString() : null,
        dateOfArrival: editedFields.dateOfArrival ? new Date(editedFields.dateOfArrival).toISOString() : null,
        dateOfDeparture: editedFields.dateOfDeparture ? new Date(editedFields.dateOfDeparture).toISOString() : null,
        updatedAt: new Date().toISOString()
      };

      const updatedApplication = await applicationsApi.update(id, updates);
      
      // Create a complete merged state that preserves all necessary fields
      const mergedApplication = {
        ...application,
        ...updatedApplication,
        userId: application?.userId,
        status: updatedApplication.status || application?.status,
        meeting: updatedApplication.meeting || application?.meeting,
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
      passportIssuingCountry: application?.passportIssuingCountry || '',
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

  // Move inputClass outside of renderField to make it accessible throughout the component
  const inputClass = "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500";

  const getCountryLabel = (countryCode: string): string => {
    const country = countries.find(c => c.value === countryCode);
    return country ? country.label : countryCode;
  };

  const renderField = (field: ApplicationField) => {
    const inputClass = "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500";

    // If not in edit mode or field is not editable, show read-only view
    if (!isEditing || !field.editable) {
      if (field.type === 'date') {
        return <div className="mt-1">{field.value ? formatDate(field.value as string) : ''}</div>;
      }
      // Special handling for country fields to show labels instead of values
      if (field.name === 'passportIssuingCountry' || field.name === 'country') {
        const countryLabel = countries.find(c => c.value === field.value)?.label || field.value;
        return <div className="mt-1">{countryLabel}</div>;
      }
      return <div className="mt-1">{field.value?.toString()}</div>;
    }

    // In edit mode, show appropriate input
    switch (field.type) {
      case 'date':
        // Convert ISO date string to YYYY-MM-DD format for date input
        const dateValue = field.value ? new Date(field.value as string).toISOString().split('T')[0] : '';
        return (
          <input
            type="date"
            value={dateValue}
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
            className="mt-1 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
        );
      case 'select':
        return (
          <select
            value={editedFields[field.name] || ''}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            className={inputClass}
          >
            {field.options?.map(option => {
              if (typeof option === 'string') {
                return <option key={option} value={option}>{option}</option>;
              } else {
                return <option key={option.value} value={option.value}>{option.label}</option>;
              }
            })}
          </select>
        );
      default:
        return (
          <input
            type={field.type}
            value={editedFields[field.name] || ''}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            className={inputClass}
          />
        );
    }
  };

  // Update the formatAddress function to display country names instead of codes
  const formatAddress = (address: {
    companyMailingAddress1: string;
    companyMailingAddress2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  }) => {
    const lines = [
      address.companyMailingAddress1,
      address.companyMailingAddress2,
      `${address.city}, ${address.state} ${address.postalCode}`,
      getCountryLabel(address.country)
    ].filter(line => line && line.trim()); // Remove empty lines

    return lines;
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-600">{error}</div>;
  if (!application) return <div>Application not found</div>;

  return (
    <>
      {!location.pathname.includes('/admin/') && <Header />}
      <main className="bg-[#F9FAFB] min-h-screen">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto py-8">
            {/* Title section outside the white box */}
            <div className="text-left mb-8">
              <h1 className="text-2xl font-bold mb-2">Application Details</h1>
            </div>

            {/* White box container */}
            <div className="bg-white shadow rounded-lg">
              {/* Action buttons - show for both admin and regular users when they can edit */}
              <div className="flex justify-end p-4">
                {canEdit() && (
                  isEditing ? (
                    <div className="space-x-2">
                      <button
                        onClick={handleSave}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => {
                          setIsEditing(false);
                          setEditedFields(application); // Reset fields on cancel
                        }}
                        className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={handleEdit}
                      className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                    >
                      Edit
                    </button>
                  )
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
                <h2 className="text-lg font-semibold mb-4 text-left">Passport Information</h2>
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
                      name: 'passportIssuingCountry',
                      value: application.passportIssuingCountry,
                      type: 'select',
                      editable: true,
                      options: [{ value: '', label: 'Select Country' }, ...countries]
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
                <h2 className="text-lg font-semibold mb-4 text-left">Travel Information</h2>
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
                <h2 className="text-lg font-semibold mb-4 text-left">Company Information</h2>
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
                  <div className="text-left">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Company Address</label>
                    {isEditing ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={editedFields.companyMailingAddress1 || ''}
                          onChange={(e) => handleFieldChange('companyMailingAddress1', e.target.value)}
                          placeholder="Address Line 1"
                          className={inputClass}
                        />
                        <input
                          type="text"
                          value={editedFields.companyMailingAddress2 || ''}
                          onChange={(e) => handleFieldChange('companyMailingAddress2', e.target.value)}
                          placeholder="Address Line 2 (optional)"
                          className={inputClass}
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={editedFields.city || ''}
                            onChange={(e) => handleFieldChange('city', e.target.value)}
                            placeholder="City"
                            className={inputClass}
                          />
                          <input
                            type="text"
                            value={editedFields.state || ''}
                            onChange={(e) => handleFieldChange('state', e.target.value)}
                            placeholder="State/Province/Region"
                            className={inputClass}
                          />
                        </div>
                        <input
                          type="text"
                          value={editedFields.postalCode || ''}
                          onChange={(e) => handleFieldChange('postalCode', e.target.value)}
                          placeholder="Postal Code"
                          className={inputClass}
                        />
                        <select
                          value={editedFields.country || ''}
                          onChange={(e) => handleFieldChange('country', e.target.value)}
                          className={inputClass}
                        >
                          <option value="">Select Country</option>
                          {countries.map(country => (
                            <option key={country.value} value={country.value}>{country.label}</option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <div className="mt-1 space-y-1">
                        {formatAddress(application).map((line, index) => (
                          <div key={index} className="text-gray-900">{line}</div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold mb-4 text-left">Contact Information</h2>
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
                  <h2 className="text-lg font-semibold mb-4 text-left">Hotel Information</h2>
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
                <h2 className="text-lg font-semibold mb-4 text-left">Additional Information</h2>
                {renderField({
                  name: 'additionalInformation',
                  value: application.additionalInformation || '',
                  type: 'text',
                  editable: true
                })}
              </div>

              {/* Application Status */}
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold mb-4 text-left">Application Status</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="text-left">
                    <label className="block text-sm font-medium text-gray-700">Created At</label>
                    <div className="mt-1">{formatDateWithTime(application.createdAt)}</div>
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
                    <label className="block text-sm font-medium text-gray-700">Letter Mailed Date</label>
                    {isEditing && isAdminView ? (
                      <input
                        type="date"
                        value={editedFields.letterEmailedDate ? formatDateForInput(editedFields.letterEmailedDate) : ''}
                        onChange={(e) => handleFieldChange('letterEmailedDate', e.target.value)}
                        className={inputClass}
                      />
                    ) : (
                      <div className="mt-1">
                        {application.letterEmailedDate ? formatDate(application.letterEmailedDate) : 'Not mailed yet'}
                      </div>
                    )}
                  </div>
                  <div className="text-left">
                    <label className="block text-sm font-medium text-gray-700">Hard Copy Mailed Date</label>
                    {isEditing && isAdminView ? (
                      <input
                        type="date"
                        value={editedFields.hardCopyMailedDate ? formatDateForInput(editedFields.hardCopyMailedDate) : ''}
                        onChange={(e) => handleFieldChange('hardCopyMailedDate', e.target.value)}
                        className={inputClass}
                      />
                    ) : (
                      <div className="mt-1">
                        {application.hardCopyMailedDate ? formatDate(application.hardCopyMailedDate) : 'Not mailed yet'}
                      </div>
                    )}
                  </div>
                  <div className="text-left">
                    <label className="block text-sm font-medium text-gray-700">Last Updated</label>
                    <div className="mt-1">{formatDateWithTime(application.updatedAt)}</div>
                  </div>
                  <div className="text-left">
                    <label className="block text-sm font-medium text-gray-700">Last Updated By</label>
                    <div className="mt-1">
                      {application.lastUpdatedBy ? (
                        <span className="text-gray-900">
                          {`${application.lastUpdatedBy.firstName} ${application.lastUpdatedBy.lastName}`}
                          <span className="text-gray-500 text-sm ml-1">({application.lastUpdatedBy.email})</span>
                        </span>
                      ) : (
                        <span className="text-gray-500">Not updated since creation</span>
                      )}
                    </div>
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
