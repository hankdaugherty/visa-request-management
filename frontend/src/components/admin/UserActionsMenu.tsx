import { Menu } from '@headlessui/react'
import { EllipsisVerticalIcon } from '@heroicons/react/24/solid';

export default function UserActionsMenu({ user, onToggleAdmin, onDelete, onChangePassword, onEdit }) {
    return (
        <Menu as="div" className="relative inline-block text-left">
            <div>
                <Menu.Button className="inline-flex justify-center w-full rounded-md p-2 text-sm font-medium text-gray-700 hover:bg-gray-100 focus:outline-none">
                    <EllipsisVerticalIcon className="h-5 w-5" />
                </Menu.Button>
            </div>

            <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                <div className="py-1">
                    <Menu.Item>
                        {({ active }) => (
                            <button
                                onClick={onToggleAdmin}
                                className={`${active ? 'bg-gray-100' : ''
                                    } block w-full px-4 py-2 text-sm text-gray-700 text-left`}
                            >
                                {user.role === 'admin' ? 'Revoke Admin' : 'Make Admin'}
                            </button>
                        )}
                    </Menu.Item>

                    <Menu.Item>
                        {({ active }) => (
                            <button
                                onClick={onChangePassword}
                                className={`${active ? 'bg-gray-100' : ''
                                    } block w-full px-4 py-2 text-sm text-gray-700 text-left`}
                            >
                                Change Password
                            </button>
                        )}
                    </Menu.Item>

                    <Menu.Item>
                        {({ active }) => (
                            <button
                                onClick={onEdit}
                                className={`${active ? 'bg-gray-100' : ''
                                    } block w-full px-4 py-2 text-sm text-gray-700 text-left`}
                            >
                                Edit Account Details
                            </button>
                        )}
                    </Menu.Item>

                    <Menu.Item>
                        {({ active }) => (
                            <button
                                onClick={onDelete}
                                className={`${active ? 'bg-red-100 text-red-700' : 'text-red-600'
                                    } block w-full px-4 py-2 text-sm text-left`}
                            >
                                Delete User
                            </button>
                        )}
                    </Menu.Item>
                </div>
            </Menu.Items>
        </Menu>
    );
}
