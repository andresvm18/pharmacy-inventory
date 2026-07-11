import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-pharmacy-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <h1 className="text-2xl font-bold cursor-pointer" onClick={() => navigate('/dashboard')}>
              💊 Pharmacy Inventory
            </h1>
            <div className="flex space-x-4">
              <NavLink href="/dashboard" label="Dashboard" />
              <NavLink href="/sales" label="Sales" />
              <NavLink href="/products" label="Products" />
              <NavLink href="/reports" label="Reports" />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <span className="text-sm">
              {user?.username} <span className="text-xs bg-pharmacy-700 px-2 py-1 rounded">
                {user?.role}
              </span>
            </span>
            <button
              onClick={handleLogout}
              className="btn-secondary text-sm"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

function NavLink({ href, label }) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(href)}
      className="hover:bg-pharmacy-700 px-3 py-2 rounded-md text-sm font-medium transition"
    >
      {label}
    </button>
  );
}