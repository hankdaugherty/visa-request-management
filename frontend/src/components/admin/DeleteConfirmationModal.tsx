import React, { useState } from 'react';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemName: string;
}

export default function DeleteConfirmationModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  itemName 
}: DeleteConfirmationModalProps) {
  const [confirmText, setConfirmText] = useState('');

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (confirmText === 'Delete') {
      onConfirm();
      setConfirmText('');
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3 text-center">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Delete Application
          </h3>
          <div className="mt-2 px-7 py-3">
            <p className="text-sm text-gray-500">
              Are you sure you want to delete this application for {itemName}? 
              This action cannot be undone.
            </p>
            <div className="mt-4">
              <input
                type="text"
                className="mt-2 px-3 py-2 border border-gray-300 rounded-md w-full"
                placeholder="Type 'Delete' to confirm"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 px-4 py-3">
            <button
              onClick={onClose}
              className="bg-gray-200 px-4 py-2 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={confirmText !== 'Delete'}
              className={`px-4 py-2 rounded-md text-sm font-medium text-white
                ${confirmText === 'Delete' 
                  ? 'bg-red-600 hover:bg-red-700' 
                  : 'bg-red-300 cursor-not-allowed'}`}
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 