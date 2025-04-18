import { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { applications as applicationsApi, meetings as meetingsApi } from '../../utils/api';
import CSVTemplateDownload from './CSVTemplateDownload';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
}

// Add a type for the error structure
interface ImportError {
  name: string;
  error: string;
}

export default function ImportModal({ isOpen, onClose, onImportComplete }: ImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<any | null>(null);
  const [meetings, setMeetings] = useState<{ name: string }[]>([]);

  useEffect(() => {
    const fetchMeetings = async () => {
      try {
        const meetingsData = await meetingsApi.getAll();
        setMeetings(meetingsData);
      } catch (err) {
        console.error('Error fetching meetings:', err);
      }
    };
    fetchMeetings();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleImport = async () => {
    if (!file) {
      setError('Please select a file to import');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await applicationsApi.import(file);
      setResults(result);
      if (result.successful > 0) {
        onImportComplete();
      }
    } catch (err) {
      setError(err.message || 'Failed to import applications');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setResults(null);
    setError(null);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Import Applications"
    >
      <div className="space-y-6">
        {!results ? (
          <>
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Upload CSV File
                </label>
                <CSVTemplateDownload />
              </div>
              
              <div className="mt-1 px-4 py-3 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Required Fields (in order):</h4>
                <div className="space-y-3 text-xs text-gray-600">
                  <div>
                    <strong className="block text-gray-700">Personal Information:</strong>
                    <ul className="list-disc list-inside ml-2">
                      <li>email</li>
                      <li>lastName</li>
                      <li>firstName</li>
                      <li>birthdate (YYYY-MM-DD)</li>
                      <li>gender (Male/Female/Other)</li>
                    </ul>
                  </div>
                  <div>
                    <strong className="block text-gray-700">Passport Information:</strong>
                    <ul className="list-disc list-inside ml-2">
                      <li>passportNumber</li>
                      <li>passportIssuingCountry</li>
                      <li>passportExpirationDate (YYYY-MM-DD)</li>
                    </ul>
                  </div>
                  <div>
                    <strong className="block text-gray-700">Travel Information:</strong>
                    <ul className="list-disc list-inside ml-2">
                      <li>dateOfArrival (YYYY-MM-DD)</li>
                      <li>dateOfDeparture (YYYY-MM-DD)</li>
                    </ul>
                  </div>
                  <div>
                    <strong className="block text-gray-700">Company Information:</strong>
                    <ul className="list-disc list-inside ml-2">
                      <li>companyName</li>
                      <li>position</li>
                      <li>companyMailingAddress1</li>
                      <li>companyMailingAddress2 (optional)</li>
                      <li>city</li>
                      <li>state</li>
                      <li>postalCode</li>
                      <li>country</li>
                      <li>phone</li>
                      <li>fax (optional)</li>
                    </ul>
                  </div>
                  <div>
                    <strong className="block text-gray-700">Hotel Information (optional):</strong>
                    <ul className="list-disc list-inside ml-2">
                      <li>hotelName</li>
                      <li>hotelConfirmation</li>
                    </ul>
                  </div>
                  <div>
                    <strong className="block text-gray-700">Meeting Information:</strong>
                    <ul className="list-disc list-inside ml-2">
                      <li>meetingName (required - must be one of: {meetings.map(m => m.name).join(', ')})</li>
                    </ul>
                  </div>
                </div>
              </div>

              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="mt-4 block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-medium
                  file:bg-indigo-50 file:text-indigo-700
                  hover:file:bg-indigo-100"
              />
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 rounded-md p-3">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleImport}
                disabled={!file || loading}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 disabled:opacity-50"
              >
                {loading ? 'Importing...' : 'Import'}
              </button>
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-2xl font-medium text-gray-900">
                Import Complete
              </div>
              <div className="mt-2 text-sm text-gray-500">
                Total records: {results.total}
              </div>
              <div className="mt-1 text-sm text-green-600">
                Successfully imported: {results.successful}
              </div>
              {results.skipped > 0 && (
                <div className="mt-1 text-sm text-yellow-600">
                  Skipped (already exist): {results.skipped}
                </div>
              )}
              {results.failed > 0 && (
                <div className="mt-1 text-sm text-red-600">
                  Failed to import: {results.failed}
                </div>
              )}
            </div>

            {results.skippedRecords && results.skippedRecords.length > 0 && (
              <div className="mt-4 bg-yellow-50 rounded-md p-4">
                <h4 className="text-sm font-medium text-yellow-800 mb-2">Skipped Records:</h4>
                <ul className="text-sm text-yellow-700 list-disc list-inside space-y-1">
                  {results.skippedRecords.map((record: any, index: number) => (
                    <li key={index}>
                      {record.name}: {record.reason}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {results.errors && results.errors.length > 0 && (
              <div className="mt-4 bg-red-50 rounded-md p-4">
                <h4 className="text-sm font-medium text-red-800 mb-2">Errors:</h4>
                <ul className="text-sm text-red-700 list-disc list-inside space-y-1">
                  {results.errors.map((error: ImportError, index: number) => (
                    <li key={index}>
                      {error.name}: {error.error}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex justify-end gap-2 mt-6">
              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Import Another File
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
} 