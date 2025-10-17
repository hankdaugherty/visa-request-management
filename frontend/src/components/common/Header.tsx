import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { authManager } from '../../utils/auth';

export default function Header() {
  const navigate = useNavigate();
  const isAdmin = authManager.getUserRole() === 'admin';
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    authManager.logout();
  };

  return (
    <header className="bg-white shadow relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex-shrink-0 flex items-center">
            <Link to="/" className="flex items-center space-x-3">
              <img 
                src="/Logo_3GPP.svg" 
                alt="3GPP Logo" 
                className="h-8 w-auto"
              />
              <span className="text-gray-900 text-lg sm:text-xl font-semibold">
                Visa Request Management System
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-4">
            <Link
              to="/"
              className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
            >
              Dashboard
            </Link>
            <Link
              to="/applications/new"
              className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
            >
              New Application
            </Link>
            {isAdmin && (
              <Link
                to="/admin"
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Admin
              </Link>
            )}
            <button
              onClick={handleLogout}
              className="ml-4 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 text-sm font-medium"
            >
              Logout
            </button>
          </nav>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
            aria-expanded="false"
          >
            <span className="sr-only">Open main menu</span>
            {!isMobileMenuOpen ? (
              <svg
                className="block h-6 w-6"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            ) : (
              <svg
                className="block h-6 w-6"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-16 inset-x-0 z-50">
          <div className="bg-white border-b border-gray-200 shadow-lg mx-4">
            <nav className="flex flex-col">
              <Link
                to="/"
                className="px-5 py-4 text-base font-medium text-gray-900 hover:bg-gray-50 border-b border-gray-200 text-left"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Dashboard
              </Link>
              <Link
                to="/applications/new"
                className="px-5 py-4 text-base font-medium text-gray-900 hover:bg-gray-50 border-b border-gray-200 text-left"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                New Application
              </Link>
              {isAdmin && (
                <Link
                  to="/admin"
                  className="px-5 py-4 text-base font-medium text-gray-900 hover:bg-gray-50 border-b border-gray-200 text-left"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Admin
                </Link>
              )}
              <button
                onClick={() => {
                  handleLogout();
                  setIsMobileMenuOpen(false);
                }}
                className="px-5 py-4 text-base font-medium text-red-600 hover:bg-gray-50 text-left"
              >
                Logout
              </button>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}
