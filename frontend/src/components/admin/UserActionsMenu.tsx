import { Menu, Transition } from '@headlessui/react'
import { EllipsisVerticalIcon } from '@heroicons/react/24/solid';
import { Fragment } from 'react';
import { User } from '../../types';

function getUserRole(user: User): 'admin' | 'user' {
    return user.isAdmin ? 'admin' : 'user';
}

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
    const currentRole = getUserRole(user);
    const toggleText = `Toggle Admin (currently ${currentRole})`;

    return (
        <Menu as="div" className="relative inline-block text-left">
            <div>
                <Menu.Button className="inline-flex justify-center w-full rounded-md p-2 text-sm font-medium text-gray-700 hover:bg-gray-100 focus:outline-none">
                    <EllipsisVerticalIcon className="h-5 w-5" />
                </Menu.Button>
            </div>

            <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
            >
                <Menu.Items className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                    <div className="py-1">
                        <Menu.Item>
                            {({ active }) => (
                                <button
                                    onClick={onEdit}
                                    className={`${
                                        active ? 'bg-gray-100' : ''
                                    } w-full text-left px-4 py-2 text-sm text-gray-700`}
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
                                    } w-full text-left px-4 py-2 text-sm text-gray-700`}
                                >
                                    {toggleText}
                                </button>
                            )}
                        </Menu.Item>
                        <Menu.Item>
                            {({ active }) => (
                                <button
                                    onClick={onChangePassword}
                                    className={`${
                                        active ? 'bg-gray-100' : ''
                                    } w-full text-left px-4 py-2 text-sm text-gray-700`}
                                >
                                    Change Password
                                </button>
                            )}
                        </Menu.Item>
                        <Menu.Item>
                            {({ active }) => (
                                <button
                                    onClick={onDelete}
                                    className={`${
                                        active ? 'bg-red-100' : ''
                                    } w-full text-left px-4 py-2 text-sm text-red-700`}
                                >
                                    Delete User
                                </button>
                            )}
                        </Menu.Item>
                    </div>
                </Menu.Items>
            </Transition>
        </Menu>
    );
}
