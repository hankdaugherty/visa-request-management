import React from 'react';

export default function CSVTemplateDownload() {
  const headers = [
    'applicationDate',     // System field, will be auto-filled
    'email',
    'lastName',
    'firstName',
    'birthdate',
    'passportNumber',
    'passportIssuingCountry',
    'passportExpirationDate',
    'dateOfArrival',
    'dateOfDeparture',
    'gender',
    'companyName',
    'position',
    'companyMailingAddress1',
    'companyMailingAddress2',
    'city',
    'state',
    'postalCode',
    'country',
    'phone',
    'hotelName',
    'hotelConfirmation',
    'additionalInformation',
    'meetingName',  // Changed from meetingId to meetingName
    'status',
    'letterEmailed',
    'hardCopyMailed',
    'hardCopyMailedDate',
    'addressToMailHardCopy'
  ];

  const sampleData = [
    new Date().toISOString().split('T')[0], // Today's date
    'john@example.com',
    'Doe',
    'John',
    '1990-01-01',
    'AB123456',
    'US',
    '2025-01-01',
    '2024-06-01',
    '2024-06-07',
    'Male',
    'ACME Corp',
    'Engineer',
    '123 Main St',
    'Suite 100',
    'New York',
    'NY',
    '10001',
    'US',
    '+1234567890',
    'Hilton',
    'ABC123',
    'No special requirements',
    'Calgary 2026',  // Use the actual meeting name
    'pending',
    false,
    false,
    undefined,
    ''
  ];

  const generateCSV = () => {
    const csvContent = [
      headers.join(','),
      sampleData.join(',')
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', 'application_import_template.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <button
      onClick={generateCSV}
      className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
    >
      Download CSV Template
    </button>
  );
} 