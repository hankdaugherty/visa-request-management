import { User } from '../../types';
import React from 'react';

interface UserActionsMenuProps {
  user: User;
  show: boolean;
  onOpen: () => void;
  onClose: () => void;
  onToggleAdmin: () => void;
  onDelete: () => void;
  onChangePassword: () => void;
  onEdit: () => void;
}

function isUserAdmin(user: User): boolean {
  return user.isAdmin || (user as any).role === 'admin';
}

export function UserActionsMenu({
  user,
  show,
  onOpen,
  onClose,
  onToggleAdmin,
  onDelete,
  onChangePassword,
  onEdit,
}: UserActionsMenuProps) {
  const currentRole = isUserAdmin(user) ? 'admin' : 'user';
  return (
    <div className="relative inline-block text-right">
      <button
        className="inline-flex w-full justify-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
        onClick={show ? onClose : onOpen}
      >
        Actions
        <svg className="-mr-1 h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
        </svg>
      </button>
      {show && (
        <div className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="py-1">
            <button
              onClick={() => { onEdit(); onClose(); }}
              className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              Edit Account Details
            </button>
            <button
              onClick={() => { onToggleAdmin(); onClose(); }}
              className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              Toggle Admin (currently {currentRole})
            </button>
            <button
              onClick={() => { onChangePassword(); onClose(); }}
              className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              Change Password
            </button>
          </div>
          <div className="py-1">
            <button
              onClick={() => { onDelete(); onClose(); }}
              className="flex w-full items-center px-4 py-2 text-sm text-red-700 hover:bg-red-50"
            >
              Delete User
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
