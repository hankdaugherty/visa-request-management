import { Menu, Transition } from '@headlessui/react'
import { Fragment } from 'react';
import { User } from '../../types';

interface UserActionsMenuProps {
    user: User;
    onToggleAdmin: () => void;
    onDelete: () => void;
    onChangePassword: () => void;
    onEdit: () => void;
}

export function UserActionsMenu({
    user,
    onToggleAdmin,
    onDelete,
    onChangePassword,
    onEdit,
}: UserActionsMenuProps) {
    return (
        <div className="relative inline-block text-right">
            <Menu as="div" className="relative inline-block text-left">
                <Menu.Button className="inline-flex w-full justify-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
                    Actions
                    <svg className="-mr-1 h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                    </svg>
                </Menu.Button>

                <Transition
                    as={Fragment}
                    enter="transition ease-out duration-100"
                    enterFrom="transform opacity-0 scale-95"
                    enterTo="transform opacity-100 scale-100"
                    leave="transition ease-in duration-75"
                    leaveFrom="transform opacity-100 scale-100"
                    leaveTo="transform opacity-0 scale-95"
                >
                    <Menu.Items className="absolute right-0 z-10 mt-2 w-56 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                        <div className="py-1">
                            <Menu.Item>
                                {({ active }) => (
                                    <button
                                        onClick={onEdit}
                                        className={`${
                                            active ? 'bg-gray-100' : ''
                                        } flex w-full items-center px-4 py-2 text-sm text-gray-700`}
                                    >
                                        Edit Account Details
                                    </button>
                                )}
                            </Menu.Item>
                            <Menu.Item>
                                {({ active }) => (
                                    <button
                                        onClick={onToggleAdmin}
                                        className={`${
                                            active ? 'bg-gray-100' : ''
                                        } flex w-full items-center px-4 py-2 text-sm text-gray-700`}
                                    >
                                        Toggle Admin (currently {user.isAdmin ? 'admin' : 'user'})
                                    </button>
                                )}
                            </Menu.Item>
                            <Menu.Item>
                                {({ active }) => (
                                    <button
                                        onClick={onChangePassword}
                                        className={`${
                                            active ? 'bg-gray-100' : ''
                                        } flex w-full items-center px-4 py-2 text-sm text-gray-700`}
                                    >
                                        Change Password
                                    </button>
                                )}
                            </Menu.Item>
                        </div>
                        <div className="py-1">
                            <Menu.Item>
                                {({ active }) => (
                                    <button
                                        onClick={onDelete}
                                        className={`${
                                            active ? 'bg-red-50' : ''
                                        } flex w-full items-center px-4 py-2 text-sm text-red-700`}
                                    >
                                        Delete User
                                    </button>
                                )}
                            </Menu.Item>
                        </div>
                    </Menu.Items>
                </Transition>
            </Menu>
        </div>
    );
}
