import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { auth } from '../utils/api';
import { authManager } from '../utils/auth';

console.log("API base:", import.meta.env.VITE_API_BASE_URL);

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await auth.login(email, password);
      // console.log('Login response:', response);

      localStorage.setItem('token', response.token);
      
      const tokenPayload = JSON.parse(atob(response.token.split('.')[1]));
      // console.log('Token payload:', tokenPayload); // Debug log
      
      localStorage.setItem('userId', tokenPayload.userId);
      localStorage.setItem('userRole', tokenPayload.role);

      // console.log('Stored values:', {
      //   token: localStorage.getItem('token'),
      //   userId: localStorage.getItem('userId'),
      //   userRole: localStorage.getItem('userRole')
      // });

      // Start session monitoring after successful login
      authManager.startSessionMonitoring();

      navigate('/');
    } catch (error) {
      console.error('Login error:', error);
      
      // Extract specific error message from the error object
      let errorMessage = 'Invalid email or password';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error && typeof error === 'object' && 'message' in error) {
        errorMessage = (error as any).message;
      }
      
      // Provide user-friendly messages for common errors
      if (errorMessage.includes('User not found')) {
        errorMessage = 'No account found with this email address. Please check your email or register for a new account.';
      } else if (errorMessage.includes('Incorrect password')) {
        errorMessage = 'The password you entered is incorrect. Please try again or use the "Forgot Password" link to reset your password.';
      } else if (errorMessage.includes('Invalid credentials')) {
        errorMessage = 'Invalid email or password. Please check your credentials and try again.';
      } else if (errorMessage.includes('Server error')) {
        errorMessage = 'Unable to connect to the server. Please check your internet connection and try again.';
      } else if (errorMessage.includes('Login failed')) {
        errorMessage = 'Login failed. Please try again or contact support if the problem persists.';
      } else if (errorMessage.includes('Authentication error')) {
        errorMessage = 'Authentication error. Please try logging in again.';
      }
      
      // Add specific guidance for 3GPP Portal users
      if (errorMessage.includes('User not found') || errorMessage.includes('No account found')) {
        errorMessage += ' Note: This system is separate from the official 3GPP Portal. If you have a 3GPP Portal account, you will need to create a new account here.';
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Important Disclaimer - At the very top */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-800">
                <strong>Important:</strong> This visa management system is <strong>NOT affiliated</strong> with the official 
                <a href="https://portal.3gpp.org/" target="_blank" rel="noopener noreferrer" className="underline ml-1">3GPP Portal</a>. 
                You cannot use your existing 3GPP Portal credentials here.
              </p>
            </div>
          </div>
        </div>
        
        <div>
          {/* 3GPP Logo */}
          <div className="flex justify-center mb-6">
            <img 
              src="/Logo_3GPP.svg" 
              alt="3GPP Logo" 
              className="h-16 w-auto"
            />
          </div>
          
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Visa Request Management System
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign in to access your visa application portal
          </p>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <Link to="/register" className="font-medium text-indigo-600 hover:text-indigo-500">
              register for a new account
            </Link>
          </p>
        </div>
        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">{error}</h3>
              </div>
            </div>
          </div>
        )}
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
              />
            </div>
            <div>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Password"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm">
              <Link to="/forgot-password" className="font-medium text-indigo-600 hover:text-indigo-500">
                Forgot your password?
              </Link>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${isLoading ? 'opacity-75 cursor-not-allowed' : ''}`}
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
