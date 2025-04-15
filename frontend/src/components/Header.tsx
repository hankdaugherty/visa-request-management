import { Link, useNavigate } from 'react-router-dom';

export default function Header() {
  const navigate = useNavigate();
  const isAdmin = localStorage.getItem('userRole') === 'admin';

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userRole');
    navigate('/login');
  };

  return (
    <header>
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-8">
          <Link to="/" className="text-[#6366F1] text-2xl font-bold">
            Visa Manager
          </Link>
          <nav className="flex gap-4">
            <Link to="/" className="text-gray-600 hover:text-gray-900">
              Dashboard
            </Link>
            <Link to="/applications/new" className="text-gray-600 hover:text-gray-900">
              New Application
            </Link>
            {isAdmin && (
              <Link to="/admin" className="text-gray-600 hover:text-gray-900">
                Admin
              </Link>
            )}
          </nav>
        </div>
        <button 
          onClick={handleLogout}
          className="bg-[#6366F1] text-white px-4 py-2 rounded-md hover:bg-[#4F46E5]"
        >
          Logout
        </button>
      </div>
    </header>
  );
}
