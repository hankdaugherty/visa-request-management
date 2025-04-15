import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { applications } from '../utils/api';
import Header from './Header';

const states = [
  { value: '', label: 'Select State' },
  { value: 'CA', label: 'California' },
  { value: 'TX', label: 'Texas' },
  // Add more states as needed
];

const countries = [
  { value: '', label: 'Select Country' },
  { value: 'US', label: 'United States' },
  { value: 'CN', label: 'China' },
  // Add more countries as needed
];

const genders = [
  { value: '', label: 'Select Gender' },
  { value: 'Male', label: 'Male' },
  { value: 'Female', label: 'Female' },
  { value: 'Other', label: 'Other' },
];

export default function ApplicationForm() {
  const [formData, setFormData] = useState({
    email: '',
    lastName: '',
    firstName: '',
    birthdate: '',
    passportNumber: '',
    passportIssuingCountry: '',
    passportExpirationDate: '',
    dateOfArrival: '',
    dateOfDeparture: '',
    gender: '',
    companyName: '',
    position: '',
    companyMailingAddress1: '',
    companyMailingAddress2: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
    phone: '',
    fax: '',
    hotelName: '',
    hotelConfirmation: '',
    additionalInformation: '',
    pickUpInOrlando: false,
    letterEmailed: false,
    hardCopyMailed: false,
    addressToMailHardCopy: '',
    hardCopyMailedDate: '',
    additionalDocumentation: [],
  });

  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      console.log('Starting form submission...'); // Debug log

      // Clean and validate the form data
      const submissionData = {
        ...formData,
        // Format dates properly
        birthdate: new Date(formData.birthdate).toISOString(),
        passportExpirationDate: new Date(formData.passportExpirationDate).toISOString(),
        dateOfArrival: new Date(formData.dateOfArrival).toISOString(),
        dateOfDeparture: new Date(formData.dateOfDeparture).toISOString(),
      };

      console.log('Submission data:', submissionData); // Debug log

      // Validate required fields
      const requiredFields = [
        'firstName',
        'lastName',
        'email',
        'birthdate',
        'gender',
        'passportNumber',
        'passportIssuingCountry',
        'passportExpirationDate',
        'dateOfArrival',
        'dateOfDeparture',
        'companyName',
        'position',
        'companyMailingAddress1',
        'city',
        'state',
        'postalCode',
        'country',
        'phone'
      ];

      const missingFields = requiredFields.filter(field => !submissionData[field]);
      if (missingFields.length > 0) {
        throw new Error(`Please fill in all required fields: ${missingFields.join(', ')}`);
      }

      console.log('Calling applications.create...'); // Debug log
      const response = await applications.create(submissionData);
      console.log('Response from server:', response); // Debug log

      alert('Application submitted successfully!');
      navigate('/dashboard');
    } catch (error) {
      console.error('Submission error:', error);
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
      alert(`Failed to submit application: ${error instanceof Error ? error.message : 'Please try again'}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Header />
      <main className="bg-[#F9FAFB] min-h-screen">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto py-8">
            <div className="text-left mb-8">
              <h1 className="text-2xl font-bold mb-2">Visa Application</h1>
              <p className="text-gray-600">
                Please fill in all the required information for your visa application.
              </p>
            </div>

            {/* Error message */}
            {error && (
              <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 text-left">
                <strong className="font-bold">Error: </strong>
                <span className="block sm:inline">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-8">
              {/* Personal Information */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-left mb-4">Personal Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="text-left">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      required
                      className="w-full border rounded p-2"
                    />
                  </div>
                  <div className="text-left">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      required
                      className="w-full border rounded p-2"
                    />
                  </div>
                  <div className="text-left">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full border rounded p-2"
                    />
                  </div>
                  <div className="text-left">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      name="birthdate"
                      value={formData.birthdate}
                      onChange={handleChange}
                      required
                      className="w-full border rounded p-2"
                    />
                  </div>
                  <div className="text-left">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Gender
                    </label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      required
                      className="w-full border rounded p-2"
                    >
                      {genders.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Passport Information */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-left mb-4">Passport Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="text-left">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Passport Number
                    </label>
                    <input
                      type="text"
                      name="passportNumber"
                      value={formData.passportNumber}
                      onChange={handleChange}
                      required
                      className="w-full border rounded p-2"
                    />
                  </div>
                  <div className="text-left">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Passport Issuing Country
                    </label>
                    <select
                      name="passportIssuingCountry"
                      value={formData.passportIssuingCountry}
                      onChange={handleChange}
                      required
                      className="w-full border rounded p-2"
                    >
                      {countries.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="text-left">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Passport Expiration Date
                    </label>
                    <input
                      type="date"
                      name="passportExpirationDate"
                      value={formData.passportExpirationDate}
                      onChange={handleChange}
                      required
                      className="w-full border rounded p-2"
                    />
                  </div>
                </div>
              </div>

              {/* Travel Information */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-left mb-4">Travel Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="text-left">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date of Arrival
                    </label>
                    <input
                      type="date"
                      name="dateOfArrival"
                      value={formData.dateOfArrival}
                      onChange={handleChange}
                      required
                      className="w-full border rounded p-2"
                    />
                  </div>
                  <div className="text-left">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date of Departure
                    </label>
                    <input
                      type="date"
                      name="dateOfDeparture"
                      value={formData.dateOfDeparture}
                      onChange={handleChange}
                      required
                      className="w-full border rounded p-2"
                    />
                  </div>
                </div>
              </div>

              {/* Company Information */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-left mb-4">Company Information</h2>
                <div className="grid grid-cols-1 gap-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="text-left">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Company Name
                      </label>
                      <input
                        type="text"
                        name="companyName"
                        value={formData.companyName}
                        onChange={handleChange}
                        required
                        className="w-full border rounded p-2"
                      />
                    </div>
                    <div className="text-left">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Position
                      </label>
                      <input
                        type="text"
                        name="position"
                        value={formData.position}
                        onChange={handleChange}
                        required
                        className="w-full border rounded p-2"
                      />
                    </div>
                  </div>
                  <div className="text-left">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Company Address Line 1
                    </label>
                    <input
                      type="text"
                      name="companyMailingAddress1"
                      value={formData.companyMailingAddress1}
                      onChange={handleChange}
                      required
                      className="w-full border rounded p-2"
                    />
                  </div>
                  <div className="text-left">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Company Address Line 2
                    </label>
                    <input
                      type="text"
                      name="companyMailingAddress2"
                      value={formData.companyMailingAddress2}
                      onChange={handleChange}
                      className="w-full border rounded p-2"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="text-left">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        City
                      </label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        required
                        className="w-full border rounded p-2"
                      />
                    </div>
                    <div className="text-left">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        State/Province
                      </label>
                      <select
                        name="state"
                        value={formData.state}
                        onChange={handleChange}
                        required
                        className="w-full border rounded p-2"
                      >
                        {states.map(option => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="text-left">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Postal Code
                      </label>
                      <input
                        type="text"
                        name="postalCode"
                        value={formData.postalCode}
                        onChange={handleChange}
                        required
                        className="w-full border rounded p-2"
                      />
                    </div>
                    <div className="text-left">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Country
                      </label>
                      <select
                        name="country"
                        value={formData.country}
                        onChange={handleChange}
                        required
                        className="w-full border rounded p-2"
                      >
                        {countries.map(option => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="text-left">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        required
                        className="w-full border rounded p-2"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Hotel Information */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-left mb-4">Hotel Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="text-left">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Hotel Name
                    </label>
                    <input
                      type="text"
                      name="hotelName"
                      value={formData.hotelName}
                      onChange={handleChange}
                      className="w-full border rounded p-2"
                    />
                  </div>
                  <div className="text-left">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Hotel Confirmation Number
                    </label>
                    <input
                      type="text"
                      name="hotelConfirmation"
                      value={formData.hotelConfirmation}
                      onChange={handleChange}
                      className="w-full border rounded p-2"
                    />
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-left mb-4">Additional Information</h2>
                <div className="text-left">
                  <textarea
                    name="additionalInformation"
                    value={formData.additionalInformation}
                    onChange={handleChange}
                    rows={4}
                    className="w-full border rounded p-2"
                    placeholder="Any additional information you'd like to provide..."
                  />
                </div>
              </div>

              <div className="flex justify-start">
                <button
                  type="submit"
                  disabled={submitting}
                  className={`bg-[#6366F1] text-white px-6 py-3 rounded-md hover:bg-[#4F46E5] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                    submitting ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {submitting ? 'Submitting...' : 'Submit Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </>
  );
}
