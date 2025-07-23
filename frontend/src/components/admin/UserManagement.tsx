import { useState, useEffect } from 'react';
import { auth } from '../../utils/api';
import { Modal } from '../common/Modal';
import DeleteConfirmationModal from './DeleteConfirmationModal';
import ResponsiveTable from '../common/ResponsiveTable';
import { UserActionsMenu } from './UserActionsMenu';


interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'user' | 'admin';
  isAdmin: boolean;
}

// Add a type guard to ensure we have the role property
function ensureUserRole(user: User): User & { role: 'user' | 'admin' } {
  return {
    ...user,
    role: user.isAdmin ? 'admin' : 'user'
  };
}

// Add this helper function at the top level
function getUserRole(user: User): 'admin' | 'user' {
  return user.isAdmin ? 'admin' : 'user';
}

// Add this helper function
function isUserAdmin(user: User): boolean {
  // Check both properties to be safe
  return user.isAdmin || user.role === 'admin';
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    isAdmin: false
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDeleteId, setUserToDeleteId] = useState<string | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [userToChangePasswordId, setUserToChangePasswordId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [userToEditId, setUserToEditId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState({
    firstName: '',
    lastName: '',
    email: ''
  });
  const [openMenuUserId, setOpenMenuUserId] = useState<string | null>(null);

  const USERS_PER_PAGE = 10;

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    // Filter and sort users whenever the users list or search term changes
    const filtered = users
      .filter(user => 
        searchTerm === '' ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => {
        // Sort by role first (admins on top)
        if (a.role === 'admin' && b.role !== 'admin') return -1;
        if (a.role !== 'admin' && b.role === 'admin') return 1;
        // Then sort by name
        return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
      });
    
    setFilteredUsers(filtered);
    setCurrentPage(1); // Reset to first page when search changes
  }, [users, searchTerm]);

  const fetchUsers = async () => {
    try {
      const response = await auth.getUsers();
      console.log('Users from API:', response); // Debug log
      setUsers(
        response.map((user: any) => ({
          ...user,
          role: user.isAdmin ? 'admin' : 'user'
        }))
      );
    } catch (error) {
      setError('Failed to fetch users');
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      await auth.createUser(formData);
      setSuccess('User created successfully');
      setFormData({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        isAdmin: false
      });
      fetchUsers();
      setShowAddModal(false);
    } catch (error) {
      setError('Failed to create user');
    }
  };

  const handleToggleAdmin = async (userId: string, makeAdmin: boolean) => {
    try {
      setOpenMenuUserId(null);
      await auth.updateUserRole(userId, makeAdmin);
      setShowEditModal(false);
      setUserToEditId(null);
      setShowDeleteModal(false);
      setUserToDeleteId(null);
      setShowPasswordModal(false);
      setUserToChangePasswordId(null);
      setSuccess('User updated successfully');
      await fetchUsers();
    } catch (error) {
      setError('Failed to update user role');
    }
  };

  // Handler to open the delete modal
  const handleDeleteClick = (user: User) => {
    setUserToDeleteId(user._id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!userToDeleteId) return;
    try {
      setOpenMenuUserId(null);
      await auth.deleteUser(userToDeleteId);
      setShowDeleteModal(false);
      setUserToDeleteId(null);
      setShowEditModal(false);
      setUserToEditId(null);
      setShowPasswordModal(false);
      setUserToChangePasswordId(null);
      setSuccess('User deleted successfully');
      await fetchUsers(); // Fetch after closing modal
    } catch (error) {
      setError('Failed to delete user');
    }
  };

  const toggleAdmin = async (userId: string) => {
    console.log('toggleAdmin called for', userId);
    const user = users.find(u => u._id === userId);
    if (!user) return;
    await handleToggleAdmin(userId, user.role !== 'admin');
  };

  const deleteUser = async (userId: string) => {
    console.log('deleteUser called for', userId);
    const user = users.find(u => u._id === userId);
    if (!user) return;
    handleDeleteClick(user);
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userToChangePasswordId) return;
    try {
      setOpenMenuUserId(null);
      await auth.changeUserPassword(userToChangePasswordId, newPassword);
      setSuccess('Password changed successfully');
      setShowPasswordModal(false);
      setUserToChangePasswordId(null);
      setNewPassword('');
      await fetchUsers(); // Fetch after closing modal
    } catch (error) {
      setError('Failed to change password');
    }
  };

  const openPasswordModal = (user: User) => {
    setUserToChangePasswordId(user._id);
    setShowPasswordModal(true);
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userToEditId) return;
    try {
      setOpenMenuUserId(null);
      await auth.updateUser(userToEditId, editFormData);
      setSuccess('User updated successfully');
      setShowEditModal(false);
      setUserToEditId(null);
      setShowDeleteModal(false);
      setUserToDeleteId(null);
      setShowPasswordModal(false);
      setUserToChangePasswordId(null);
      await fetchUsers(); // Fetch after closing modal
    } catch (error) {
      setError('Failed to update user');
    }
  };

  const openEditModal = (user: User) => {
    setUserToEditId(user._id);
    setEditFormData({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email
    });
    setShowEditModal(true);
  };

  // Pagination calculations
  const totalPages = Math.ceil(filteredUsers.length / USERS_PER_PAGE);
  const startIndex = (currentPage - 1) * USERS_PER_PAGE;
  const endIndex = startIndex + USERS_PER_PAGE;
  const currentUsers = filteredUsers.slice(startIndex, endIndex);

  const userToDelete = userToDeleteId ? users.find(u => u._id === userToDeleteId) : null;
  const userToEdit = userToEditId ? users.find(u => u._id === userToEditId) : null;
  const userToChangePassword = userToChangePasswordId ? users.find(u => u._id === userToChangePasswordId) : null;

  return (
    <div className="max-w-6xl mx-auto p-4 sm:px-6 lg:px-8">
      {/* Header with Add button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h2 className="text-xl font-semibold">All Users</h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <svg 
            className="h-5 w-5 mr-2" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 6v6m0 0v6m0-6h6m-6 0H6" 
            />
          </svg>
          Add New User
        </button>
      </div>

      {error && <div className="text-red-600 mb-4 p-4 bg-red-50 rounded-lg">{error}</div>}
      {success && <div className="text-green-600 mb-4 p-4 bg-green-50 rounded-lg">{success}</div>}

      {/* Search and Pagination Controls */}
      <div className="bg-white p-4 rounded-lg shadow mb-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="w-full sm:w-1/3">
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
            >
              Previous
            </button>
            <span className="text-sm hidden sm:inline">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
            >
              Next
            </button>
          </div>
        </div>
        <div className="text-sm text-gray-500 mt-2">
          Showing {startIndex + 1}-{Math.min(endIndex, filteredUsers.length)} of {filteredUsers.length} users
        </div>
      </div>

      {/* Users List */}
      <ResponsiveTable>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th scope="col" className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th scope="col" className="hidden lg:table-cell px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th scope="col" className="px-3 lg:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentUsers.map((user) => {
              const handleToggleAdmin = () => toggleAdmin(user._id);
              return (
                <tr 
                  key={user._id}
                  className={`hover:bg-gray-50 transition-colors duration-150 ease-in-out ${
                    isUserAdmin(user) ? 'bg-blue-50' : ''
                  }`}
                >
                  <td className="px-3 lg:px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {user.firstName} {user.lastName}
                    </div>
                    <div className="lg:hidden mt-1">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        isUserAdmin(user) ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {isUserAdmin(user) ? 'admin' : 'user'}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 lg:px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </td>
                  <td className="hidden lg:table-cell px-3 lg:px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      isUserAdmin(user) ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {isUserAdmin(user) ? 'admin' : 'user'}
                    </span>
                  </td>
                  <td className="px-3 lg:px-6 py-4 whitespace-nowrap text-right text-sm">
                    <UserActionsMenu
                      user={user}
                      show={openMenuUserId === user._id}
                      onOpen={() => setOpenMenuUserId(user._id)}
                      onClose={() => setOpenMenuUserId(null)}
                      onToggleAdmin={handleToggleAdmin}
                      onDelete={() => handleDeleteClick(user)}
                      onChangePassword={() => openPasswordModal(user)}
                      onEdit={() => openEditModal(user)}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </ResponsiveTable>

      {/* Add User Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Create New User"
      >
        <form onSubmit={handleCreateUser} className="space-y-4">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
              First Name
            </label>
            <input
              type="text"
              id="firstName"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
              Last Name
            </label>
            <input
              type="text"
              id="lastName"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              required
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isAdmin"
              checked={formData.isAdmin}
              onChange={(e) => setFormData({ ...formData, isAdmin: e.target.checked })}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label htmlFor="isAdmin" className="ml-2 block text-sm text-gray-700">
              Admin User
            </label>
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Create User
            </button>
          </div>
        </form>
      </Modal>

      <DeleteConfirmationModal
        isOpen={showDeleteModal && !!userToDelete}
        onClose={() => {
          setShowDeleteModal(false);
          setUserToDeleteId(null);
        }}
        onConfirm={confirmDelete}
        itemName={userToDelete ? `${userToDelete.firstName} ${userToDelete.lastName}` : ''}
      />

      <Modal
        isOpen={showPasswordModal && !!userToChangePassword}
        onClose={() => {
          setShowPasswordModal(false);
          setUserToChangePasswordId(null);
          setNewPassword('');
        }}
        title="Change Password"
      >
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
              New Password
            </label>
            <input
              type="password"
              id="newPassword"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              required
              minLength={6}
            />
          </div>
          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => {
               setShowPasswordModal(false);
               setUserToChangePasswordId(null);
                setNewPassword('');
              }}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Change Password
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={showEditModal && !!userToEdit}
        onClose={() => {
          setShowEditModal(false);
          setUserToEditId(null);
        }}
        title="Edit User"
      >
        <form onSubmit={handleEditUser} className="space-y-4">
          <div>
            <label htmlFor="editFirstName" className="block text-sm font-medium text-gray-700">
              First Name
            </label>
            <input
              type="text"
              id="editFirstName"
              value={editFormData.firstName}
              onChange={(e) => setEditFormData({ ...editFormData, firstName: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              required
            />
          </div>
          <div>
            <label htmlFor="editLastName" className="block text-sm font-medium text-gray-700">
              Last Name
            </label>
            <input
              type="text"
              id="editLastName"
              value={editFormData.lastName}
              onChange={(e) => setEditFormData({ ...editFormData, lastName: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              required
            />
          </div>
          <div>
            <label htmlFor="editEmail" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              id="editEmail"
              value={editFormData.email}
              onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              required
            />
          </div>
          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => {
               setShowEditModal(false);
               setUserToEditId(null);
              }}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Save Changes
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
} 