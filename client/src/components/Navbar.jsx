import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', roles: ['ADMIN', 'PHARMACIST', 'CASHIER'] },
  { to: '/sales', label: 'Sales', roles: ['ADMIN', 'PHARMACIST', 'CASHIER'] },
  { to: '/products', label: 'Products', roles: ['ADMIN', 'PHARMACIST', 'CASHIER'] },
  { to: '/reports', label: 'Reports', roles: ['ADMIN', 'PHARMACIST'] },
];

function formatRole(role) {
  if (!role) return '';
  return role.charAt(0) + role.slice(1).toLowerCase();
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const visibleItems = NAV_ITEMS.filter((item) =>
    item.roles.includes(user?.role)
  );

  const linkClass = ({ isActive }) =>
    `px-3 py-2 rounded-md text-sm font-medium transition ${isActive
      ? 'bg-pharmacy-700 text-white'
      : 'text-pharmacy-50 hover:bg-pharmacy-700/60'
    }`;

  return (
    <nav className="bg-pharmacy-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo + desktop nav */}
          <div className="flex items-center space-x-8">
            <button
              className="text-xl font-bold flex items-center gap-2"
              onClick={() => navigate('/dashboard')}
            >
              💊 <span className="hidden sm:inline">Pharmacy Inventory</span>
            </button>

            <div className="hidden md:flex space-x-2">
              {visibleItems.map((item) => (
                <NavLink key={item.to} to={item.to} className={linkClass}>
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>

          {/* User info + logout (desktop) */}
          <div className="hidden md:flex items-center space-x-4">
            <span className="text-sm text-pharmacy-50">
              {user?.fullName} <span className="text-pharmacy-100">({formatRole(user?.role)})</span>
            </span>
            <button onClick={handleLogout} className="btn-secondary text-sm">
              Logout
            </button>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-md hover:bg-pharmacy-700 transition"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle navigation menu"
            aria-expanded={mobileOpen}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden pb-4 space-y-1">
            {visibleItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `block px-3 py-2 rounded-md text-base font-medium transition ${isActive
                    ? 'bg-pharmacy-700 text-white'
                    : 'text-pharmacy-50 hover:bg-pharmacy-700/60'
                  }`
                }
                onClick={() => setMobileOpen(false)}
              >
                {item.label}
              </NavLink>
            ))}
            <div className="border-t border-pharmacy-500 pt-3 mt-3 flex items-center justify-between px-3">
              <span className="text-sm text-pharmacy-50">
                {user?.fullName} <span className="text-pharmacy-100">({formatRole(user?.role)})</span>
              </span>
              <button onClick={handleLogout} className="btn-secondary text-sm">
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}